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
