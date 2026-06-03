import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Require a real authenticated (non-anon) Supabase user.
 * The publishable/anon key is public, so it is NOT accepted on its own — this is
 * what protects the Anthropic-billed call below from anonymous abuse.
 * Returns the user, or null if the request is not from a signed-in user.
 */
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
  // Only fully authenticated users (not the anon role) may proceed.
  if (data.user.role && data.user.role !== "authenticated") return null;
  return data.user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Gate every request behind a signed-in user before doing any billable work.
  const user = await requireUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { region, discipline, types, feePreference, existingTitles } = await req.json();

    const prompt = `You are an arts opportunities researcher. Suggest 5–8 real, specific opportunities, organizations, or platforms that match the artist's criteria below. Use your knowledge of the arts funding, residency, and exhibition landscape.

Artist criteria:
- Region: ${region || "(unspecified)"}
- Discipline / medium: ${discipline || "(unspecified)"}
- Opportunity types of interest: ${(types && types.length ? types.join(", ") : "any")}
- Fee preference: ${feePreference || "Any"}

Avoid suggesting these (the artist already tracks them):
${(existingTitles || []).map((t: string) => `- ${t}`).join("\n") || "(none)"}

Return ONLY a JSON array (no prose, no markdown fences) of objects with this exact shape:
[
  {
    "name": "string",
    "organization": "string",
    "type": "Open call | Residency | Grant | Prize | Platform",
    "deadline_season": "string (e.g. 'Rolling', 'Spring', 'Annual - Fall')",
    "description": "one short sentence",
    "where_to_find": "string (URL or clear search hint)"
  }
]`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: data?.error?.message || "Anthropic API error" }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = Array.isArray(data?.content)
      ? data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n\n")
      : "";

    let suggestions: any[] = [];
    try {
      const match = text.match(/\[[\s\S]*\]/);
      suggestions = match ? JSON.parse(match[0]) : [];
    } catch {
      suggestions = [];
    }

    return new Response(JSON.stringify({ suggestions, raw: text }), {
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
