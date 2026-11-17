// Vercel Serverless Function — push one Allegory invoice into the member's
// QuickBooks Online company.
//
//   paid invoice   -> QuickBooks Sales Receipt
//   unpaid invoice -> QuickBooks Invoice   (sent / overdue)
//   draft          -> skipped (not finalized)
//
// Idempotent: the Allegory invoice number is used as the QuickBooks DocNumber,
// and we query for an existing doc with that number before creating, so a
// re-sync never creates a duplicate. Tokens are refreshed automatically.
//
// Called by the signed-in member (Supabase JWT) from the browser,
// fire-and-forget — it never blocks or breaks invoice creation.
import { createClient } from "@supabase/supabase-js";

const CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID || "";
const CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://czbzunpabgmwpldkrcex.supabase.co";
const QBO_ENV = (process.env.QUICKBOOKS_ENV || "sandbox").toLowerCase();
const API_BASE = QBO_ENV === "production"
  ? "https://quickbooks.api.intuit.com"
  : "https://sandbox-quickbooks.api.intuit.com";
const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const MINOR = "73";

type Grant = {
  realm_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

// Return a valid access token, refreshing (and persisting the rotated tokens)
// if the current one is within 60s of expiry.
async function validAccessToken(supabase: SB, userId: string, grant: Grant): Promise<string> {
  const expMs = new Date(grant.token_expires_at).getTime();
  if (Date.now() < expMs - 60_000) return grant.access_token;

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: grant.refresh_token }).toString(),
  });
  const t = await r.json().catch(() => ({}));
  if (!r.ok || !t.access_token) throw new Error("qb_token_refresh_failed");

  const now = Date.now();
  await supabase.from("quickbooks_grants").update({
    access_token: t.access_token,
    refresh_token: t.refresh_token || grant.refresh_token, // refresh token rotates
    token_expires_at: new Date(now + (Number(t.expires_in) || 3600) * 1000).toISOString(),
    refresh_expires_at: t.x_refresh_token_expires_in
      ? new Date(now + Number(t.x_refresh_token_expires_in) * 1000).toISOString()
      : undefined,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);

  return t.access_token;
}

function qbHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}`, Accept: "application/json", "Content-Type": "application/json" };
}

async function qbQuery(realm: string, accessToken: string, sql: string): Promise<SB> {
  const r = await fetch(`${API_BASE}/v3/company/${realm}/query?query=${encodeURIComponent(sql)}&minorversion=${MINOR}`, {
    headers: qbHeaders(accessToken),
  });
  if (!r.ok) throw new Error(`qb_query_failed_${r.status}`);
  const j = await r.json();
  return j.QueryResponse || {};
}

async function qbPost(realm: string, accessToken: string, entity: string, body: SB): Promise<SB> {
  const r = await fetch(`${API_BASE}/v3/company/${realm}/${entity}?minorversion=${MINOR}`, {
    method: "POST",
    headers: qbHeaders(accessToken),
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`qb_create_${entity}_failed_${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j;
}

const esc = (s: string) => String(s).replace(/'/g, "\\'");

// Find a customer by display name, or create one.
async function findOrCreateCustomer(realm: string, at: string, name: string, email?: string, phone?: string): Promise<string> {
  const found = await qbQuery(realm, at, `select Id from Customer where DisplayName = '${esc(name)}'`);
  if (found.Customer?.[0]?.Id) return found.Customer[0].Id;
  const body: SB = { DisplayName: name };
  if (email) body.PrimaryEmailAddr = { Address: email };
  if (phone) body.PrimaryPhone = { FreeFormNumber: phone };
  const created = await qbPost(realm, at, "customer", body);
  return created.Customer.Id;
}

// Find any service item to hang lines on, or create a simple "Artwork" service
// item against the first income account.
async function findOrCreateItem(realm: string, at: string): Promise<string> {
  const found = await qbQuery(realm, at, "select Id from Item where Type = 'Service' maxresults 1");
  if (found.Item?.[0]?.Id) return found.Item[0].Id;
  const anyItem = await qbQuery(realm, at, "select Id from Item maxresults 1");
  if (anyItem.Item?.[0]?.Id) return anyItem.Item[0].Id;
  const acct = await qbQuery(realm, at, "select Id from Account where AccountType = 'Income' maxresults 1");
  const incomeId = acct.Account?.[0]?.Id;
  if (!incomeId) throw new Error("qb_no_income_account");
  const created = await qbPost(realm, at, "item", {
    Name: "Artwork", Type: "Service", IncomeAccountRef: { value: incomeId },
  });
  return created.Item.Id;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
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

    const { data: grant } = await supabase
      .from("quickbooks_grants")
      .select("realm_id, access_token, refresh_token, token_expires_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (!grant) return res.status(200).json({ synced: false, reason: "not_connected" });

    const realm = grant.realm_id;
    const at = await validAccessToken(supabase, userId, grant as Grant);

    // Idempotency: skip if a doc with this number already exists (either type).
    const paid = status === "paid";
    const entity = paid ? "salesreceipt" : "invoice";
    const qbType = paid ? "SalesReceipt" : "Invoice";
    const dupe = await qbQuery(realm, at, `select Id from ${qbType} where DocNumber = '${esc(number)}'`);
    if (dupe[qbType]?.[0]?.Id) {
      return res.status(200).json({ synced: true, skipped: true, type: qbType, id: dupe[qbType][0].Id });
    }

    const customerId = await findOrCreateCustomer(realm, at, inv.buyerName || "Collector", inv.buyerEmail, inv.buyerPhone);
    const itemId = await findOrCreateItem(realm, at);
    const itemRef = { value: itemId };

    const amount = Number(inv.amount) || 0;
    const subtotal = inv.subtotal != null ? Number(inv.subtotal) : amount;
    const tax = Number(inv.taxAmount) || 0;
    const shipping = Number(inv.shippingAmount) || 0;
    const title = String(inv.item || "Artwork");

    // Itemize when we have a breakdown that reconciles to the total; otherwise a
    // single line equal to the grand total, so QuickBooks always matches Allegory.
    const line = (amt: number, desc: string) => ({
      DetailType: "SalesItemLineDetail", Amount: Math.round(amt * 100) / 100, Description: desc,
      SalesItemLineDetail: { ItemRef: itemRef },
    });
    const lines: SB[] = [];
    if (inv.subtotal != null && Math.abs(subtotal + tax + shipping - amount) < 0.01) {
      lines.push(line(subtotal, title));
      if (shipping > 0) lines.push(line(shipping, "Shipping"));
      if (tax > 0) lines.push(line(tax, "Sales tax"));
    } else {
      lines.push(line(amount, title));
    }

    const doc: SB = { DocNumber: number, CustomerRef: { value: customerId }, Line: lines };
    if (inv.buyerEmail) doc.BillEmail = { Address: inv.buyerEmail };
    if (!paid && inv.dueAt) doc.DueDate = String(inv.dueAt).slice(0, 10);

    const created = await qbPost(realm, at, entity, doc);
    const id = created[qbType]?.Id;
    return res.status(200).json({ synced: true, type: qbType, id });
  } catch (e: unknown) {
    // Fire-and-forget on the client; report the reason for logs/debugging.
    return res.status(200).json({ synced: false, error: e instanceof Error ? e.message : "unknown" });
  }
}
