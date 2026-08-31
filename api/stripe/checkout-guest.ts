// Vercel Serverless Function — start a Stripe Checkout for a NEW member with no
// account yet. Stripe collects their email + card; the account is created on
// payment (webhook) and finished on the /welcome page. Used by the homepage
// plan buttons for the pay-first signup flow.
import Stripe from "stripe";

const APP_URL = process.env.APP_URL || "https://allegoryartstudio.com";

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

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const plan = String(body.plan || "");
    const cycle = String(body.cycle || "");
    const price = PRICE_IDS[`${plan}:${cycle}`];
    if (!price) return res.status(400).json({ error: "Unknown plan", detail: `No price for ${plan}/${cycle}` });

    const stripe = new Stripe(secret);
    // No `customer` — Stripe collects the email and creates the customer itself.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      // Promo codes only on monthly plans. Guards against a "100% off once"
      // coupon (e.g. the Labor Day first-month-free code) being applied to an
      // annual plan, where the single free invoice would be a whole free year.
      allow_promotion_codes: cycle !== "annual",
      billing_address_collection: "auto",
      success_url: `${APP_URL}/welcome?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/?checkout=cancel`,
      metadata: { plan, cycle, flow: "guest" },
      subscription_data: { metadata: { plan, cycle } },
    });

    return res.status(200).json({ url: session.url });
  } catch (e: unknown) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}
