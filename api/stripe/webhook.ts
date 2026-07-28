// Vercel Serverless Function — Stripe webhook. Verifies the signature against
// the raw request body, then mirrors subscription state into our `subscriptions`
// table (service role). This is the source of truth for who has active access.
//
// Set the endpoint in Stripe to: https://allegoryartstudio.com/api/stripe/webhook
// and subscribe to: checkout.session.completed, customer.subscription.created,
// customer.subscription.updated, customer.subscription.deleted.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// We need the raw body to verify the Stripe signature — disable body parsing.
export const config = { api: { bodyParser: false } };

const SUPABASE_URL = process.env.SUPABASE_URL || "https://czbzunpabgmwpldkrcex.supabase.co";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readRawBody(readable: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowFromSubscription(userId: string, customerId: string, sub: Stripe.Subscription) {
  const meta = sub.metadata || {};
  return {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    plan: meta.plan || null,
    cycle: meta.cycle || null,
    status: sub.status, // active | trialing | past_due | canceled | unpaid | incomplete...
    current_period_end: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: !!sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  const secret = process.env.STRIPE_SECRET_KEY || "";
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!secret || !whSecret) return res.status(500).json({ error: "Server missing Stripe keys" });

  const stripe = new Stripe(secret);
  const sig = req.headers["stripe-signature"];

  let event: Stripe.Event;
  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch (e: unknown) {
    return res.status(400).send(`Webhook Error: ${e instanceof Error ? e.message : "bad signature"}`);
  }

  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || "");

  // Resolve our user id from subscription metadata, or fall back to the customer.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolveUserId = async (sub: Stripe.Subscription, customerId: string): Promise<string | null> => {
    if (sub.metadata?.user_id) return sub.metadata.user_id;
    const { data } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    return data?.user_id ?? null;
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.metadata?.user_id;
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
        const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
        if (userId && subId && customerId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await supabase.from("subscriptions").upsert(rowFromSubscription(userId, customerId, sub), { onConflict: "user_id" });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (customerId) {
          const userId = await resolveUserId(sub, customerId);
          if (userId) {
            const row = rowFromSubscription(userId, customerId, sub);
            if (event.type === "customer.subscription.deleted") row.status = "canceled";
            await supabase.from("subscriptions").upsert(row, { onConflict: "user_id" });
          }
        }
        break;
      }
      default:
        break;
    }
    return res.status(200).json({ received: true });
  } catch (e: unknown) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}
