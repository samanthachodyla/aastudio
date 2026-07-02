import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Require a real authenticated (non-anon) Supabase user before doing any
 * Anthropic-billed work. Mirrors the other edge functions in this project.
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
  if (data.user.role && data.user.role !== "authenticated") return null;
  return data.user;
}

// Expense categories the app understands (must match src/lib/types.ts).
const CATEGORIES = [
  "studio_rent", "materials", "framing", "marketing",
  "equipment", "fees_commissions", "other",
];
const PAYMENT_TYPES = ["debit_card", "credit_card", "cash", "check", "bank_transfer", "other"];

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

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
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "No file data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isPdf = mediaType === "application/pdf";
    if (!isPdf && !IMAGE_TYPES.includes(mediaType)) {
      return new Response(
        JSON.stringify({ error: "Unsupported file type. Upload a JPG, PNG, WEBP, GIF, or PDF." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const instructions = `You are a bookkeeping assistant. Read this receipt or invoice and extract the expense details for an artist's studio ledger.

Return ONLY a JSON object (no prose, no markdown fences) with this exact shape:
{
  "date": "YYYY-MM-DD or null",            // the transaction date on the receipt; null if not visible
  "amount": number or null,                 // the grand total actually paid, as a number (no currency symbol)
  "vendor": "string or null",               // the merchant / business name
  "description": "string or null",          // a short human label, e.g. "Framing supplies" or "Studio rent — June"
  "category": one of ${JSON.stringify(CATEGORIES)},
  "paymentType": one of ${JSON.stringify(PAYMENT_TYPES)} or null   // infer from card/cash/check wording if present
}

Rules:
- Choose the single best "category" from the list. Use "materials" for art supplies, "framing" for framing, "equipment" for tools/gear, "marketing" for ads/printing/promo, "fees_commissions" for platform or gallery fees, "studio_rent" for rent/utilities, otherwise "other".
- "amount" must be the final total paid, not a subtotal or a single line item.
- If the date is ambiguous or missing, use null (do not guess). Today is ${today} for reference only.
- Never invent a vendor or amount that is not on the receipt.`;

    const fileBlock = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: imageBase64 } }
      : { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } };

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: [{
          role: "user",
          content: [fileBlock, { type: "text", text: instructions }],
        }],
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
      ? data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n")
      : "";

    let parsed: any = {};
    try {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    } catch {
      parsed = {};
    }

    // Normalize / validate before returning to the client.
    const amount = typeof parsed.amount === "number"
      ? parsed.amount
      : parsed.amount != null && !isNaN(Number(parsed.amount)) ? Number(parsed.amount) : null;
    const category = CATEGORIES.includes(parsed.category) ? parsed.category : "other";
    const paymentType = PAYMENT_TYPES.includes(parsed.paymentType) ? parsed.paymentType : null;
    const date = typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : null;

    return new Response(
      JSON.stringify({
        date,
        amount,
        vendor: typeof parsed.vendor === "string" ? parsed.vendor : null,
        description: typeof parsed.description === "string" ? parsed.description : null,
        category,
        paymentType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
