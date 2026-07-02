import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Where Studio Manager submissions are delivered.
const DEFAULT_TO = "cara@allegoryartconsulting.com";
// Must be an address on a domain verified in Resend. Override via env once the
// sending domain is verified (e.g. "Allegory Studio <studio@allegoryartstudio.com>").
const DEFAULT_FROM = "Allegory Studio <studio-manager@allegoryartstudio.com>";

async function requireUser(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return null;
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  if (data.user.role && data.user.role !== "authenticated") return null;
  return data.user;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const user = await requireUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Email isn't configured yet (RESEND_API_KEY missing)." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { subject, message, name, email } = await req.json();
    const s = String(subject ?? "").trim();
    const m = String(message ?? "").trim();
    const n = String(name ?? "").trim();
    const from_email = String(email ?? "").trim();
    if (!s || !m || !n || !from_email) {
      return new Response(JSON.stringify({ error: "Missing required fields." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const to = Deno.env.get("STUDIO_MANAGER_TO") || DEFAULT_TO;
    const from = Deno.env.get("STUDIO_MANAGER_FROM") || DEFAULT_FROM;

    const html = `
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.6">
        <p style="margin:0 0 4px"><strong>New Studio Manager message</strong></p>
        <p style="margin:0 0 16px;color:#666">From ${esc(n)} &lt;${esc(from_email)}&gt; · user ${esc(user.id)}</p>
        <p style="margin:0 0 4px"><strong>Subject:</strong> ${esc(s)}</p>
        <hr style="border:none;border-top:1px solid #ddd;margin:16px 0"/>
        <div style="white-space:pre-wrap">${esc(m)}</div>
      </div>`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: from_email,
        subject: `[Studio Manager] ${s}`,
        html,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: data?.message || "Email send failed." }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: data?.id ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
