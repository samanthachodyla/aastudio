// Vercel Serverless Function — completes the pay-first signup. Given a paid
// Checkout session id and the password the new member just chose, it verifies
// payment, ensures their account exists, and sets that password. The client then
// signs them in. Foolproof: no email round-trip is required to get into the app.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://czbzunpabgmwpldkrcex.supabase.co";

// Resolve an auth user id from an email (scans the admin user list — fine at this
// scale). Used to avoid creating a duplicate when the webhook already made them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUserIdByEmail(supabase: any, email: string): Promise<string | null> {
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = data.users.find((x: any) => (x.email || "").toLowerCase() === email);
    if (u) return u.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const secret = process.env.STRIPE_SECRET_KEY || "";
    const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!secret || !svc) return res.status(500).json({ error: "Server not configured" });

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const sid = String(body.sid || "").trim();
    const password = String(body.password || "");
    if (!sid) return res.status(400).json({ error: "Missing checkout reference." });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });

    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.retrieve(sid);
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return res.status(402).json({ error: "This checkout isn't completed yet." });
    }
    const email = (session.customer_details?.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ error: "No email found on the checkout." });

    const supabase = createClient(SUPABASE_URL, svc);
    let userId = await getUserIdByEmail(supabase, email);
    if (userId) {
      const { error } = await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true });
      if (error) return res.status(500).json({ error: error.message });
    } else {
      const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) {
        // Race with the webhook creating them first — retry as an update.
        userId = await getUserIdByEmail(supabase, email);
        if (!userId) return res.status(500).json({ error: error.message });
        const upd = await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true });
        if (upd.error) return res.status(500).json({ error: upd.error.message });
      } else {
        userId = data.user?.id ?? null;
      }
    }

    // Record the subscription now so access is immediate — don't wait on the
    // webhook. Skip if they already have another live subscription (safety).
    try {
      const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      if (userId && subId && customerId) {
        const { data: existing } = await supabase
          .from("subscriptions").select("stripe_subscription_id,status").eq("user_id", userId).maybeSingle();
        const hasOther = existing
          && ["active", "trialing", "comp", "past_due"].includes(existing.status)
          && existing.stripe_subscription_id && existing.stripe_subscription_id !== subId;
        if (!hasOther) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await supabase.from("subscriptions").upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            plan: sub.metadata?.plan || session.metadata?.plan || null,
            cycle: sub.metadata?.cycle || session.metadata?.cycle || null,
            status: sub.status,
            current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
            cancel_at_period_end: !!sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
        }
      }
    } catch { /* the webhook will still record it */ }

    return res.status(200).json({ ok: true, email });
  } catch (e: unknown) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}
