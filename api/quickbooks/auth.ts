// Vercel Serverless Function — start the QuickBooks Online OAuth flow.
// The signed-in member hits this with their Supabase JWT; we return Intuit's
// authorize URL (with a signed `state` carrying the user id) for the browser to
// redirect to. All QuickBooks secrets stay server-side.
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Only the two real secrets (QUICKBOOKS_CLIENT_ID/SECRET) and the Supabase
// service key must be set as env vars; everything else is a safe default.
const CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID || "";
const APP_URL = process.env.APP_URL || "https://allegoryartstudio.com";
const STATE_SECRET = process.env.QUICKBOOKS_STATE_SECRET || "allegory-qbo-state-9f4c7a2e1d8b6350af92c1e7b4d85620";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://czbzunpabgmwpldkrcex.supabase.co";

const AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const SCOPE = "com.intuit.quickbooks.accounting";

function signState(userId: string): string {
  const exp = Date.now() + 10 * 60 * 1000; // valid 10 minutes
  const body = `${userId}.${exp}`;
  const sig = crypto.createHmac("sha256", STATE_SECRET).update(body).digest("hex");
  return Buffer.from(`${body}.${sig}`).toString("base64url");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  try {
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return res.status(401).json({ error: "Not signed in" });

    if (!CLIENT_ID) return res.status(503).json({ error: "QuickBooks isn't configured yet." });

    const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!svc) return res.status(500).json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY" });

    const supabase = createClient(SUPABASE_URL, svc);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: "Invalid session" });

    const url = new URL(AUTH_URL);
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("redirect_uri", `${APP_URL}/api/quickbooks/callback`);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPE);
    url.searchParams.set("state", signState(data.user.id));

    return res.status(200).json({ authUrl: url.toString() });
  } catch (e: unknown) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}
