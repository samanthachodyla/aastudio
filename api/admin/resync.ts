// Vercel Serverless Function — admin-only. Reconciles the subscriptions table
// with the source of truth (Stripe): for every LIVE Stripe subscription
// (active / trialing / past_due) it makes sure the member's row grants access.
// This heals drift where someone paid but their row is stuck (e.g. "incomplete"),
// leaving them locked out. It is grant-only: it never revokes access and never
// overwrites a manual comp.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://czbzunpabgmwpldkrcex.supabase.co";
const LIVE = ["active", "trialing", "past_due"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUserIdByEmail(supabase: any, email: string): Promise<string | null> {
  if (!email) return null;
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

    // Admins only — verify the caller's token maps to an admin profile.
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return res.status(401).json({ error: "Not signed in" });
    const supabase = createClient(SUPABASE_URL, svc);
    const { data: ures, error: uerr } = await supabase.auth.getUser(token);
    if (uerr || !ures.user) return res.status(401).json({ error: "Invalid session" });
    const { data: prof } = await supabase.from("profiles").select("is_admin").eq("id", ures.user.id).maybeSingle();
    if (!prof?.is_admin) return res.status(403).json({ error: "Admins only" });

    const stripe = new Stripe(secret);
    const emailCache = new Map<string, string>();
    let synced = 0, skippedComp = 0, unresolved = 0, scanned = 0;
    const granted: string[] = [];

    for await (const sub of stripe.subscriptions.list({ status: "all", limit: 100 })) {
      scanned++;
      if (!LIVE.includes(sub.status)) continue;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      if (!customerId) continue;

      // Resolve the member: subscription metadata, then our row by customer, then email.
      let userId: string | null = sub.metadata?.user_id || null;
      let email = "";
      if (!userId) {
        const { data: row } = await supabase
          .from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
        userId = row?.user_id ?? null;
      }
      if (!userId) {
        email = emailCache.get(customerId) || "";
        if (!email) {
          const cust = await stripe.customers.retrieve(customerId);
          email = (!("deleted" in cust) ? (cust.email || "") : "").toLowerCase().trim();
          emailCache.set(customerId, email);
        }
        userId = await getUserIdByEmail(supabase, email);
      }
      if (!userId) { unresolved++; continue; }

      // Never overwrite a manual comp.
      const { data: existing } = await supabase
        .from("subscriptions").select("status").eq("user_id", userId).maybeSingle();
      if (existing?.status === "comp") { skippedComp++; continue; }

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        plan: sub.metadata?.plan || null,
        cycle: sub.metadata?.cycle || null,
        status: sub.status,
        current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
        cancel_at_period_end: !!sub.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      synced++;
      if (email) granted.push(email);
    }

    return res.status(200).json({ ok: true, scanned, synced, skippedComp, unresolved, granted });
  } catch (e: unknown) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}
