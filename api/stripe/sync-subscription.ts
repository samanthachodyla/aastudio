// Vercel Serverless Function — finalize a logged-in member's subscription the
// instant they return from Stripe Checkout, without waiting on the async webhook.
// The signed-in user posts { sid } (their just-completed Checkout session id); we
// verify the session is paid AND belongs to them, then mirror the subscription
// into our `subscriptions` table. This closes the window where RequireAuth would
// otherwise bounce a just-paid customer back to /pricing before the webhook lands.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://czbzunpabgmwpldkrcex.supabase.co";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const secret = process.env.STRIPE_SECRET_KEY || "";
    const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!secret || !svc) return res.status(500).json({ error: "Server not configured" });

    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return res.status(401).json({ error: "Not signed in" });

    const supabase = createClient(SUPABASE_URL, svc);
    const { data: ures, error: uerr } = await supabase.auth.getUser(token);
    if (uerr || !ures.user) return res.status(401).json({ error: "Invalid session" });
    const user = ures.user;

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const sid = String(body.sid || "").trim();
    if (!sid) return res.status(400).json({ error: "Missing checkout reference." });

    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.retrieve(sid);

    // Only record a session that this user actually paid for. checkout.ts stamps
    // the buyer's user_id into the session metadata — reject anything else.
    if (session.metadata?.user_id && session.metadata.user_id !== user.id) {
      return res.status(403).json({ error: "This checkout doesn't belong to you." });
    }
    if (session.payment_status !== "paid" && session.status !== "complete") {
      // Not finished yet — let the client keep polling; the webhook will also land.
      return res.status(202).json({ pending: true });
    }

    const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (!subId || !customerId) {
      return res.status(202).json({ pending: true });
    }

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
  } catch (e: unknown) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}
