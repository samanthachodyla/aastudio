// Vercel Serverless Function — QuickBooks Online OAuth callback.
// Intuit redirects the browser here with ?code, ?state and ?realmId. We verify
// the state, exchange the code for tokens (server-side, Basic auth), store the
// grant + a non-secret connection record against the member, and send them back
// to Settings.
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID || "";
const CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET || "";
const APP_URL = process.env.APP_URL || "https://allegoryartstudio.com";
const STATE_SECRET = process.env.QUICKBOOKS_STATE_SECRET || "allegory-qbo-state-9f4c7a2e1d8b6350af92c1e7b4d85620";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://czbzunpabgmwpldkrcex.supabase.co";
// "production" once the Intuit app is approved; "sandbox" while testing with dev keys.
const QBO_ENV = (process.env.QUICKBOOKS_ENV || "sandbox").toLowerCase();
const API_BASE = QBO_ENV === "production"
  ? "https://quickbooks.api.intuit.com"
  : "https://sandbox-quickbooks.api.intuit.com";

const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

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

// Best-effort company name for the Settings UI; never blocks the connection.
async function fetchCompanyName(realmId: string, accessToken: string): Promise<string> {
  try {
    const r = await fetch(`${API_BASE}/v3/company/${realmId}/companyinfo/${realmId}?minorversion=73`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });
    if (!r.ok) return "";
    const j = await r.json();
    return j?.CompanyInfo?.CompanyName || "";
  } catch {
    return "";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  const back = (q: string) => res.redirect(302, `${APP_URL}/settings?${q}`);
  try {
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");
    const realmId = String(req.query.realmId || "");
    if (!code || !state || !realmId) return back("quickbooks=error&reason=missing_params");

    const userId = verifyState(state);
    if (!userId) return back("quickbooks=error&reason=bad_state");
    if (!CLIENT_ID || !CLIENT_SECRET) return back("quickbooks=error&reason=not_configured");
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return back("quickbooks=error&reason=missing_supabase_key");

    // Exchange the authorization code for tokens. Intuit uses HTTP Basic auth
    // with the client id/secret and a urlencoded body.
    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${APP_URL}/api/quickbooks/callback`,
      }).toString(),
    });
    const tok = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tok.access_token || !tok.refresh_token) {
      return back("quickbooks=error&reason=token_exchange_failed");
    }

    const now = Date.now();
    const tokenExpiresAt = new Date(now + (Number(tok.expires_in) || 3600) * 1000).toISOString();
    const refreshExpiresAt = tok.x_refresh_token_expires_in
      ? new Date(now + Number(tok.x_refresh_token_expires_in) * 1000).toISOString()
      : null;

    const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || "");

    // Secret tokens — server-only table the client never reads.
    await supabase.from("quickbooks_grants").upsert(
      {
        user_id: userId,
        realm_id: realmId,
        access_token: tok.access_token,
        refresh_token: tok.refresh_token,
        token_expires_at: tokenExpiresAt,
        refresh_expires_at: refreshExpiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    const companyName = await fetchCompanyName(realmId, tok.access_token);

    // Non-secret record the client CAN see (drives the Settings UI).
    await supabase.from("quickbooks_connections").upsert(
      { user_id: userId, realm_id: realmId, company_name: companyName, connected_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

    return back("quickbooks=connected");
  } catch {
    return back("quickbooks=error&reason=server_error");
  }
}
