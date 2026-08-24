// Vercel Serverless Function — Studio Manager / support intake.
//
// This replaces the un-deployed `send-studio-manager-message` Supabase edge
// function (which 404'd, so the form only ever showed "Please try again").
// It routes every support message through the SAME reliable channel the
// marketing signups already use — the Google Apps Script inbox (Google Sheet +
// email notification) — so Cara is notified with no extra infrastructure.
//
// If a Resend key is configured later, it ALSO emails the Studio Manager inbox
// directly (reply-to the sender) — an automatic upgrade, not a requirement.
//
// Env vars (all optional — the function still works with none of them set):
//   WAITLIST_SHEET_URL     - Apps Script /exec URL (defaults to the live one)
//   RESEND_API_KEY         - if present, also send a direct email
//   STUDIO_MANAGER_TO      - recipient (defaults to cara@allegoryartconsulting.com)
//   STUDIO_MANAGER_FROM    - sender (defaults to studio-manager@allegoryartstudio.com)
const SHEET_URL =
  process.env.WAITLIST_SHEET_URL ||
  "https://script.google.com/macros/s/AKfycbzGAf1SwVp5TM6j2rajwBFlyEFJf9NAKmECu9haZt_E7X5iuEqpabWG2tfu3QN2qz4/exec";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const SM_TO = process.env.STUDIO_MANAGER_TO || "cara@allegoryartconsulting.com";
const SM_FROM = process.env.STUDIO_MANAGER_FROM || "studio-manager@allegoryartstudio.com";

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const name = str(body.name);
  const email = str(body.email).toLowerCase();
  const subject = str(body.subject);
  const message = str(body.message);

  if (!name) return res.status(400).json({ error: "Please add your name." });
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "A valid email is required so we can reply." });
  }
  if (!subject) return res.status(400).json({ error: "Please add a subject." });
  if (!message) return res.status(400).json({ error: "Please add a message." });

  // ---- 1. Reliable path: forward to the Apps Script inbox (Sheet + email). ----
  // This is the notification Cara already watches for signups. We pack the full
  // support message into named fields so it lands legibly in the sheet.
  let delivered = false;
  try {
    const r = await fetch(SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        source: "support",
        name,
        email,
        first_name: name,
        subject,
        message,
        // Some Apps Script templates only surface a single "notes" cell — include
        // a combined field too so the subject + message are never lost.
        notes: `[${subject}] ${message}`,
        event_source_url: str(body.event_source_url),
        user_agent: str(body.user_agent),
      }),
    });
    // Apps Script returns 200/302; a resolved fetch means it was accepted.
    delivered = r.ok || r.status === 302 || r.status === 0;
  } catch (e) {
    console.error("[support] sheet forward failed", e);
  }

  // ---- 2. Optional upgrade: direct email via Resend, if configured. ----------
  if (RESEND_API_KEY) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `Allegory Studio Manager <${SM_FROM}>`,
          to: [SM_TO],
          reply_to: email,
          subject: `[Studio Manager] ${subject}`,
          text: `From: ${name} <${email}>\n\n${message}`,
        }),
      });
      if (r.ok) delivered = true;
      else console.error("[support] resend failed", r.status, await r.text().catch(() => ""));
    } catch (e) {
      console.error("[support] resend exception", e);
    }
  }

  if (!delivered) {
    return res.status(502).json({ error: "We couldn't send your message right now. Please email hello@allegoryartstudio.com and we'll jump on it." });
  }
  return res.status(200).json({ ok: true });
}
