import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { useStore, fmtMoney, fmtDate } from "@/lib/store";
import { useUserProfile, getFirstName, getLastName } from "@/lib/userProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ExpenseCategory } from "@/lib/types";

const CAT_LABELS: Record<ExpenseCategory, string> = {
  studio_rent: "Studio & rent",
  materials: "Materials & supplies",
  framing: "Framing & shipping",
  marketing: "Marketing",
  equipment: "Equipment",
  fees_commissions: "Professional fees",
  other: "Other",
  shipping: "Framing & shipping",
  travel: "Other",
};
export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "studio_rent", label: "Studio & rent" },
  { value: "materials", label: "Materials & supplies" },
  { value: "framing", label: "Framing & shipping" },
  { value: "marketing", label: "Marketing" },
  { value: "equipment", label: "Equipment" },
  { value: "fees_commissions", label: "Professional fees" },
  { value: "other", label: "Other" },
];
export const catLabel = (c: ExpenseCategory) => CAT_LABELS[c] ?? c;

type Preset = "this_month" | "this_quarter" | "this_year" | "last_year" | "custom";

function presetRange(p: Exclude<Preset, "custom">): { from: Date; to: Date; label: string } {
  const now = new Date();
  const y = now.getFullYear();
  if (p === "this_month") {
    const from = new Date(y, now.getMonth(), 1);
    const to = new Date(y, now.getMonth() + 1, 0, 23, 59, 59);
    return { from, to, label: `${from.toLocaleString("en-US", { month: "long" })} ${y}` };
  }
  if (p === "this_quarter") {
    const q = Math.floor(now.getMonth() / 3);
    const from = new Date(y, q * 3, 1);
    const to = new Date(y, q * 3 + 3, 0, 23, 59, 59);
    return { from, to, label: `Q${q + 1} ${y}` };
  }
  if (p === "this_year") {
    return { from: new Date(y, 0, 1), to: new Date(y, 11, 31, 23, 59, 59), label: `${y}` };
  }
  return { from: new Date(y - 1, 0, 1), to: new Date(y - 1, 11, 31, 23, 59, 59), label: `${y - 1}` };
}

export function PnLStatement() {
  const { invoices, expenses, artworks } = useStore();
  const { fullName } = useUserProfile();
  const artistLine = fullName ? `${getFirstName(fullName)}${getLastName(fullName) ? " " + getLastName(fullName) : ""} · Artist` : "";
  const [step, setStep] = useState<"select" | "report">("select");
  const [preset, setPreset] = useState<Preset>("this_year");
  const todayStr = new Date().toISOString().slice(0, 10);
  const [customFrom, setCustomFrom] = useState(todayStr);
  const [customTo, setCustomTo] = useState(todayStr);
  const [range, setRange] = useState<{ from: Date; to: Date; label: string } | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (preset === "custom") {
      const from = new Date(customFrom);
      const to = new Date(customTo + "T23:59:59");
      setRange({ from, to, label: `${fmtDate(from.toISOString())} – ${fmtDate(to.toISOString())}` });
    } else {
      setRange(presetRange(preset));
    }
    setStep("report");
  };

  const report = useMemo(() => {
    if (!range) return null;
    const fromT = range.from.getTime();
    const toT = range.to.getTime();
    const paid = invoices
      .filter(i => i.status === "paid" && i.paidAt)
      .filter(i => {
        const t = new Date(i.paidAt!).getTime();
        return t >= fromT && t <= toT;
      })
      .sort((a, b) => new Date(a.paidAt!).getTime() - new Date(b.paidAt!).getTime());
    const exp = expenses
      .filter(e => {
        const t = new Date(e.date).getTime();
        return t >= fromT && t <= toT;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const gross = paid.reduce((s, i) => s + i.amount, 0);
    const totalExp = exp.reduce((s, e) => s + e.amount, 0);
    const workTitle = (id: string) => artworks.find(a => a.id === id)?.title;
    return {
      paid: paid.map(i => ({
        number: i.number,
        buyer: i.buyerName,
        work: i.artworkId ? (workTitle(i.artworkId) ?? "—") : (i.customWork?.title ?? "—"),
        amount: i.amount,
        date: i.paidAt!,
      })),
      exp,
      gross,
      totalExp,
      net: gross - totalExp,
    };
  }, [range, invoices, expenses, artworks]);

  const printReport = () => {
    if (!range || !report) return;
    const w = window.open("", "_blank", "width=800,height=1000");
    if (!w) return;
    const paidRows = report.paid.map(p => `<tr><td>${fmtDate(p.date)}</td><td>${p.number}</td><td>${p.buyer}</td><td><em>${p.work}</em></td><td class="right">${fmtMoney(p.amount)}</td></tr>`).join("") ||
      `<tr><td colspan="5" style="text-align:center;color:#999;font-style:italic;padding:20px">No paid invoices in this period.</td></tr>`;
    const expRows = report.exp.map(e => `<tr><td>${fmtDate(e.date)}</td><td>${e.description ?? e.vendor ?? "—"}</td><td>${catLabel(e.category)}</td><td class="right">${fmtMoney(e.amount)}</td></tr>`).join("") ||
      `<tr><td colspan="4" style="text-align:center;color:#999;font-style:italic;padding:20px">No expenses in this period.</td></tr>`;
    w.document.write(`<!doctype html><html><head><title>P&L · ${range.label}</title>
<style>
  body{font-family:Georgia,serif;padding:60px;color:#1a1a1a;max-width:780px;margin:auto;background:#f5f3ee}
  h1{font-weight:400;font-size:36px;margin:0;letter-spacing:-.01em}
  .eyebrow{font-family:Helvetica,sans-serif;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#666}
  hr{border:none;border-top:1px solid #ccc;margin:24px 0}
  table{width:100%;border-collapse:collapse;margin-top:12px;font-family:Helvetica,sans-serif;font-size:12px}
  td,th{padding:10px 8px;text-align:left;border-bottom:1px solid #ddd;vertical-align:top}
  th{font-family:Helvetica,sans-serif;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#666;font-weight:500}
  .right{text-align:right}
  .section{margin-top:36px}
  .summary{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:24px;border-top:1px solid #ccc;padding-top:20px}
  .summary .v{font-family:Georgia,serif;font-size:24px;margin-top:6px}
  .net{font-size:28px}
</style></head><body>
<div class="eyebrow">Allegory Studio · Profit & Loss</div>
${artistLine ? `<div class="eyebrow" style="margin-top:4px">${artistLine}</div>` : ""}
<h1>Profit &amp; Loss Statement</h1>
<div class="eyebrow" style="margin-top:8px">${range.label}</div>
<hr/>
<div class="section">
  <div class="eyebrow">Income · paid invoices</div>
  <table><tr><th>Date</th><th>Invoice</th><th>Buyer</th><th>Work</th><th class="right">Amount</th></tr>${paidRows}
  <tr><td colspan="4" style="font-family:Georgia,serif">Gross income</td><td class="right" style="font-family:Georgia,serif">${fmtMoney(report.gross)}</td></tr></table>
</div>
<div class="section">
  <div class="eyebrow">Expenses</div>
  <table><tr><th>Date</th><th>Description</th><th>Category</th><th class="right">Amount</th></tr>${expRows}
  <tr><td colspan="3" style="font-family:Georgia,serif">Total expenses</td><td class="right" style="font-family:Georgia,serif">${fmtMoney(report.totalExp)}</td></tr></table>
</div>
<div class="summary">
  <div><div class="eyebrow">Gross income</div><div class="v">${fmtMoney(report.gross)}</div></div>
  <div><div class="eyebrow">Total expenses</div><div class="v">${fmtMoney(report.totalExp)}</div></div>
  <div><div class="eyebrow">Net profit</div><div class="v net">${fmtMoney(report.net)}</div></div>
</div>
<hr/>
<div style="font-family:Helvetica,sans-serif;font-size:10px;color:#666;text-align:center">Allegory Studio · Cash-basis P&L · Income from paid invoices, expenses logged manually.</div>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  if (step === "select") {
    return (
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="eyebrow mb-2">Profit & loss</div>
          <DialogTitle className="font-display text-2xl font-normal">Generate a P&amp;L statement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleGenerate} className="grid gap-4 mt-2">
          <div className="grid grid-cols-2 gap-2">
            {([
              ["this_month", "This month"],
              ["this_quarter", "This quarter"],
              ["this_year", "This year"],
              ["last_year", "Last year"],
            ] as [Preset, string][]).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setPreset(v)}
                className={`hairline-card px-4 py-3 text-left text-sm transition-colors ${preset === v ? "bg-surface" : "hover:bg-surface/50"}`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPreset("custom")}
              className={`hairline-card px-4 py-3 text-left text-sm transition-colors col-span-2 ${preset === "custom" ? "bg-surface" : "hover:bg-surface/50"}`}
            >
              Custom range
            </button>
          </div>
          {preset === "custom" && (
            <div className="grid grid-cols-2 gap-3 p-4 border border-dashed border-border rounded-sm bg-surface/40">
              <div><Label>From</Label><Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} required /></div>
              <div><Label>To</Label><Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} required /></div>
            </div>
          )}
          <div className="flex justify-end">
            <Button type="submit">Generate P&amp;L</Button>
          </div>
        </form>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div className="eyebrow mb-2">Allegory Studio</div>
        <DialogTitle className="font-display text-2xl font-normal">
          Profit &amp; Loss Statement · {range?.label}
        </DialogTitle>
      </DialogHeader>

      <div className="flex items-center justify-between mt-2">
        <button type="button" onClick={() => setStep("select")} className="text-xs text-muted-foreground hover:text-foreground underline">
          ← Change date range
        </button>
        <Button size="sm" variant="outline" onClick={printReport} className="gap-2">
          <Printer className="h-3.5 w-3.5" /> Print / Export PDF
        </Button>
      </div>

      <div className="rule mt-3" />

      {/* Income */}
      <section className="mt-5">
        <div className="eyebrow mb-3">Income · paid invoices</div>
        <div className="hairline-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b border-border">
              {["Date", "Invoice", "Buyer", "Work", "Amount"].map(h => (
                <th key={h} className="eyebrow px-4 py-3 font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {report && report.paid.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">No paid invoices in this period.</td></tr>
              ) : (
                report?.paid.map((p, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(p.date)}</td>
                    <td className="px-4 py-3 tabular-nums">{p.number}</td>
                    <td className="px-4 py-3">{p.buyer}</td>
                    <td className="px-4 py-3 font-display italic">{p.work}</td>
                    <td className="px-4 py-3 tabular-nums text-right">{fmtMoney(p.amount)}</td>
                  </tr>
                ))
              )}
              <tr className="bg-surface/40">
                <td colSpan={4} className="px-4 py-3 font-display">Gross income</td>
                <td className="px-4 py-3 tabular-nums text-right font-display">{fmtMoney(report?.gross ?? 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Expenses */}
      <section className="mt-8">
        <div className="eyebrow mb-3">Expenses</div>
        <div className="hairline-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b border-border">
              {["Date", "Description", "Category", "Amount"].map(h => (
                <th key={h} className="eyebrow px-4 py-3 font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {report && report.exp.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground italic">No expenses in this period.</td></tr>
              ) : (
                report?.exp.map(e => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(e.date)}</td>
                    <td className="px-4 py-3">{e.description ?? e.vendor ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{catLabel(e.category)}</td>
                    <td className="px-4 py-3 tabular-nums text-right">{fmtMoney(e.amount)}</td>
                  </tr>
                ))
              )}
              <tr className="bg-surface/40">
                <td colSpan={3} className="px-4 py-3 font-display">Total expenses</td>
                <td className="px-4 py-3 tabular-nums text-right font-display">{fmtMoney(report?.totalExp ?? 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Summary */}
      <section className="mt-8 grid grid-cols-3 gap-px bg-border border border-border">
        <div className="bg-background p-5"><div className="eyebrow mb-2">Gross income</div><div className="font-display text-2xl">{fmtMoney(report?.gross ?? 0)}</div></div>
        <div className="bg-background p-5"><div className="eyebrow mb-2">Total expenses</div><div className="font-display text-2xl">{fmtMoney(report?.totalExp ?? 0)}</div></div>
        <div className="bg-background p-5"><div className="eyebrow mb-2">Net profit</div><div className="font-display text-3xl">{fmtMoney(report?.net ?? 0)}</div></div>
      </section>
    </DialogContent>
  );
}
