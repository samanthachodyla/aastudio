import { useMemo, useRef, useState } from "react";
import { Plus, Download, Trash2, FileText, Pencil, ScanLine } from "lucide-react";
import { PnLStatement, EXPENSE_CATEGORIES, catLabel } from "@/components/PnLStatement";
import { AppShell } from "@/components/AppShell";
import { useStore, fmtMoney, fmtDate } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/StatusPill";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import type { InvoiceStatus, Artwork, Invoice, Expense, ExpenseCategory, PaymentType, ExpenseFrequency } from "@/lib/types";
import { toast } from "sonner";
import { useUserProfile, getFirstName, getLastName } from "@/lib/userProfile";

const TAB_TRIGGER = "rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm gap-2";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const Sales = () => {
  const {
    invoices, artworks, addInvoice, updateInvoice, deleteInvoice,
    expenses, addExpense, updateExpense, deleteExpense,
  } = useStore();
  const [open, setOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const { fullName, invoiceLogo } = useUserProfile();
  const artistLine = fullName ? `${getFirstName(fullName)}${getLastName(fullName) ? " " + getLastName(fullName) : ""} · Artist` : "";
  const [pnlOpen, setPnlOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanPrefill, setScanPrefill] = useState<ReceiptPrefill | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const handleReceipt = async (file?: File) => {
    if (!file) return;
    setScanning(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Couldn't read that file."));
        reader.readAsDataURL(file);
      });
      const base64 = dataUrl.split(",")[1] ?? "";
      const { data, error } = await supabase.functions.invoke("receipt-scan", {
        body: { imageBase64: base64, mediaType: file.type },
      });
      if (error) {
        let msg = "Couldn't read that receipt. Try a clearer photo, or add it manually.";
        try {
          const body = await (error as { context?: Response }).context?.json?.();
          if (body?.error) msg = body.error;
        } catch { /* keep default */ }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      setScanPrefill({
        date: data.date || undefined,
        amount: data.amount ?? undefined,
        description: data.description || data.vendor || "",
        category: (data.category || "materials") as ExpenseCategory,
        paymentType: (data.paymentType || "") as PaymentType | "",
      });
      toast.success("Receipt scanned — review and save.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't read that receipt.");
    } finally {
      setScanning(false);
      if (receiptInputRef.current) receiptInputRef.current.value = "";
    }
  };

  const totals = {
    paid: invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0),
    outstanding: invoices.filter(i => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0),
    overdue: invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0),
    expenses: expenses.reduce((s, e) => s + e.amount, 0),
  };

  const year = new Date().getFullYear();
  const monthly = useMemo(() => {
    const arr = MONTHS.map((m, i) => ({ month: m, income: 0, idx: i }));
    invoices
      .filter(i => i.status === "paid" && i.paidAt)
      .forEach(i => {
        const d = new Date(i.paidAt!);
        if (d.getFullYear() === year) arr[d.getMonth()].income += i.amount;
      });
    return arr;
  }, [invoices, year]);
  const hasCashflow = monthly.some(m => m.income > 0);

  const ytd = useMemo(() => {
    const start = new Date(year, 0, 1).getTime();
    const gross = invoices
      .filter(i => i.status === "paid" && i.paidAt && new Date(i.paidAt).getTime() >= start)
      .reduce((s, i) => s + i.amount, 0);
    const exp = expenses
      .filter(e => new Date(e.date).getTime() >= start)
      .reduce((s, e) => s + e.amount, 0);
    return { gross, exp, net: gross - exp };
  }, [invoices, expenses, year]);

  const sortedExpenses = useMemo(
    () => [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses],
  );

  // Recurring spend, normalized to a monthly figure + annualized.
  const recurring = useMemo(() => {
    const perMonth = expenses
      .filter(e => e.recurring)
      .reduce((sum, e) => {
        const f = e.frequency ?? "monthly";
        const monthly = f === "quarterly" ? e.amount / 3 : f === "annual" ? e.amount / 12 : e.amount;
        return sum + monthly;
      }, 0);
    return { perMonth, annual: perMonth * 12 };
  }, [expenses]);

  // Monthly burn for the current year + annual total.
  const monthlySpend = useMemo(() => {
    const arr = MONTHS.map((m, i) => ({ month: m, spend: 0, idx: i }));
    expenses.forEach(e => {
      const d = new Date(e.date);
      if (d.getFullYear() === year) arr[d.getMonth()].spend += e.amount;
    });
    return arr;
  }, [expenses, year]);
  const hasSpend = monthlySpend.some(m => m.spend > 0);
  const annualSpend = monthlySpend.reduce((s, m) => s + m.spend, 0);

  const workFor = (inv: Invoice) => {
    if (inv.artworkId) {
      const aw = artworks.find(a => a.id === inv.artworkId);
      if (aw) return { title: aw.title, medium: aw.medium, year: aw.year, dimensions: aw.dimensions };
    }
    if (inv.customWork) return inv.customWork;
    return null;
  };

  const exportPDF = (invId: string) => {
    const inv = invoices.find(i => i.id === invId);
    if (!inv) return;
    const work = workFor(inv);
    const shipping = inv.shippingSameAsBilling ? inv.billingAddress : inv.shippingAddress;
    const w = window.open("", "_blank", "width=800,height=1000");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${inv.number}</title>
<style>
  body{font-family:Georgia,serif;padding:60px;color:#1a1a1a;max-width:680px;margin:auto;background:#f5f3ee}
  h1{font-weight:400;font-size:42px;margin:0;letter-spacing:-.01em}
  .eyebrow{font-family:'Helvetica',sans-serif;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#666}
  hr{border:none;border-top:1px solid #ccc;margin:24px 0}
  table{width:100%;border-collapse:collapse;margin-top:24px;font-family:Helvetica,sans-serif;font-size:13px}
  td,th{padding:12px 0;text-align:left;border-bottom:1px solid #ddd;vertical-align:top}
  .right{text-align:right}
  .total{font-family:Georgia,serif;font-size:32px;font-weight:400}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;font-family:Helvetica,sans-serif;font-size:13px;margin-top:16px}
  .meta{display:flex;justify-content:space-between;font-family:Helvetica,sans-serif;font-size:13px;margin-top:8px}
  .block{white-space:pre-line;margin-top:6px;line-height:1.5}
  .logo{max-height:72px;max-width:260px;margin-bottom:16px;object-fit:contain}
</style></head><body>
${invoiceLogo ? `<img class="logo" src="${invoiceLogo}" alt="Studio logo"/>` : ""}
<div class="eyebrow">${invoiceLogo ? "Invoice" : "Allegory Studio · Invoice"}</div>
${artistLine ? `<div class="eyebrow" style="margin-top:4px">${artistLine}</div>` : ""}
<h1>${inv.number}</h1>
<hr/>
<div class="meta">
  <div><div class="eyebrow">Issued</div><div class="block">${fmtDate(inv.issuedAt)}</div></div>
  <div><div class="eyebrow">Due</div><div class="block">${inv.dueAt ? fmtDate(inv.dueAt) : "—"}</div></div>
  <div><div class="eyebrow">Terms</div><div class="block">${inv.paymentTerms ?? "Net 30"}</div></div>
</div>
<div class="grid">
  <div>
    <div class="eyebrow">Bill to</div>
    <div class="block"><strong>${inv.buyerName}</strong>${inv.buyerEmail ? `<br/>${inv.buyerEmail}` : ""}${inv.buyerPhone ? `<br/>${inv.buyerPhone}` : ""}${inv.billingAddress ? `<br/>${inv.billingAddress.replace(/\n/g, "<br/>")}` : (inv.buyerAddress ? `<br/>${inv.buyerAddress}` : "")}</div>
  </div>
  <div>
    <div class="eyebrow">Ship to</div>
    <div class="block">${shipping ? shipping.replace(/\n/g, "<br/>") : "—"}</div>
  </div>
</div>
<table><tr><th>Work</th><th>Details</th><th class="right">Amount</th></tr>
<tr><td><em>${work?.title ?? "—"}</em></td><td>${work?.medium ?? ""}${work?.year ? `, ${work.year}` : ""}${work?.dimensions ? `<br/>${work.dimensions}` : ""}</td><td class="right">${fmtMoney(inv.amount)}</td></tr>
</table>
<div style="text-align:right;margin-top:32px"><div class="eyebrow">Total due</div><div class="total">${fmtMoney(inv.amount)}</div></div>
<hr/>
<div style="font-family:Helvetica,sans-serif;font-size:11px;color:#666;text-align:center">Thank you. — Allegory Studio</div>
</body></html>`);
    w.document.close(); setTimeout(() => w.print(), 300);
  };

  return (
    <AppShell
      eyebrow="Sales & Finance"
      title="The financial life of your practice."
      description="Invoices, income, outstanding balances, and a clear view of how money is moving — everything in one place."
    >
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 mb-8 overflow-x-auto">
          <TabsTrigger value="overview" className={TAB_TRIGGER}>Overview</TabsTrigger>
          <TabsTrigger value="invoices" className={TAB_TRIGGER}>Invoices</TabsTrigger>
          <TabsTrigger value="expenses" className={TAB_TRIGGER}>Expenses</TabsTrigger>
          {/* Pricing tab hidden for the time being (PricingIntelligence remains defined below). */}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-0">
          <section className="mb-10">
            <div className="eyebrow mb-3">Finance dashboard</div>
            <div className="rule mb-6" />

            {/* Stat strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border mb-6">
              <div className="bg-background p-6"><div className="eyebrow mb-3">Total earned</div><div className="font-display text-3xl">{fmtMoney(totals.paid)}</div></div>
              <div className="bg-background p-6"><div className="eyebrow mb-3">Outstanding</div><div className="font-display text-3xl">{fmtMoney(totals.outstanding)}</div></div>
              <div className="bg-background p-6"><div className="eyebrow mb-3 text-destructive">Overdue</div><div className="font-display text-3xl">{fmtMoney(totals.overdue)}</div></div>
              <div className="bg-background p-6"><div className="eyebrow mb-3">Net</div><div className="font-display text-3xl">{fmtMoney(totals.paid - totals.expenses)}</div></div>
            </div>

            {/* Cash flow chart */}
            <div className="hairline-card px-6 py-5 mb-6">
              <div className="flex items-baseline justify-between mb-4">
                <div className="eyebrow">Monthly cash flow · {year}</div>
                <div className="text-xs text-muted-foreground">Paid invoices</div>
              </div>
              {hasCashflow ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthly} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--surface))" }}
                        contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }}
                        formatter={(v: number) => fmtMoney(v)}
                      />
                      <Bar dataKey="income" fill="hsl(var(--foreground))" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground italic">
                  Log invoices to see your cash flow take shape.
                </div>
              )}
            </div>

            {/* YTD summary */}
            <div className="grid grid-cols-3 gap-px bg-border border border-border mb-6">
              <div className="bg-background p-5"><div className="eyebrow mb-2 text-muted-foreground">Gross income · YTD</div><div className="font-display text-2xl text-muted-foreground">{fmtMoney(ytd.gross)}</div></div>
              <div className="bg-background p-5"><div className="eyebrow mb-2 text-muted-foreground">Total expenses · YTD</div><div className="font-display text-2xl text-muted-foreground">{fmtMoney(ytd.exp)}</div></div>
              <div className="bg-background p-5"><div className="eyebrow mb-2 text-muted-foreground">Net · YTD</div><div className="font-display text-2xl text-muted-foreground">{fmtMoney(ytd.net)}</div></div>
            </div>

            <Dialog open={pnlOpen} onOpenChange={setPnlOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <FileText className="h-3.5 w-3.5" /> Generate P&amp;L
                </Button>
              </DialogTrigger>
              <PnLStatement key={pnlOpen ? "open" : "closed"} />
            </Dialog>
          </section>
        </TabsContent>

        {/* Invoices */}
        <TabsContent value="invoices" className="mt-0">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="eyebrow mb-2">Invoices</div>
              <h2 className="font-display text-2xl">Every sale, on the record.</h2>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" /> New invoice</Button>
              </DialogTrigger>
              <InvoiceForm
                artworks={artworks}
                onSubmit={(data) => { addInvoice(data); setOpen(false); toast.success("Invoice created"); }}
              />
            </Dialog>
          </div>
          <div className="rule mb-4" />

          <div className="hairline-card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b border-border">
                {["No.", "Buyer", "Work", "Issued", "Due", "Status", "Amount", ""].map(h => <th key={h} className="eyebrow px-4 py-3 font-medium">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {invoices.map(inv => {
                  const work = workFor(inv);
                  return (
                    <tr key={inv.id} className="hover:bg-surface/50 group">
                      <td className="px-4 py-4 tabular-nums">{inv.number}</td>
                      <td className="px-4 py-4">
                        <div>{inv.buyerName}</div>
                        {inv.buyerEmail && <div className="text-xs text-muted-foreground">{inv.buyerEmail}</div>}
                      </td>
                      <td className="px-4 py-4 font-display italic">
                        {work?.title ?? "—"}
                        {!inv.artworkId && inv.customWork && <span className="ml-2 not-italic font-sans text-[10px] uppercase tracking-wider text-muted-foreground">Custom</span>}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground text-xs">{fmtDate(inv.issuedAt)}</td>
                      <td className="px-4 py-4 text-muted-foreground text-xs">{inv.dueAt ? fmtDate(inv.dueAt) : "—"}</td>
                      <td className="px-4 py-4">
                        <Select value={inv.status} onValueChange={(v: InvoiceStatus) => updateInvoice(inv.id, { status: v, paidAt: v === "paid" ? new Date().toISOString() : inv.paidAt })}>
                          <SelectTrigger className="h-7 w-32 text-xs border-0 bg-transparent p-0 hover:bg-surface px-2"><StatusPill status={inv.status} /></SelectTrigger>
                          <SelectContent>
                            {(["draft", "sent", "paid", "overdue"] as InvoiceStatus[]).map(s => (
                              <SelectItem key={s} value={s}><StatusPill status={s} /></SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-4 tabular-nums text-right">{fmtMoney(inv.amount)}</td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <button onClick={() => exportPDF(inv.id)} className="text-muted-foreground hover:text-foreground mr-3" title="Print invoice">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteInvoice(inv.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Expenses */}
        <TabsContent value="expenses" className="mt-0">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="eyebrow mb-2">Expenses</div>
              <h2 className="font-display text-2xl">What the practice costs.</h2>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={receiptInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => handleReceipt(e.target.files?.[0])}
              />
              <Button
                size="sm"
                variant="outline"
                className="gap-2 opacity-60"
                onClick={() => receiptInputRef.current?.click()}
                disabled
                title="Receipt scanning is coming soon"
              >
                {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanLine className="h-3.5 w-3.5" />}
                {scanning ? "Reading…" : "Scan receipt · coming soon"}
              </Button>
              <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="h-3.5 w-3.5" /> New expense
                  </Button>
                </DialogTrigger>
                <ExpenseForm onSubmit={(data) => { addExpense(data); setExpenseOpen(false); toast.success("Expense logged"); }} />
              </Dialog>
            </div>
          </div>
          <div className="rule mb-4" />

          {/* Review a scanned receipt before saving */}
          <Dialog open={scanPrefill !== null} onOpenChange={(o) => !o && setScanPrefill(null)}>
            {scanPrefill && (
              <ExpenseForm
                prefill={scanPrefill}
                onSubmit={(data) => { addExpense(data); setScanPrefill(null); toast.success("Expense saved"); }}
              />
            )}
          </Dialog>

          {/* Edit expense */}
          <Dialog open={!!editExpense} onOpenChange={(o) => !o && setEditExpense(null)}>
            {editExpense && (
              <ExpenseForm
                key={editExpense.id}
                expense={editExpense}
                onSubmit={(data) => { updateExpense(editExpense.id, data); setEditExpense(null); toast.success("Expense updated"); }}
              />
            )}
          </Dialog>

          {sortedExpenses.length === 0 ? (
            <div className="hairline-card px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground italic mb-4">
                No expenses logged yet. Track materials, framing, studio rent, and anything else the practice costs.
              </p>
              <Button size="sm" variant="outline" onClick={() => setExpenseOpen(true)} className="gap-2">
                <Plus className="h-3.5 w-3.5" /> Log your first expense
              </Button>
            </div>
          ) : (
            <>
              {/* Recurring snapshot (item 8) */}
              {recurring.perMonth > 0 && (
                <div className="grid grid-cols-2 gap-px bg-border border border-border mb-6">
                  <div className="bg-background p-5">
                    <div className="eyebrow mb-2">Recurring · monthly</div>
                    <div className="font-display text-2xl">{fmtMoney(recurring.perMonth)}</div>
                  </div>
                  <div className="bg-background p-5">
                    <div className="eyebrow mb-2">Recurring · annualized</div>
                    <div className="font-display text-2xl">{fmtMoney(recurring.annual)}</div>
                  </div>
                </div>
              )}

              {/* Monthly burn-rate chart (item 9) */}
              <div className="hairline-card px-6 py-5 mb-6">
                <div className="flex items-baseline justify-between mb-4">
                  <div className="eyebrow">Monthly spend · {year}</div>
                  <div className="text-xs text-muted-foreground">Annual total · {fmtMoney(annualSpend)}</div>
                </div>
                {hasSpend ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlySpend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--surface))" }}
                          contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }}
                          formatter={(v: number) => fmtMoney(v)}
                        />
                        <Bar dataKey="spend" fill="hsl(var(--foreground))" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-sm text-muted-foreground italic">
                    Log expenses to see your monthly burn.
                  </div>
                )}
              </div>

              <div className="hairline-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="text-left border-b border-border">
                    {["Date", "Description", "Category", "Payment", "Amount", ""].map(h => (
                      <th key={h} className={`eyebrow px-4 py-3 font-medium ${h === "Amount" ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {sortedExpenses.map(e => (
                      <tr
                        key={e.id}
                        onClick={() => setEditExpense(e)}
                        className="group cursor-pointer transition-colors hover:bg-surface/50"
                      >
                        <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap tabular-nums">{fmtDate(e.date)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{e.description ?? e.vendor ?? "—"}</span>
                            {e.recurring && (
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded-full px-2 py-0.5">
                                {FREQUENCIES.find(f => f.value === e.frequency)?.label ?? "Recurring"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-block text-[11px] tracking-wide text-muted-foreground bg-surface border border-border rounded-full px-2.5 py-0.5 whitespace-nowrap">
                            {catLabel(e.category)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground text-xs whitespace-nowrap">
                          {e.paymentType ? PAYMENT_TYPES.find(p => p.value === e.paymentType)?.label ?? "—" : "—"}
                        </td>
                        <td className="px-4 py-4 tabular-nums text-right font-medium whitespace-nowrap">{fmtMoney(e.amount)}</td>
                        <td className="px-4 py-4 text-right whitespace-nowrap" onClick={(ev) => ev.stopPropagation()}>
                          <button onClick={() => setEditExpense(e)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground mr-3 align-middle" title="Edit expense">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => deleteExpense(e.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive align-middle" title="Delete expense">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-muted-foreground italic">Tap any row to edit.</p>
                <p className="text-xs text-muted-foreground">
                  Total logged expenses: <span className="tabular-nums text-foreground">{fmtMoney(totals.expenses)}</span>
                </p>
              </div>
            </>
          )}
        </TabsContent>

        {/* Pricing tab hidden for the time being. */}
      </Tabs>
    </AppShell>
  );
};

const PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: "debit_card", label: "Debit card" },
  { value: "credit_card", label: "Credit card" },
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "other", label: "Other" },
];

const FREQUENCIES: { value: ExpenseFrequency; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

type ReceiptPrefill = {
  date?: string;
  amount?: number;
  description?: string;
  category?: ExpenseCategory;
  paymentType?: PaymentType | "";
};

function ExpenseForm({ expense, prefill, onSubmit }: {
  expense?: Expense;
  prefill?: ReceiptPrefill;
  onSubmit: (data: any) => void;
}) {
  const isEdit = !!expense;
  const [form, setForm] = useState({
    date: (expense?.date ?? prefill?.date ?? new Date().toISOString()).slice(0, 10),
    description: expense?.description ?? expense?.vendor ?? prefill?.description ?? "",
    category: expense?.category ?? prefill?.category ?? ("materials" as ExpenseCategory),
    amount: expense ? String(expense.amount) : prefill?.amount != null ? String(prefill.amount) : "",
    recurring: expense?.recurring ?? false,
    frequency: expense?.frequency ?? ("monthly" as ExpenseFrequency),
    paymentType: expense?.paymentType ?? prefill?.paymentType ?? ("" as PaymentType | ""),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date: new Date(form.date).toISOString(),
      description: form.description,
      category: form.category,
      amount: Number(form.amount),
      // On create, omit unset fields so basic expenses don't depend on the new
      // columns. On edit, send explicit values (incl. null) so unchecking a box
      // or clearing a field actually clears it in the database.
      recurring: form.recurring ? true : isEdit ? false : undefined,
      frequency: form.recurring ? form.frequency : isEdit ? null : undefined,
      paymentType: form.paymentType || (isEdit ? null : undefined),
    });
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle className="font-display text-2xl font-normal">{isEdit ? "Edit expense" : prefill ? "New expense · from receipt" : "New expense"}</DialogTitle></DialogHeader>
      <form className="grid gap-4 mt-2" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Date</Label>
            <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <Label>Amount</Label>
            <Input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
          </div>
          <div className="col-span-2">
            <Label>Description</Label>
            <Input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Framing materials, Studio rent" />
          </div>
          <div className="col-span-2">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v: ExpenseCategory) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Payment type</Label>
            <Select value={form.paymentType} onValueChange={(v: PaymentType) => setForm({ ...form, paymentType: v })}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPES.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">A tag only — no card or account numbers are stored.</p>
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.recurring}
                onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                className="h-3.5 w-3.5 accent-foreground"
              />
              This is a recurring expense
            </label>
          </div>
          {form.recurring && (
            <div className="col-span-2">
              <Label>Frequency</Label>
              <Select value={form.frequency} onValueChange={(v: ExpenseFrequency) => setForm({ ...form, frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex justify-end"><Button type="submit">{isEdit ? "Save changes" : "Log expense"}</Button></div>
      </form>
    </DialogContent>
  );
}

const CUSTOM = "__custom__";

function InvoiceForm({ artworks, onSubmit }: { artworks: Artwork[]; onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({
    artworkId: artworks[0]?.id ?? CUSTOM,
    customTitle: "",
    customMedium: "",
    customYear: new Date().getFullYear(),
    customDimensions: "",
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    billingAddress: "",
    shippingAddress: "",
    shippingSameAsBilling: true,
    amount: artworks[0]?.price ?? 0,
    paymentTerms: "Net 30",
    status: "draft" as InvoiceStatus,
    dueAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });

  const isCustom = form.artworkId === CUSTOM;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      artworkId: isCustom ? "" : form.artworkId,
      buyerName: form.buyerName,
      buyerEmail: form.buyerEmail || undefined,
      buyerPhone: form.buyerPhone || undefined,
      billingAddress: form.billingAddress || undefined,
      shippingSameAsBilling: form.shippingSameAsBilling,
      shippingAddress: form.shippingSameAsBilling ? undefined : (form.shippingAddress || undefined),
      amount: Number(form.amount),
      paymentTerms: form.paymentTerms,
      status: form.status,
      dueAt: new Date(form.dueAt).toISOString(),
    };
    if (isCustom) {
      payload.customWork = {
        title: form.customTitle,
        medium: form.customMedium || undefined,
        year: form.customYear ? Number(form.customYear) : undefined,
        dimensions: form.customDimensions || undefined,
      };
    }
    onSubmit(payload);
  };

  return (
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle className="font-display text-2xl font-normal">New invoice</DialogTitle></DialogHeader>
      <form className="grid gap-5 mt-2" onSubmit={handleSubmit}>
        {/* Work */}
        <div className="space-y-3">
          <div className="eyebrow">Work</div>
          <Select
            value={form.artworkId}
            onValueChange={(v) => {
              if (v === CUSTOM) { setForm({ ...form, artworkId: CUSTOM }); return; }
              const aw = artworks.find(a => a.id === v);
              setForm({ ...form, artworkId: v, amount: aw?.price ?? 0 });
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {artworks.map(a => <SelectItem key={a.id} value={a.id}>{a.title} — {fmtMoney(a.price)}</SelectItem>)}
              <SelectItem value={CUSTOM}>＋ Custom work (not in inventory)</SelectItem>
            </SelectContent>
          </Select>

          {isCustom && (
            <div className="grid grid-cols-2 gap-3 p-4 border border-dashed border-border rounded-sm bg-surface/40">
              <div className="col-span-2"><Label>Title</Label><Input required value={form.customTitle} onChange={(e) => setForm({ ...form, customTitle: e.target.value })} /></div>
              <div><Label>Medium</Label><Input value={form.customMedium} onChange={(e) => setForm({ ...form, customMedium: e.target.value })} placeholder="e.g. Oil on linen" /></div>
              <div><Label>Year</Label><Input type="number" value={form.customYear} onChange={(e) => setForm({ ...form, customYear: +e.target.value })} /></div>
              <div className="col-span-2"><Label>Dimensions</Label><Input value={form.customDimensions} onChange={(e) => setForm({ ...form, customDimensions: e.target.value })} placeholder="e.g. 24 × 30 in" /></div>
            </div>
          )}
        </div>

        {/* Buyer */}
        <div className="space-y-3">
          <div className="eyebrow">Buyer</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Name</Label><Input required value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.buyerEmail} onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })} placeholder="buyer@example.com" /></div>
            <div><Label>Phone</Label><Input type="tel" value={form.buyerPhone} onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })} placeholder="+1 555 555 5555" /></div>
          </div>
          <div>
            <Label>Billing address</Label>
            <Textarea rows={3} value={form.billingAddress} onChange={(e) => setForm({ ...form, billingAddress: e.target.value })} placeholder="Street, City, State ZIP, Country" />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.shippingSameAsBilling}
              onChange={(e) => setForm({ ...form, shippingSameAsBilling: e.target.checked })}
              className="h-3.5 w-3.5 accent-foreground"
            />
            Shipping address same as billing
          </label>
          {!form.shippingSameAsBilling && (
            <div>
              <Label>Shipping address</Label>
              <Textarea rows={3} value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} placeholder="Street, City, State ZIP, Country" />
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="space-y-3">
          <div className="eyebrow">Terms</div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} /></div>
            <div><Label>Payment terms</Label><Input value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} /></div>
            <div><Label>Due date</Label><Input type="date" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v: InvoiceStatus) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem><SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem><SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end"><Button type="submit">Create invoice</Button></div>
      </form>
    </DialogContent>
  );
}

function PricingIntelligence() {
  const { invoices, artworks } = useStore();
  const [analysis, setAnalysis] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [guidance, setGuidance] = useState<string>("");
  const [pricing, setPricing] = useState(false);
  const [form, setForm] = useState({ medium: "", width: "", height: "", hours: "" });

  const buildPaidPayload = () => {
    return invoices
      .filter(i => i.status === "paid")
      .map(i => {
        const aw = i.artworkId ? artworks.find(a => a.id === i.artworkId) : undefined;
        const work = aw ?? i.customWork ?? null;
        return {
          number: i.number,
          amount: i.amount,
          paidAt: i.paidAt,
          title: work?.title,
          medium: work?.medium,
          year: work?.year,
          dimensions: work?.dimensions,
        };
      });
  };

  const callFn = async (body: any) => {
    const { data, error } = await supabase.functions.invoke("pricing-intelligence", { body });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return (data?.text as string) ?? "";
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysis("");
    try {
      const text = await callFn({ mode: "analyze", paidInvoices: buildPaidPayload() });
      setAnalysis(text);
    } catch (e: any) {
      toast.error(e.message || "Couldn't analyze pricing");
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePriceNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setPricing(true);
    setGuidance("");
    try {
      const text = await callFn({
        mode: "price_new",
        paidInvoices: buildPaidPayload(),
        work: {
          medium: form.medium,
          width: form.width ? Number(form.width) : undefined,
          height: form.height ? Number(form.height) : undefined,
          hours: form.hours ? Number(form.hours) : undefined,
        },
      });
      setGuidance(text);
    } catch (err: any) {
      toast.error(err.message || "Couldn't generate guidance");
    } finally {
      setPricing(false);
    }
  };

  return (
    <section className="mt-14">
      <div className="mb-4">
        <div className="eyebrow mb-2">Pricing intelligence</div>
        <h2 className="font-display text-2xl">What should this work sell for?</h2>
      </div>
      <div className="rule mb-6" />

      {/* Part 1 */}
      <div className="mb-10">
        <div className="eyebrow mb-3">Analyze my sales data</div>
        <Button size="sm" onClick={handleAnalyze} disabled={analyzing} className="gap-2">
          {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {analyzing ? "Analyzing…" : "Analyze my pricing"}
        </Button>
        <p className="text-xs text-muted-foreground italic mt-2">
          The more sales you log, the sharper these insights get. Aim for 8–10 invoices to start seeing meaningful patterns.
        </p>

        {(analyzing || analysis) && (
          <div className="hairline-card px-6 py-5 mt-4 text-sm leading-relaxed whitespace-pre-wrap">
            {analyzing && !analysis ? (
              <span className="text-muted-foreground italic">Reading your invoices…</span>
            ) : (
              analysis
            )}
          </div>
        )}
      </div>

      {/* Part 2 */}
      <div>
        <div className="eyebrow mb-3">Price a new work</div>
        <form onSubmit={handlePriceNew} className="hairline-card px-6 py-5 grid gap-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Medium</Label>
              <Input value={form.medium} onChange={(e) => setForm({ ...form, medium: e.target.value })} placeholder="Oil on linen" required />
            </div>
            <div>
              <Label className="text-xs">Width (in)</Label>
              <Input type="number" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} required />
            </div>
            <div>
              <Label className="text-xs">Height (in)</Label>
              <Input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} required />
            </div>
            <div>
              <Label className="text-xs">Hours <span className="text-muted-foreground italic">(optional)</span></Label>
              <Input type="number" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
            </div>
          </div>
          <div>
            <Button type="submit" size="sm" disabled={pricing} className="gap-2">
              {pricing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {pricing ? "Thinking…" : "Get pricing guidance"}
            </Button>
          </div>
        </form>

        {(pricing || guidance) && (
          <div className="hairline-card px-6 py-5 mt-4 text-sm leading-relaxed whitespace-pre-wrap">
            {pricing && !guidance ? (
              <span className="text-muted-foreground italic">Comparing to your sales history…</span>
            ) : (
              guidance
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default Sales;
