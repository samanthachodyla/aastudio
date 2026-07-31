// Vercel Serverless Function — central signup intake for the marketing site.
//
// On every homepage signup (hero waitlist, newsletter block, 20%-off popup) it:
//   1. Upserts the contact into Mailchimp (the system of record).
//   2. Forwards to the existing Google Apps Script (Google Sheet + email backup).
//   3. Fires a Meta Conversions API "Lead" (hashed email, shared event_id).
// The browser then fires the matching Pixel Lead with the SAME event_id, so Meta
// de-duplicates the two into one conversion.
//
// Env vars (set in Vercel; the function degrades gracefully if any are missing):
//   MAILCHIMP_API_KEY        - e.g. "abc123...-us21"
//   MAILCHIMP_AUDIENCE_ID    - the target Audience/List id
//   MAILCHIMP_SERVER_PREFIX  - e.g. "us21" (defaults to the suffix of the API key)
//   META_CAPI_TOKEN          - Conversions API / System User token (optional)
//   META_PIXEL_ID            - defaults to the studio pixel
//   WAITLIST_SHEET_URL       - Apps Script /exec URL (defaults to the current one)
import crypto from "crypto";

const MC_KEY = process.env.MAILCHIMP_API_KEY || "";
const MC_LIST = process.env.MAILCHIMP_AUDIENCE_ID || "";
const MC_DC = process.env.MAILCHIMP_SERVER_PREFIX || (MC_KEY.includes("-") ? MC_KEY.split("-").pop()! : "");
const SHEET_URL =
  process.env.WAITLIST_SHEET_URL ||
  "https://script.google.com/macros/s/AKfycbzGAf1SwVp5TM6j2rajwBFlyEFJf9NAKmECu9haZt_E7X5iuEqpabWG2tfu3QN2qz4/exec";
const META_PIXEL_ID = process.env.META_PIXEL_ID || "1583309690064748";
const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN || "";

const sha256 = (v: string) => crypto.createHash("sha256").update(v.trim().toLowerCase()).digest("hex");
const str = (v: unknown) => (v == null ? "" : String(v)).trim();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const email = str(body.email).toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  const firstName = str(body.first_name);
  const lastName = str(body.last_name);
  const phone = str(body.phone);
  const source = str(body.source) || "landing";
  const eventId = str(body.event_id) || crypto.randomUUID();

  // ---- 1. Mailchimp upsert (PUT to the member hash is idempotent — no "already
  //         a member" error, and it updates merge fields on repeat signups). ----
  let mailchimp = "skipped";
  if (MC_KEY && MC_LIST && MC_DC) {
    try {
      const hash = crypto.createHash("md5").update(email).digest("hex");
      const merge: Record<string, string> = {};
      if (firstName) merge.FNAME = firstName;
      if (lastName) merge.LNAME = lastName;
      if (phone) merge.PHONE = phone; // requires a PHONE merge field on the audience
      const r = await fetch(`https://${MC_DC}.api.mailchimp.com/3.0/lists/${MC_LIST}/members/${hash}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + Buffer.from("any:" + MC_KEY).toString("base64"),
        },
        body: JSON.stringify({
          email_address: email,
          status_if_new: "subscribed",
          ...(Object.keys(merge).length ? { merge_fields: merge } : {}),
          tags: [source],
        }),
      });
      mailchimp = r.ok ? "ok" : `error_${r.status}`;
    } catch {
      mailchimp = "error";
    }
  }

  // ---- 2. Google Sheet + email backup (best-effort; never blocks the reply) ----
  try {
    await fetch(SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        email, first_name: firstName, last_name: lastName, phone, source,
        name: [firstName, lastName].filter(Boolean).join(" "),
        event_id: eventId, event_source_url: str(body.event_source_url),
        referrer: str(body.referrer), user_agent: str(body.user_agent),
        utm_source: str(body.utm_source), utm_medium: str(body.utm_medium),
        utm_campaign: str(body.utm_campaign), utm_content: str(body.utm_content),
        utm_term: str(body.utm_term), fbp: str(body.fbp), fbc: str(body.fbc),
        ga_client_id: str(body.ga_client_id),
      }),
    });
  } catch { /* backup is best-effort */ }

  // ---- 3. Meta Conversions API "Lead" (deduped with the Pixel via event_id) ----
  if (META_CAPI_TOKEN && META_PIXEL_ID) {
    try {
      const userData: Record<string, unknown> = { em: [sha256(email)] };
      if (phone) userData.ph = [sha256(phone.replace(/[^\d]/g, ""))];
      if (firstName) userData.fn = [sha256(firstName)];
      if (lastName) userData.ln = [sha256(lastName)];
      if (body.fbp) userData.fbp = str(body.fbp);
      if (body.fbc) userData.fbc = str(body.fbc);
      const ip = str(req.headers["x-forwarded-for"]).split(",")[0].trim();
      if (ip) userData.client_ip_address = ip;
      if (body.user_agent) userData.client_user_agent = str(body.user_agent);
      await fetch(`https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_CAPI_TOKEN)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [{
            event_name: "Lead",
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId,
            action_source: "website",
            event_source_url: str(body.event_source_url) || undefined,
            user_data: userData,
            custom_data: { content_name: source },
          }],
        }),
      });
    } catch { /* CAPI is best-effort */ }
  }

  return res.status(200).json({ ok: true, mailchimp, event_id: eventId });
}
