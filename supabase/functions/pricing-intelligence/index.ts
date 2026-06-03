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

    const { mode, paidInvoices, work } = await req.json();

    let prompt = "";
    if (mode === "analyze") {
      prompt = `You are a pricing advisor for a working artist. Below is the artist's paid invoice history (JSON). Each invoice may include the work's title, medium, year, dimensions, and sale amount.

Analyze this data and:
1. Calculate the artist's effective price-per-square-inch across works (where dimensions are available).
2. Flag any works that appear underpriced relative to the others.
3. Note any pricing inconsistencies by medium.
4. Return 3–5 specific, actionable pricing recommendations written in plain language directly to the artist (use "you").

Keep the tone calm, editorial, and practical. Use short paragraphs and a small number of bullet points where helpful. Do not invent data — if dimensions or medium are missing, say so.

Paid invoices:
${JSON.stringify(paidInvoices, null, 2)}`;
    } else if (mode === "price_new") {
      prompt = `You are a pricing advisor for a working artist. The artist wants pricing guidance for a new work with these specs:

- Medium: ${work?.medium || "(unspecified)"}
- Width: ${work?.width ?? "(unspecified)"} inches
- Height: ${work?.height ?? "(unspecified)"} inches
- Hours worked: ${work?.hours ?? "(unspecified)"}

Their paid sales history (JSON):
${JSON.stringify(paidInvoices, null, 2)}

Suggest a specific price range for this work. Base it on:
1. The artist's own sales history (price per square inch, comparable mediums).
2. General market conventions for that medium and size.

Address the artist directly ("you"). Show your reasoning briefly. End with a clear suggested range (low–high USD) and a recommended target. Keep it concise.`;
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
