// Vercel Serverless Function — open the Stripe Billing Portal so a subscriber
// can update their card, switch plans, or cancel. Returns a hosted portal URL.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://czbzunpabgmwpldkrcex.supabase.co";
const APP_URL = process.env.APP_URL || "https://allegoryartstudio.com";

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

    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", ures.user.id)
      .maybeSingle();

    const customerId = subRow?.stripe_customer_id as string | undefined;
    if (!customerId) return res.status(400).json({ error: "No billing account yet" });

    const stripe = new Stripe(secret);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/settings`,
    });

    return res.status(200).json({ url: session.url });
  } catch (e: unknown) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}
