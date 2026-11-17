// Vercel Serverless Function — disconnect QuickBooks Online.
// Revokes the token at Intuit (best-effort), then deletes the stored grant and
// connection record. Called by the signed-in member (Supabase JWT).
import { createClient } from "@supabase/supabase-js";

const CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID || "";
const CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://czbzunpabgmwpldkrcex.supabase.co";

const REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";

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
      .from("quickbooks_grants")
      .select("refresh_token")
      .eq("user_id", userId)
      .maybeSingle();

    // Best-effort token revoke at Intuit (don't fail the disconnect if it errors).
    if (grant?.refresh_token && CLIENT_ID && CLIENT_SECRET) {
      try {
        const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
        await fetch(REVOKE_URL, {
          method: "POST",
          headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ token: grant.refresh_token }),
        });
      } catch { /* ignore */ }
    }

    await supabase.from("quickbooks_grants").delete().eq("user_id", userId);
    await supabase.from("quickbooks_connections").delete().eq("user_id", userId);

    return res.status(200).json({ ok: true });
  } catch (e: unknown) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
}
