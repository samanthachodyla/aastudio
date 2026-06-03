const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
