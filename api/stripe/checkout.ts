// Vercel Serverless Function — start a Stripe Checkout session for a subscription.
// The signed-in user posts { plan, cycle }; we create (or reuse) their Stripe
// customer and return a hosted Checkout URL. Promotion codes are enabled so the
// studio can hand out discount / free-access codes from the Stripe dashboard.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://czbzunpabgmwpldkrcex.supabase.co";
const APP_URL = process.env.APP_URL || "https://allegoryartstudio.com";

// Map plan+cycle -> Stripe Price ID (set these as env vars in Vercel).
const PRICE_IDS: Record<string, string | undefined> = {
  "starter:monthly": process.env.STRIPE_PRICE_STARTER_MONTHLY,
  "starter:annual": process.env.STRIPE_PRICE_STARTER_ANNUAL,
  "pro:monthly": process.env.STRIPE_PRICE_PRO_MONTHLY,
  "pro:annual": process.env.STRIPE_PRICE_PRO_ANNUAL,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const secret = process.env.STRIPE_SECRET_KEY || "";
    if (!secret) return res.status(500).json({ error: "Server missing STRIPE_SECRET_KEY" });
    const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!svc) return res.status(500).json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY" });

    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return res.status(401).json({ error: "Not signed in" });

    const supabase = createClient(SUPABASE_URL, svc);
    const { data: ures, error: uerr } = await supabase.auth.getUser(token);
    if (uerr || !ures.user) return res.status(401).json({ error: "Invalid session" });
    const user = ures.user;

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const stripe = new Stripe(secret);

    // Finalize a just-completed checkout synchronously (called on return from
    // Stripe Checkout) so the member isn't bounced to /pricing while the async
    // webhook is still in flight. Handled here rather than in its own endpoint to
    // stay within the Hobby plan's 12-serverless-function limit.
    if (body.action === "sync") {
      const sid = String(body.sid || "").trim();
      if (!sid) return res.status(400).json({ error: "Missing checkout reference." });
      const session = await stripe.checkout.sessions.retrieve(sid);
      // Only record a session that this user actually paid for.
      if (session.metadata?.user_id && session.metadata.user_id !== user.id) {
        return res.status(403).json({ error: "This checkout doesn't belong to you." });
      }
      if (session.payment_status !== "paid" && session.status !== "complete") {
        return res.status(202).json({ pending: true });
      }
      const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      if (!subId || !customerId) return res.status(202).json({ pending: true });
      const sub = await stripe.subscriptions.retrieve(subId);
      await supabase.from("subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        plan: sub.metadata?.plan || session.metadata?.plan || null,
        cycle: sub.metadata?.cycle || session.metadata?.cycle || null,
        status: sub.status,
        current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
        cancel_at_period_end: !!sub.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      return res.status(200).json({ ok: true, status: sub.status });
    }

    const plan = String(body.plan || "");
    const cycle = String(body.cycle || "");
    const price = PRICE_IDS[`${plan}:${cycle}`];
    if (!price) {
      return res.status(400).json({ error: "Unknown plan", detail: `No price configured for ${plan}/${cycle}` });
    }

    // Reuse an existing Stripe customer for this user if we have one.
    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const hadCustomer = !!subRow?.stripe_customer_id;
    let customerId = subRow?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from("subscriptions")
        .upsert({ user_id: user.id, stripe_customer_id: customerId, status: "inactive" }, { onConflict: "user_id" });
    }

    // Guard against double-charging: if this customer already has a live
    // subscription, NEVER open a new Checkout — a second session would create a
    // second subscription and charge them again. This also closes the window
    // right after payment, before our webhook has recorded the subscription.
    if (hadCustomer && customerId) {
      const existing = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
      const live = existing.data.find((s) => ["active", "trialing", "past_due"].includes(s.status));
      if (live) return res.status(200).json({ alreadySubscribed: true });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      // Promo codes only on monthly plans. Guards against a "100% off once"
      // coupon (e.g. the Labor Day first-month-free code) being applied to an
      // annual plan, where the single free invoice would be a whole free year.
      allow_promotion_codes: cycle !== "annual",
      billing_address_collection: "auto",
      success_url: `${APP_URL}/dashboard?checkout=success&sid={CHECKOUT_SESSION_ID}&plan=${plan}&cycle=${cycle}`,
      cancel_url: `${APP_URL}/pricing?checkout=cancel`,
      metadata: { user_id: user.id, plan, cycle },
      subscription_data: { metadata: { user_id: user.id, plan, cycle } },
    });

    return res.status(200).json({ url: session.url });
  } catch (e: unknown) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}
