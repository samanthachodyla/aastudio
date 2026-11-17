// Outbound Zapier integration. When the member sets a Zapier "Catch Hook" URL in
// Settings, new invoices are POSTed to it as a flat JSON payload, so a Zap can
// create a matching record in QuickBooks, Shopify, Google Sheets, etc. Each
// member uses their own hook (and therefore their own connected accounts), which
// is the right model for per-artist bookkeeping. Fire-and-forget: it never blocks
// or breaks invoice creation.
import { useUserProfile } from "@/lib/userProfile";
import type { Invoice } from "@/lib/types";

const isUrl = (v: string) => /^https:\/\/hooks\.zapier\.com\/|^https?:\/\/\S+$/i.test(v.trim());

export function emitInvoiceToZapier(invoice: Invoice, artworkTitle = ""): void {
  let profile: { zapierHookUrl: string; fullName: string; email: string };
  try {
    const s = useUserProfile.getState();
    profile = { zapierHookUrl: s.zapierHookUrl || "", fullName: s.fullName || "", email: s.email || "" };
  } catch {
    return;
  }
  const url = profile.zapierHookUrl.trim();
  if (!url || !isUrl(url)) return;

  const payload = {
    event: "invoice.created",
    invoice_number: invoice.number,
    date: invoice.issuedAt,
    due_date: invoice.dueAt ?? "",
    status: invoice.status,
    customer_name: invoice.buyerName ?? "",
    customer_email: invoice.buyerEmail ?? "",
    customer_phone: invoice.buyerPhone ?? "",
    item: invoice.customWork?.title || artworkTitle || "Artwork",
    subtotal: invoice.subtotal ?? invoice.amount ?? 0,
    tax: invoice.taxAmount ?? 0,
    shipping: invoice.shippingAmount ?? 0,
    total: invoice.amount ?? 0,
    currency: "USD",
    artist_name: profile.fullName,
    artist_email: profile.email,
  };

  try {
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => { /* never surface to the user */ });
  } catch {
    /* ignore */
  }
}
