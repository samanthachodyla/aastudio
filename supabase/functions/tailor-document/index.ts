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

    const { documentBody, opportunityDescription, focus } = await req.json();

    if (!documentBody || !opportunityDescription) {
      return new Response(JSON.stringify({ error: "documentBody and opportunityDescription are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are helping a working artist tailor an existing document (artist statement, bio, or CV blurb) to fit a specific opportunity. Rewrite the document to best fit the opportunity below.

Rules:
- Maintain the artist's voice and tone — do not flatten or over-formalize.
- Adjust emphasis and language to align with the opportunity's stated values, themes, and requirements.
- Keep approximately the same length as the original.
- Do not invent biographical facts, exhibitions, or works that are not in the original.
- Return only the rewritten document — no preamble, no explanation, no headers.

ORIGINAL DOCUMENT:
${documentBody}

OPPORTUNITY:
${opportunityDescription}

${focus ? `SPECIFIC FOCUS / ANGLE FROM THE ARTIST:\n${focus}` : ""}`;

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
      return new Response(JSON.stringify({ error: data?.error?.message || "Anthropic API error", details: data }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = Array.isArray(data?.content)
      ? data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n\n")
      : "";

    return new Response(JSON.stringify({ text }), {
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
