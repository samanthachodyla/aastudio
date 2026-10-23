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

// Opportunity types the app understands (must match src/lib/types.ts + Exhibitions.tsx).
const TYPES = ["open_call", "residency", "grant", "prize", "exhibition", "commission", "show", "other"];

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
    const instructions = `You are an assistant for a working artist. They found an art opportunity, often a screenshot of an Instagram post, a flyer, an email, or a web page, and want to save it to their deadline tracker. Read everything in this image and extract the opportunity details.

Return ONLY a JSON object (no prose, no markdown fences) with this exact shape:
{
  "title": "string or null",            // the name of the open call, show, grant, residency, etc.
  "organization": "string or null",     // who is hosting it (gallery, museum, foundation, @handle)
  "deadline": "YYYY-MM-DD or null",      // the application/submission deadline
  "type": one of ${JSON.stringify(TYPES)},
  "link": "string or null",              // an application or info URL if one is visible
  "fee": number or null,                 // entry/application fee as a number, no currency symbol; 0 if explicitly free
  "award": "string or null",             // prize, stipend, or what the artist gets (e.g. "$5,000 + group show")
  "requirements": "string or null",      // what to submit (images, statement, CV, eligibility)
  "notes": "string or null"              // anything else useful: location, dates of the show, eligibility, contact
}

Rules:
- Choose the single best "type". Use "open_call" for a general call for art/entries, "exhibition" for a specific show, "residency" for residencies, "grant" for grants, "prize"/"award" for competitions, "commission" for commissions. Use "other" only if none fit.
- For "deadline", convert any date you see (e.g. "Deadline: March 3" or "apply by 3/3/2026") to YYYY-MM-DD. If only a month or season is given, or no year is clear, pick the next future occurrence relative to today (${today}). If there is genuinely no deadline visible, use null, do not invent one.
- For an Instagram screenshot, the organization is often the @handle at the top; the link is often "link in bio" (if so, leave link null and note it).
- Never invent a title, deadline, fee, or URL that is not supported by the image. Use null when unsure.
- Keep "notes" short, a few lines at most.`;

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
        model: "claude-sonnet-5",
        max_tokens: 800,
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
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const fee = typeof parsed.fee === "number"
      ? parsed.fee
      : parsed.fee != null && !isNaN(Number(parsed.fee)) ? Number(parsed.fee) : null;
    const type = TYPES.includes(parsed.type) ? parsed.type : "open_call";
    const deadline = typeof parsed.deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.deadline)
      ? parsed.deadline
      : null;

    return new Response(
      JSON.stringify({
        title: str(parsed.title),
        organization: str(parsed.organization),
        deadline,
        type,
        link: str(parsed.link),
        fee,
        award: str(parsed.award),
        requirements: str(parsed.requirements),
        notes: str(parsed.notes),
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
