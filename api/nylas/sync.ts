// Vercel Serverless Function — pull recent Gmail messages via Nylas and flag
// the ones that likely need a reply, into the flagged_emails table.
// Called by the signed-in user (Supabase JWT). The Nylas grant + API key stay
// server-side; the client never sees them.
import { createClient } from "@supabase/supabase-js";

const NYLAS_API_URI = process.env.NYLAS_API_URI || "https://api.us.nylas.com";
const API_KEY = process.env.NYLAS_API_KEY || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://czbzunpabgmwpldkrcex.supabase.co";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  try {
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return res.status(401).json({ error: "Not signed in" });
    if (!API_KEY) return res.status(500).json({ error: "Server missing NYLAS_API_KEY" });
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY" });

    const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: ures, error: uerr } = await supabase.auth.getUser(token);
    if (uerr || !ures.user) return res.status(401).json({ error: "Invalid session" });
    const userId = ures.user.id;

    const { data: grant } = await supabase
      .from("nylas_grants")
      .select("grant_id, email")
      .eq("user_id", userId)
      .maybeSingle();
    if (!grant?.grant_id) return res.status(400).json({ error: "No mailbox connected" });

    const nres = await fetch(`${NYLAS_API_URI}/v3/grants/${grant.grant_id}/messages?limit=30&in=INBOX`, {
      headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
    });
    const body = await nres.json().catch(() => ({}));
    if (!nres.ok) return res.status(502).json({ error: body?.error?.message || "Nylas request failed" });

    const self = String(grant.email || "").toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (body.data || []).map((m: any) => {
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
  } catch (e: unknown) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}
