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

    const { mode, context } = await req.json();

    let prompt = "";
    if (mode === "trends") {
      prompt = `You are a social media strategist for visual artists. Return a digest of current social media trends specifically relevant to visual artists right now — including what content formats are performing well on Instagram, relevant hashtag strategies, what themes or aesthetics are resonating in the art world on social right now, and any platform algorithm notes worth knowing.

Return 5–7 distinct trend items. Respond ONLY with valid JSON in this exact shape, no prose, no markdown fences:

{"trends":[{"title":"...","explanation":"..."}]}

Each "title" should be short (under 60 chars). Each "explanation" should be 2–3 sentences.`;
    } else if (mode === "suggestions") {
      prompt = `You are a social media strategist for a working visual artist. Based on the artist's recent activity below, suggest 4–5 specific, personal, actionable post ideas — what to post, which platform, why it makes sense right now, and the best time of day to post it.

Artist data (JSON):
${JSON.stringify(context, null, 2)}

Respond ONLY with valid JSON in this exact shape, no prose, no markdown fences:

{"suggestions":[{"platform":"instagram|facebook|linkedin|newsletter","idea":"...","timing":"...","rationale":"..."}]}

- "idea" is what to post (1–2 sentences).
- "timing" is the recommended day + time of day (e.g. "Tuesday 11am" or "Thursday evening").
- "rationale" is one short sentence explaining why this fits right now.
Make each suggestion feel personal to this artist's data, not generic.`;
    } else if (mode === "newsletter_draft") {
      const { topic, contentNotes, contentIdeas } = context ?? {};
      prompt = `You are a thoughtful writer helping a visual artist craft a genuine, warm newsletter to their collectors and followers. This is not marketing copy. It is not salesy. It is the kind of note a collector or follower would actually want to read — personal, observant, generous, written in the artist's own voice.

Write the newsletter in first person, as the artist.

It should include:
- A subject line that feels like an invitation, not a sales pitch (under 70 chars).
- A natural opening (no "Hi everyone!" boilerplate).
- A body that weaves in the artist's notes and any relevant content ideas below.
- A soft, human closing.

What the artist wants this newsletter to be about:
${(topic ?? "").toString().trim() || "(not specified)"}

Additional notes or content ideas the artist mentioned:
${(contentNotes ?? "").toString().trim() || "(none)"}

Existing content ideas from the artist's board (JSON):
${JSON.stringify(contentIdeas ?? [], null, 2)}

Respond ONLY with valid JSON in this exact shape, no prose, no markdown fences:

{"subject":"...","body":"..."}

The "body" should be plain text with paragraph breaks as \\n\\n. Do not include the subject line inside the body. Keep the total body around 180–320 words.`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
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

    // Try to extract JSON
    let parsed: any = null;
    try {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    } catch (_) {
      parsed = null;
    }

    return new Response(JSON.stringify({ text, parsed }), {
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
