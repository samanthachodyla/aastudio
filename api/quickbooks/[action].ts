// Vercel Serverless Function — all QuickBooks Online endpoints in ONE function
// (the Hobby plan caps a deployment at 12 functions). The path segment selects
// the action: /api/quickbooks/auth | callback | disconnect | sync-invoice.
//
//   auth         -> return Intuit's authorize URL (signed state)
//   callback     -> exchange code, store grant + connection, back to Settings
//   disconnect   -> revoke + clear the grant/connection
//   sync-invoice -> paid invoice -> Sales Receipt, unpaid -> Invoice (idempotent
//                   by DocNumber), auto-refreshing the access token
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID || "";
const CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET || "";
const APP_URL = process.env.APP_URL || "https://allegoryartstudio.com";
const STATE_SECRET = process.env.QUICKBOOKS_STATE_SECRET || "allegory-qbo-state-9f4c7a2e1d8b6350af92c1e7b4d85620";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://czbzunpabgmwpldkrcex.supabase.co";
const QBO_ENV = (process.env.QUICKBOOKS_ENV || "sandbox").toLowerCase();
const API_BASE = QBO_ENV === "production"
  ? "https://quickbooks.api.intuit.com"
  : "https://sandbox-quickbooks.api.intuit.com";

const AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";
const SCOPE = "com.intuit.quickbooks.accounting";
const MINOR = "73";
const REDIRECT_URI = `${APP_URL}/api/quickbooks/callback`;

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

const qbHeaders = (at: string) => ({ Authorization: `Bearer ${at}`, Accept: "application/json", "Content-Type": "application/json" });
const esc = (s: string) => String(s).replace(/'/g, "\\'");

async function qbQuery(realm: string, at: string, sql: string): Promise<Any> {
  const r = await fetch(`${API_BASE}/v3/company/${realm}/query?query=${encodeURIComponent(sql)}&minorversion=${MINOR}`, { headers: qbHeaders(at) });
  if (!r.ok) throw new Error(`qb_query_failed_${r.status}`);
  const j = await r.json();
  return j.QueryResponse || {};
}

async function qbPost(realm: string, at: string, entity: string, body: Any): Promise<Any> {
  const r = await fetch(`${API_BASE}/v3/company/${realm}/${entity}?minorversion=${MINOR}`, { method: "POST", headers: qbHeaders(at), body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`qb_create_${entity}_failed_${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j;
}

async function fetchCompanyName(realm: string, at: string): Promise<string> {
  try {
    const r = await fetch(`${API_BASE}/v3/company/${realm}/companyinfo/${realm}?minorversion=${MINOR}`, { headers: qbHeaders(at) });
    if (!r.ok) return "";
    const j = await r.json();
    return j?.CompanyInfo?.CompanyName || "";
  } catch {
    return "";
  }
}

async function validAccessToken(supabase: Any, userId: string, grant: Any): Promise<string> {
  const expMs = new Date(grant.token_expires_at).getTime();
  if (Date.now() < expMs - 60_000) return grant.access_token;
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: grant.refresh_token }).toString(),
  });
  const t = await r.json().catch(() => ({}));
  if (!r.ok || !t.access_token) throw new Error("qb_token_refresh_failed");
  const now = Date.now();
  await supabase.from("quickbooks_grants").update({
    access_token: t.access_token,
    refresh_token: t.refresh_token || grant.refresh_token,
    token_expires_at: new Date(now + (Number(t.expires_in) || 3600) * 1000).toISOString(),
    refresh_expires_at: t.x_refresh_token_expires_in ? new Date(now + Number(t.x_refresh_token_expires_in) * 1000).toISOString() : undefined,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);
  return t.access_token;
}

async function findOrCreateCustomer(realm: string, at: string, name: string, email?: string, phone?: string): Promise<string> {
  const found = await qbQuery(realm, at, `select Id from Customer where DisplayName = '${esc(name)}'`);
  if (found.Customer?.[0]?.Id) return found.Customer[0].Id;
  const body: Any = { DisplayName: name };
  if (email) body.PrimaryEmailAddr = { Address: email };
  if (phone) body.PrimaryPhone = { FreeFormNumber: phone };
  const created = await qbPost(realm, at, "customer", body);
  return created.Customer.Id;
}

async function findOrCreateItem(realm: string, at: string): Promise<string> {
  const found = await qbQuery(realm, at, "select Id from Item where Type = 'Service' maxresults 1");
  if (found.Item?.[0]?.Id) return found.Item[0].Id;
  const anyItem = await qbQuery(realm, at, "select Id from Item maxresults 1");
  if (anyItem.Item?.[0]?.Id) return anyItem.Item[0].Id;
  const acct = await qbQuery(realm, at, "select Id from Account where AccountType = 'Income' maxresults 1");
  const incomeId = acct.Account?.[0]?.Id;
  if (!incomeId) throw new Error("qb_no_income_account");
  const created = await qbPost(realm, at, "item", { Name: "Artwork", Type: "Service", IncomeAccountRef: { value: incomeId } });
  return created.Item.Id;
}

const bearer = (req: Any) => String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();

async function handleAuth(req: Any, res: Any) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: "Not signed in" });
  if (!CLIENT_ID) return res.status(503).json({ error: "QuickBooks isn't configured yet." });
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!svc) return res.status(500).json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY" });
  const supabase = createClient(SUPABASE_URL, svc);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Invalid session" });
  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("state", signState(data.user.id));
  return res.status(200).json({ authUrl: url.toString() });
}

async function handleCallback(req: Any, res: Any) {
  const back = (q: string) => res.redirect(302, `${APP_URL}/settings?${q}`);
  const code = String(req.query.code || "");
  const state = String(req.query.state || "");
  const realmId = String(req.query.realmId || "");
  if (!code || !state || !realmId) return back("quickbooks=error&reason=missing_params");
  const userId = verifyState(state);
  if (!userId) return back("quickbooks=error&reason=bad_state");
  if (!CLIENT_ID || !CLIENT_SECRET) return back("quickbooks=error&reason=not_configured");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return back("quickbooks=error&reason=missing_supabase_key");
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI }).toString(),
  });
  const tok = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tok.access_token || !tok.refresh_token) return back("quickbooks=error&reason=token_exchange_failed");
  const now = Date.now();
  const tokenExpiresAt = new Date(now + (Number(tok.expires_in) || 3600) * 1000).toISOString();
  const refreshExpiresAt = tok.x_refresh_token_expires_in ? new Date(now + Number(tok.x_refresh_token_expires_in) * 1000).toISOString() : null;
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  await supabase.from("quickbooks_grants").upsert(
    { user_id: userId, realm_id: realmId, access_token: tok.access_token, refresh_token: tok.refresh_token, token_expires_at: tokenExpiresAt, refresh_expires_at: refreshExpiresAt, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  const companyName = await fetchCompanyName(realmId, tok.access_token);
  await supabase.from("quickbooks_connections").upsert(
    { user_id: userId, realm_id: realmId, company_name: companyName, connected_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  return back("quickbooks=connected");
}

async function handleDisconnect(req: Any, res: Any) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: "Not signed in" });
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  const { data: ures, error: uerr } = await supabase.auth.getUser(token);
  if (uerr || !ures.user) return res.status(401).json({ error: "Invalid session" });
  const userId = ures.user.id;
  const { data: grant } = await supabase.from("quickbooks_grants").select("refresh_token").eq("user_id", userId).maybeSingle();
  if (grant?.refresh_token && CLIENT_ID && CLIENT_SECRET) {
    try {
      const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
      await fetch(REVOKE_URL, { method: "POST", headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ token: grant.refresh_token }) });
    } catch { /* ignore */ }
  }
  await supabase.from("quickbooks_grants").delete().eq("user_id", userId);
  await supabase.from("quickbooks_connections").delete().eq("user_id", userId);
  return res.status(200).json({ ok: true });
}

async function handleSyncInvoice(req: Any, res: Any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: "Not signed in" });
  if (!CLIENT_ID || !CLIENT_SECRET) return res.status(200).json({ synced: false, reason: "not_configured" });
  const inv = req.body || {};
  const number = String(inv.number || "").trim();
  const status = String(inv.status || "").trim();
  if (!number) return res.status(400).json({ error: "Missing invoice number" });
  if (status === "draft") return res.status(200).json({ synced: false, reason: "draft" });
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  const { data: ures, error: uerr } = await supabase.auth.getUser(token);
  if (uerr || !ures.user) return res.status(401).json({ error: "Invalid session" });
  const userId = ures.user.id;
  const { data: grant } = await supabase.from("quickbooks_grants").select("realm_id, access_token, refresh_token, token_expires_at").eq("user_id", userId).maybeSingle();
  if (!grant) return res.status(200).json({ synced: false, reason: "not_connected" });
  const realm = grant.realm_id;
  const at = await validAccessToken(supabase, userId, grant);
  const paid = status === "paid";
  const entity = paid ? "salesreceipt" : "invoice";
  const qbType = paid ? "SalesReceipt" : "Invoice";
  const dupe = await qbQuery(realm, at, `select Id from ${qbType} where DocNumber = '${esc(number)}'`);
  if (dupe[qbType]?.[0]?.Id) return res.status(200).json({ synced: true, skipped: true, type: qbType, id: dupe[qbType][0].Id });
  const customerId = await findOrCreateCustomer(realm, at, inv.buyerName || "Collector", inv.buyerEmail, inv.buyerPhone);
  const itemId = await findOrCreateItem(realm, at);
  const itemRef = { value: itemId };
  const amount = Number(inv.amount) || 0;
  const subtotal = inv.subtotal != null ? Number(inv.subtotal) : amount;
  const tax = Number(inv.taxAmount) || 0;
  const shipping = Number(inv.shippingAmount) || 0;
  const title = String(inv.item || "Artwork");
  const line = (amt: number, desc: string) => ({ DetailType: "SalesItemLineDetail", Amount: Math.round(amt * 100) / 100, Description: desc, SalesItemLineDetail: { ItemRef: itemRef } });
  const lines: Any[] = [];
  if (inv.subtotal != null && Math.abs(subtotal + tax + shipping - amount) < 0.01) {
    lines.push(line(subtotal, title));
    if (shipping > 0) lines.push(line(shipping, "Shipping"));
    if (tax > 0) lines.push(line(tax, "Sales tax"));
  } else {
    lines.push(line(amount, title));
  }
  const doc: Any = { DocNumber: number, CustomerRef: { value: customerId }, Line: lines };
  if (inv.buyerEmail) doc.BillEmail = { Address: inv.buyerEmail };
  if (!paid && inv.dueAt) doc.DueDate = String(inv.dueAt).slice(0, 10);
  const created = await qbPost(realm, at, entity, doc);
  return res.status(200).json({ synced: true, type: qbType, id: created[qbType]?.Id });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  try {
    const action = String(req.query.action || "");
    if (action === "auth") return await handleAuth(req, res);
    if (action === "callback") return await handleCallback(req, res);
    if (action === "disconnect") return await handleDisconnect(req, res);
    if (action === "sync-invoice") return await handleSyncInvoice(req, res);
    return res.status(404).json({ error: "Unknown action" });
  } catch (e: unknown) {
    // The callback redirects; everything else returns JSON (fire-and-forget on the client).
    if (String(req.query.action || "") === "callback") return res.redirect(302, `${APP_URL}/settings?quickbooks=error&reason=server_error`);
    return res.status(200).json({ synced: false, error: e instanceof Error ? e.message : "unknown" });
  }
}
