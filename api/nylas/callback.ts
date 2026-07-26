// Vercel Serverless Function — Nylas Hosted Auth callback.
// Nylas redirects the browser here with ?code & ?state. We verify the state,
// exchange the code for a Nylas grant (server-side, using the API key), store
// the grant against the user, and send them back to the Communications hub.
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const NYLAS_API_URI = process.env.NYLAS_API_URI || "https://api.us.nylas.com";
const CLIENT_ID = process.env.NYLAS_CLIENT_ID || "";
const API_KEY = process.env.NYLAS_API_KEY || "";
const APP_URL = process.env.APP_URL || "https://allegoryartstudio.com";
const STATE_SECRET = process.env.NYLAS_STATE_SECRET || "";

function verifyState(state: string): string | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString();
    const [userId, exp, sig] = decoded.split(".");
    if (!userId || !exp || !sig) return null;
    const expected = crypto.createHmac("sha256", STATE_SECRET).update(`${userId}.${exp}`).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    if (Date.now() > Number(exp)) return null;
    return userId;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  const back = (q: string) => res.redirect(302, `${APP_URL}/communications?${q}`);
  try {
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");
    if (!code || !state) return back("error=missing_code");

    const userId = verifyState(state);
    if (!userId) return back("error=bad_state");

    // Exchange the authorization code for a grant. In Nylas v3 the API key is
    // passed as client_secret.
    const tokenRes = await fetch(`${NYLAS_API_URI}/v3/connect/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: API_KEY,
        code,
        redirect_uri: `${APP_URL}/api/nylas/callback`,
        grant_type: "authorization_code",
      }),
    });
    const token = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !token.grant_id) return back("error=token_exchange_failed");

    const email = token.email || "";
    const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");

    // Grant (secret) lives in a server-only table the client never reads.
    await supabase.from("nylas_grants").upsert(
      { user_id: userId, grant_id: token.grant_id, email, provider: "google", updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    // A non-secret connection record the client CAN see (drives the UI).
    await supabase.from("inbox_connections").upsert(
      { user_id: userId, provider: "gmail", email, connected_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

    return back("connected=1");
  } catch {
    return back("error=server_error");
  }
}
