// Vercel Serverless Function — all Nylas (Gmail) endpoints in ONE function (the
// Hobby plan caps a deployment at 12 functions). The path segment selects the
// action: /api/nylas/auth | callback | disconnect | sync. Behavior is unchanged
// from the previous one-file-per-endpoint layout.
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const NYLAS_API_URI = process.env.NYLAS_API_URI || "https://api.us.nylas.com";
const CLIENT_ID = process.env.NYLAS_CLIENT_ID || "7754da07-6633-498e-abce-e0f2bfb404af";
const API_KEY = process.env.NYLAS_API_KEY || "";
const APP_URL = process.env.APP_URL || "https://allegoryartstudio.com";
const STATE_SECRET = process.env.NYLAS_STATE_SECRET || "allegory-nylas-state-a7f3c9e21b8d4f60a5e7c9d1f2b34856";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://czbzunpabgmwpldkrcex.supabase.co";
const REDIRECT_URI = `${APP_URL}/api/nylas/callback`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function signState(userId: string): string {
  const exp = Date.now() + 10 * 60 * 1000;
  const body = `${userId}.${exp}`;
  const sig = crypto.createHmac("sha256", STATE_SECRET).update(body).digest("hex");
  return Buffer.from(`${body}.${sig}`).toString("base64url");
}

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

const bearer = (req: Any) => String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();

async function handleAuth(req: Any, res: Any) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: "Not signed in" });
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!svc) return res.status(500).json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY" });
  if (/[^\x20-\x7E]/.test(svc) || svc.length < 30) {
    return res.status(500).json({ error: "Config error", detail: "SUPABASE_SERVICE_ROLE_KEY looks truncated — re-copy the FULL key with the copy button (long, no '…')." });
  }
  const supabase = createClient(SUPABASE_URL, svc);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Invalid session", detail: error?.message || "no user for token" });
  const url = new URL(`${NYLAS_API_URI}/v3/connect/auth`);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("provider", "google");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("state", signState(data.user.id));
  return res.status(200).json({ authUrl: url.toString() });
}

async function handleCallback(req: Any, res: Any) {
  const back = (q: string) => res.redirect(302, `${APP_URL}/communications?${q}`);
  const code = String(req.query.code || "");
  const state = String(req.query.state || "");
  if (!code || !state) return back("error=missing_code");
  const userId = verifyState(state);
  if (!userId) return back("error=bad_state");
  if (!API_KEY) return back("error=missing_nylas_api_key");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return back("error=missing_supabase_key");
  const tokenRes = await fetch(`${NYLAS_API_URI}/v3/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: API_KEY, code, redirect_uri: REDIRECT_URI, grant_type: "authorization_code" }),
  });
  const token = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !token.grant_id) return back("error=token_exchange_failed");
  const email = token.email || "";
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  await supabase.from("nylas_grants").upsert(
    { user_id: userId, grant_id: token.grant_id, email, provider: "google", updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  await supabase.from("inbox_connections").upsert(
    { user_id: userId, provider: "gmail", email, connected_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  return back("connected=1");
}

async function handleDisconnect(req: Any, res: Any) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: "Not signed in" });
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  const { data: ures, error: uerr } = await supabase.auth.getUser(token);
  if (uerr || !ures.user) return res.status(401).json({ error: "Invalid session" });
  const userId = ures.user.id;
  const { data: grant } = await supabase.from("nylas_grants").select("grant_id").eq("user_id", userId).maybeSingle();
  if (grant?.grant_id) {
    try {
      await fetch(`${NYLAS_API_URI}/v3/grants/${grant.grant_id}`, { method: "DELETE", headers: { Authorization: `Bearer ${API_KEY}` } });
    } catch { /* ignore */ }
  }
  await supabase.from("nylas_grants").delete().eq("user_id", userId);
  await supabase.from("inbox_connections").delete().eq("user_id", userId);
  await supabase.from("flagged_emails").delete().eq("user_id", userId).like("id", "nylas_%");
  return res.status(200).json({ ok: true });
}

async function handleSync(req: Any, res: Any) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: "Not signed in" });
  if (!API_KEY) return res.status(500).json({ error: "Server missing NYLAS_API_KEY" });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY" });
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: ures, error: uerr } = await supabase.auth.getUser(token);
  if (uerr || !ures.user) return res.status(401).json({ error: "Invalid session" });
  const userId = ures.user.id;
  const { data: grant } = await supabase.from("nylas_grants").select("grant_id, email").eq("user_id", userId).maybeSingle();
  if (!grant?.grant_id) return res.status(400).json({ error: "No mailbox connected" });
  const nres = await fetch(`${NYLAS_API_URI}/v3/grants/${grant.grant_id}/messages?limit=30&in=INBOX`, { headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" } });
  const body = await nres.json().catch(() => ({}));
  if (!nres.ok) return res.status(502).json({ error: body?.error?.message || "Nylas request failed" });
  const self = String(grant.email || "").toLowerCase();
  const rows = (body.data || []).map((m: Any) => {
    const from = (Array.isArray(m.from) && m.from[0]) || {};
    const fromSelf = String(from.email || "").toLowerCase() === self;
    const status = fromSelf ? "awaiting_response" : m.unread ? "needs_reply" : "fyi";
    return {
      id: "nylas_" + m.id,
      user_id: userId,
      sender: from.name || from.email || "Unknown",
      sender_email: from.email || "",
      subject: m.subject || "(no subject)",
      preview: String(m.snippet || "").slice(0, 240),
      received_at: new Date((Number(m.date) || 0) * 1000).toISOString(),
      status,
    };
  });
  if (rows.length) {
    const { error: upErr } = await supabase.from("flagged_emails").upsert(rows, { onConflict: "id" });
    if (upErr) return res.status(500).json({ error: upErr.message });
  }
  return res.status(200).json({ ok: true, synced: rows.length });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  const action = String(req.query.action || "");
  try {
    if (action === "auth") return await handleAuth(req, res);
    if (action === "callback") return await handleCallback(req, res);
    if (action === "disconnect") return await handleDisconnect(req, res);
    if (action === "sync") return await handleSync(req, res);
    return res.status(404).json({ error: "Unknown action" });
  } catch (e: unknown) {
    if (action === "callback") return res.redirect(302, `${APP_URL}/communications?error=server_error`);
    return res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}
