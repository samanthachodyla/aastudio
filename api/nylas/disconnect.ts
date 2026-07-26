// Vercel Serverless Function — disconnect Gmail.
// Revokes the Nylas grant, deletes the stored grant + connection, and clears
// the synced flagged emails. Called by the signed-in user (Supabase JWT).
import { createClient } from "@supabase/supabase-js";

const NYLAS_API_URI = process.env.NYLAS_API_URI || "https://api.us.nylas.com";
const API_KEY = process.env.NYLAS_API_KEY || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://czbzunpabgmwpldkrcex.supabase.co";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  try {
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return res.status(401).json({ error: "Not signed in" });

    const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || "");
    const { data: ures, error: uerr } = await supabase.auth.getUser(token);
    if (uerr || !ures.user) return res.status(401).json({ error: "Invalid session" });
    const userId = ures.user.id;

    const { data: grant } = await supabase
      .from("nylas_grants")
      .select("grant_id")
      .eq("user_id", userId)
      .maybeSingle();

    // Best-effort revoke at Nylas (don't fail the disconnect if this errors).
    if (grant?.grant_id) {
      try {
        await fetch(`${NYLAS_API_URI}/v3/grants/${grant.grant_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${API_KEY}` },
        });
      } catch { /* ignore */ }
    }

    await supabase.from("nylas_grants").delete().eq("user_id", userId);
    await supabase.from("inbox_connections").delete().eq("user_id", userId);
    // Remove the emails synced from Gmail (leave any non-Nylas rows alone).
    await supabase.from("flagged_emails").delete().eq("user_id", userId).like("id", "nylas_%");

    return res.status(200).json({ ok: true });
  } catch (e: unknown) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}
