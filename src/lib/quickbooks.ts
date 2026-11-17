// Native QuickBooks Online integration (client side). When the member has
// connected QuickBooks (via Settings), each newly created invoice is pushed to
// our serverless sync endpoint, which writes a Sales Receipt (paid) or Invoice
// (unpaid) into their QuickBooks company. Fire-and-forget: it never blocks or
// breaks invoice creation, and the endpoint itself no-ops if they aren't
// connected.
import { supabase } from "@/integrations/supabase/client";
import type { Invoice } from "@/lib/types";

// Master switch. Turned on once the Intuit app keys are set on Vercel and the
// quickbooks_* migration is applied. (During the sandbox phase the Settings
// Connect button is additionally gated to admins — see Settings.tsx.)
export const QUICKBOOKS_ENABLED = true;

export async function syncInvoiceToQuickBooks(invoice: Invoice, artworkTitle = ""): Promise<void> {
  if (!QUICKBOOKS_ENABLED) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    void fetch("/api/quickbooks/sync-invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        number: invoice.number,
        status: invoice.status,
        buyerName: invoice.buyerName,
        buyerEmail: invoice.buyerEmail ?? "",
        buyerPhone: invoice.buyerPhone ?? "",
        item: invoice.customWork?.title || artworkTitle || "Artwork",
        subtotal: invoice.subtotal, // omitted when undefined -> endpoint uses a single total line
        taxAmount: invoice.taxAmount ?? 0,
        shippingAmount: invoice.shippingAmount ?? 0,
        amount: invoice.amount ?? 0,
        dueAt: invoice.dueAt ?? "",
      }),
      keepalive: true,
    }).catch(() => { /* never surface to the user */ });
  } catch {
    /* ignore */
  }
}
