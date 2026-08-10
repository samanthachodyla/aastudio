// Vercel Serverless Function — Stripe webhook. Verifies the signature against
// the raw request body, then mirrors subscription state into our `subscriptions`
// table (service role). This is the source of truth for who has active access.
//
// Set the endpoint in Stripe to: https://allegoryartstudio.com/api/stripe/webhook
// and subscribe to: checkout.session.completed, customer.subscription.created,
// customer.subscription.updated, customer.subscription.deleted.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const META_PIXEL_ID = process.env.META_PIXEL_ID || "1583309690064748";
const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN || "";

// Meta Conversions API "Purchase" — shares event_id (purchase_<session>) with the
// browser Pixel fired on the post-checkout success page, so Meta de-dupes them.
// No-op until META_CAPI_TOKEN is set. Value comes from the actual amount charged
// (after any discount code), so 100%-off signups report $0.
async function firePurchaseCapi(session: Stripe.Checkout.Session) {
  if (!META_CAPI_TOKEN || !META_PIXEL_ID) return;
  const email = (session.customer_details?.email || "").trim().toLowerCase();
  const userData: Record<string, unknown> = {};
  if (email) userData.em = [crypto.createHash("sha256").update(email).digest("hex")];
  try {
    await fetch(`https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_CAPI_TOKEN)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: `purchase_${session.id}`,
          action_source: "website",
          event_source_url: `${process.env.APP_URL || "https://allegoryartstudio.com"}/dashboard`,
          user_data: userData,
          custom_data: {
            currency: (session.currency || "usd").toUpperCase(),
            value: (session.amount_total ?? 0) / 100,
          },
        }],
      }),
    });
  } catch { /* CAPI is best-effort */ }
}

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

  // Manually comped accounts (free Pro granted in the DB) must never be
  // downgraded by a Stripe event — e.g. an old incomplete/canceled subscription
  // cleaning itself up would otherwise wipe out their access.
  const isComped = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("subscriptions").select("status").eq("user_id", userId).maybeSingle();
    return data?.status === "comp";
  };

  // Resolve (or create) the auth user for a pay-first "guest" checkout, keyed by
  // the email Stripe collected. Scans the admin user list (fine at this scale).
  const getUserIdByEmail = async (email: string): Promise<string | null> => {
    for (let page = 1; page <= 25; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !data?.users?.length) return null;
      const u = data.users.find((x) => (x.email || "").toLowerCase() === email);
      if (u) return u.id;
      if (data.users.length < 200) return null;
    }
    return null;
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
        const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
        const email = (s.customer_details?.email || "").toLowerCase().trim();

        // Resolve the account. Logged-in checkouts carry user_id in metadata;
        // pay-first (guest) checkouts don't, so create/link the account by email.
        let userId: string | null = s.metadata?.user_id || null;
        if (!userId && email) {
          userId = await getUserIdByEmail(email);
          if (!userId) {
            const { data } = await supabase.auth.admin.createUser({ email, email_confirm: true });
            userId = data?.user?.id ?? null;
          }
        }

        if (userId && subId && customerId) {
          // Never double-charge: if this account already has a live subscription
          // that ISN'T this one, cancel this new one and refund it.
          const { data: existing } = await supabase
            .from("subscriptions").select("stripe_subscription_id, status").eq("user_id", userId).maybeSingle();
          const dup = existing
            && ["active", "trialing", "comp", "past_due"].includes(existing.status)
            && existing.stripe_subscription_id
            && existing.stripe_subscription_id !== subId;
          if (dup) {
            try { await stripe.subscriptions.cancel(subId); } catch { /* best-effort */ }
            try {
              const invId = typeof s.invoice === "string" ? s.invoice : s.invoice?.id;
              if (invId) {
                const inv = await stripe.invoices.retrieve(invId);
                const pi = typeof inv.payment_intent === "string" ? inv.payment_intent : inv.payment_intent?.id;
                if (pi) await stripe.refunds.create({ payment_intent: pi });
              }
            } catch { /* best-effort refund; flag in Stripe if it fails */ }
            console.error("[webhook] duplicate subscription auto-canceled + refunded", { userId, subId });
            break; // leave the existing good subscription untouched
          }

          const sub = await stripe.subscriptions.retrieve(subId);
          await supabase.from("subscriptions").upsert(rowFromSubscription(userId, customerId, sub), { onConflict: "user_id" });
        }
        await firePurchaseCapi(s);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (customerId) {
          const userId = await resolveUserId(sub, customerId);
          if (userId && !(await isComped(userId))) {
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
