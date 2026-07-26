// Vercel Serverless Function — start the Nylas Hosted Auth flow for Gmail.
// The signed-in user hits this with their Supabase JWT; we return the Nylas
// auth URL (with a signed `state` carrying the user id) for the browser to
// redirect to. All Nylas secrets stay server-side.
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const NYLAS_API_URI = process.env.NYLAS_API_URI || "https://api.us.nylas.com";
const CLIENT_ID = process.env.NYLAS_CLIENT_ID || "";
const APP_URL = process.env.APP_URL || "https://allegoryartstudio.com";
const STATE_SECRET = process.env.NYLAS_STATE_SECRET || "";

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
    if (!CLIENT_ID || !STATE_SECRET) return res.status(500).json({ error: "Nylas not configured" });

    const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: "Invalid session" });

    const url = new URL(`${NYLAS_API_URI}/v3/connect/auth`);
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("redirect_uri", `${APP_URL}/api/nylas/callback`);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("provider", "google");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("state", signState(data.user.id));

    return res.status(200).json({ authUrl: url.toString() });
  } catch (e: unknown) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}
