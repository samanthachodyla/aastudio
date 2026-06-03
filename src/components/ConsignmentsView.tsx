import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, FileSignature, Sparkles, ArrowRight, Trash2 } from "lucide-react";
import { useStore, fmtMoney, fmtDate, daysUntil } from "@/lib/store";
import { useTier } from "@/lib/tier";
import { useUserProfile } from "@/lib/userProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/StatusPill";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { UpgradeCard } from "@/components/UpgradeCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Consignment, ConsignmentPaymentTerms } from "@/lib/types";
import { toast } from "sonner";

type SortKey = "consignee" | "dateOut" | "daysRemaining" | "retail";

const termsLabel: Record<ConsignmentPaymentTerms, string> = {
  immediate: "Immediate",
  net30: "Net 30",
  net60: "Net 60",
  custom: "Custom",
};

const termsDays: Record<ConsignmentPaymentTerms, number> = {
  immediate: 0,
  net30: 30,
  net60: 60,
  custom: 30,
};

export function ConsignmentsView() {
  const { tier } = useTier();
  const isPro = tier === "pro";
  const {
    artworks, consignments, contacts,
    updateArtwork, updateConsignment,
    addInvoice, addOpportunity,
  } = useStore();
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortKey>("daysRemaining");
  const [statementOpen, setStatementOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState<null | "statement" | "builder">(null);
  const { fullName } = useUserProfile();

  const rows = useMemo(() => {
    const active = consignments.filter(c => c.status === "active" || c.status === "sent");
    const joined = active.map(c => {
      const aw = artworks.find(a => a.id === c.artworkId);
      const contact = c.consigneeContactId
        ? contacts.find(ct => ct.id === c.consigneeContactId)
        : undefined;
      const expected = c.expectedReturn ?? c.endDate;
      return {
        c, aw, contact,
        days: expected ? daysUntil(expected) : null,
        retail: c.agreedPrice ?? aw?.price ?? 0,
      };
    });
    joined.sort((a, b) => {
      if (sort === "consignee") return (a.c.galleryName || "").localeCompare(b.c.galleryName || "");
      if (sort === "dateOut") return (b.c.dateOut ?? b.c.startDate ?? "").localeCompare(a.c.dateOut ?? a.c.startDate ?? "");
      if (sort === "retail") return b.retail - a.retail;
      return (a.days ?? 99999) - (b.days ?? 99999);
    });
    return joined;
  }, [consignments, artworks, contacts, sort]);

  const markReturned = (c: Consignment) => {
    updateConsignment(c.id, { status: "returned" });
    toast.success("Marked as returned");
  };

  const markSold = (c: Consignment) => {
    const aw = artworks.find(a => a.id === c.artworkId);
    if (!aw) return;
    const price = c.agreedPrice ?? aw.price;
    addInvoice({
      artworkId: aw.id,
      buyerName: c.galleryName,
      buyerEmail: c.contactEmail,
      amount: price,
      status: "sent",
      paymentTerms: c.paymentTerms ? termsLabel[c.paymentTerms] : "Net 30",
      dueAt: new Date(Date.now() + (c.paymentTerms ? termsDays[c.paymentTerms] : 30) * 86400000).toISOString(),
    });
    updateConsignment(c.id, { status: "sold" });
    updateArtwork(aw.id, { status: "sold" });
    addOpportunity({
      title: `Payment due — ${aw.title}`,
      organization: c.galleryName,
      deadline: new Date(Date.now() + (c.paymentTerms ? termsDays[c.paymentTerms] : 30) * 86400000).toISOString(),
      type: "delivery",
      status: "applying",
      notes: `Auto-created from consignment sale. Split: ${c.splitType === "flat" ? fmtMoney(c.splitValue ?? 0) : `${c.splitValue ?? c.commissionPct}%`}.`,
    });
    toast.success("Sale recorded · invoice created · payment reminder set");
    navigate("/sales");
  };

  const printStatement = (consigneeName: string) => {
    const items = rows.filter(r => r.c.galleryName === consigneeName);
    const total = items.reduce((s, r) => s + r.retail, 0);
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Consignment statement — ${consigneeName}</title>
<style>body{font-family:Georgia,serif;padding:60px;color:#1a1a1a;max-width:760px;margin:auto;background:#f5f3ee}
h1{font-weight:400;font-size:38px;margin:0;letter-spacing:-.01em}
.eyebrow{font-family:Helvetica,sans-serif;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#666}
hr{border:none;border-top:1px solid #ccc;margin:24px 0}
table{width:100%;border-collapse:collapse;margin-top:18px;font-family:Helvetica,sans-serif;font-size:13px}
td,th{padding:10px 0;text-align:left;border-bottom:1px solid #ddd;vertical-align:top}
.right{text-align:right}
.total{font-family:Georgia,serif;font-size:28px}
.muted{color:#666;font-size:11px}
</style></head><body>
<div class="eyebrow">Allegory Studio · Consignment statement</div>
${fullName ? `<div class="eyebrow" style="margin-top:4px">${fullName} · Artist</div>` : ""}
<h1>${consigneeName}</h1>
<div class="muted">Issued ${new Date().toLocaleDateString()}</div>
<hr/>
<table>
  <tr><th>Work</th><th>Details</th><th>Date out</th><th>Split</th><th class="right">Retail</th></tr>
  ${items.map(r => `<tr>
    <td><em>${r.aw?.title ?? "—"}</em><div class="muted">${r.aw?.year ?? ""}</div></td>
    <td>${r.aw?.medium ?? ""}${r.aw?.dimensions ? `<br/>${r.aw.dimensions}` : ""}</td>
    <td>${fmtDate(r.c.dateOut ?? r.c.startDate)}</td>
    <td>${r.c.splitType === "flat" ? fmtMoney(r.c.splitValue ?? 0) : `${r.c.splitValue ?? r.c.commissionPct}%`}</td>
    <td class="right">${fmtMoney(r.retail)}</td>
  </tr>`).join("")}
</table>
<div style="text-align:right;margin-top:24px"><div class="eyebrow">Total inventory value</div><div class="total">${fmtMoney(total)}</div></div>
<hr/>
<div class="muted" style="text-align:center">Prepared for internal review and reconciliation.</div>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const consignees = Array.from(new Set(rows.map(r => r.c.galleryName)));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Sort</span>
          <Select value={sort} onValueChange={(v: SortKey) => setSort(v)}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daysRemaining">Days remaining</SelectItem>
              <SelectItem value="consignee">Consignee</SelectItem>
              <SelectItem value="dateOut">Date out</SelectItem>
              <SelectItem value="retail">Retail value</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => isPro ? setStatementOpen(true) : setUpgradeOpen("statement")}
          >
            <FileText className="h-3.5 w-3.5" /> Statement
            {!isPro && <Badge variant="outline" className="text-[9px] border-primary/40 text-primary uppercase tracking-wider">Pro</Badge>}
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => isPro ? setBuilderOpen(true) : setUpgradeOpen("builder")}
          >
            <FileSignature className="h-3.5 w-3.5" /> Agreement Builder
            {!isPro && <Badge variant="outline" className="text-[9px] border-primary-foreground/40 text-primary-foreground uppercase tracking-wider">Pro</Badge>}
          </Button>
        </div>
      </div>

      <div className="hairline-card overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground italic">No active consignments. Mark a work as “On consignment” to begin.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border">
                {["Work", "Consignee", "Date out", "Expected return", "Days", "Split", "Retail", "Status", ""].map((h, i) => (
                  <th key={i} className="eyebrow px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ c, aw, days }) => {
                const expected = c.expectedReturn ?? c.endDate;
                return (
                  <tr key={c.id} className="hover:bg-surface/50 group">
                    <td className="px-4 py-3 font-display italic">{aw?.title ?? "—"} <span className="text-xs not-italic text-muted-foreground">· {aw?.year}</span></td>
                    <td className="px-4 py-3">{c.galleryName}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{fmtDate(c.dateOut ?? c.startDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{expected ? fmtDate(expected) : "—"}</td>
                    <td className={`px-4 py-3 tabular-nums text-xs ${days !== null && days < 14 ? "text-destructive" : "text-muted-foreground"}`}>
                      {days === null ? "—" : `${days}d`}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {c.splitType === "flat" ? fmtMoney(c.splitValue ?? 0) : `${c.splitValue ?? c.commissionPct}%`}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-right">{fmtMoney(c.agreedPrice ?? aw?.price ?? 0)}</td>
                    <td className="px-4 py-3"><StatusPill status="active" /></td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => markSold(c)}>
                        Mark sold <ArrowRight className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => markReturned(c)}>
                        Return
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pro: Statement picker */}
      <Dialog open={statementOpen} onOpenChange={setStatementOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-2xl font-normal">Generate consignment statement</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mb-3">Choose a consignee to generate a formatted PDF of everything they currently hold.</p>
          <div className="space-y-2">
            {consignees.length === 0 && <p className="text-sm italic text-muted-foreground">No active consignees.</p>}
            {consignees.map(name => (
              <button
                key={name}
                onClick={() => { printStatement(name); setStatementOpen(false); }}
                className="w-full text-left px-4 py-3 hairline-card hover:bg-surface transition-colors"
              >
                <div className="font-medium text-sm">{name}</div>
                <div className="text-xs text-muted-foreground">{rows.filter(r => r.c.galleryName === name).length} works</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pro: Agreement builder */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <AgreementBuilder onClose={() => setBuilderOpen(false)} />
      </Dialog>

      {/* Upgrade dialogs (Starter) */}
      <Dialog open={!!upgradeOpen} onOpenChange={(v) => !v && setUpgradeOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-2xl font-normal">
            {upgradeOpen === "statement" ? "Consignment statements" : "Agreement Builder"}
          </DialogTitle></DialogHeader>
          <UpgradeCard
            description={upgradeOpen === "statement"
              ? "Generate professional consignment statements in seconds, with everything pulled straight from your inventory and contacts."
              : "Create a polished consignment agreement in seconds — parties, artworks, terms, all formatted and ready to send for signature."}
            compact
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AgreementBuilder({ onClose }: { onClose: () => void }) {
  const { artworks, contacts, consignments, updateConsignment, addConsignment, updateArtwork } = useStore();
  const { fullName } = useUserProfile();
  const [consignee, setConsignee] = useState("");
  const [consigneeContactId, setConsigneeContactId] = useState<string>("");
  const [selected, setSelected] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<"percent" | "flat">("percent");
  const [splitValue, setSplitValue] = useState<number>(50);
  const [paymentTerms, setPaymentTerms] = useState<ConsignmentPaymentTerms>("net30");
  const [dateOut, setDateOut] = useState(new Date().toISOString().slice(0, 10));
  const [expectedReturn, setExpectedReturn] = useState(new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const toggle = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const eligible = artworks.filter(a => a.status === "in_studio" || a.status === "on_consignment");

  const generate = () => {
    if (!consignee.trim() || selected.length === 0) {
      toast.error("Add a consignee and select at least one work");
      return;
    }
    const works = artworks.filter(a => selected.includes(a.id));
    const total = works.reduce((s, a) => s + a.price, 0);
    const splitLine = splitType === "flat" ? `${"$"}${splitValue} flat per work` : `${splitValue}% to artist / ${100 - splitValue}% to consignee`;
    const html = `<!doctype html><html><head><title>Consignment Agreement</title>
<style>body{font-family:Georgia,serif;padding:64px;max-width:760px;margin:auto;color:#1a1a1a;background:#f5f3ee;line-height:1.55}
h1{font-weight:400;font-size:34px;margin:0 0 4px;letter-spacing:-.01em}
.eyebrow{font-family:Helvetica,sans-serif;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#666}
hr{border:none;border-top:1px solid #ccc;margin:22px 0}
h2{font-family:Helvetica,sans-serif;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#444;margin:22px 0 8px}
table{width:100%;border-collapse:collapse;margin-top:6px;font-family:Helvetica,sans-serif;font-size:13px}
td,th{padding:8px 0;text-align:left;border-bottom:1px solid #ddd;vertical-align:top}
.right{text-align:right}
p{margin:6px 0}
.muted{color:#666;font-size:11px}
.sig{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:48px}
.sig div{border-top:1px solid #999;padding-top:6px}
</style></head><body>
<div class="eyebrow">Consignment Agreement</div>
<h1>${fullName || "Artist"} &amp; ${consignee}</h1>
<div class="muted">Effective ${new Date(dateOut).toLocaleDateString()}</div>
<hr/>

<h2>Parties</h2>
<p><strong>Artist:</strong> ${fullName || "—"}</p>
<p><strong>Consignee:</strong> ${consignee}</p>

<h2>Works consigned</h2>
<table>
  <tr><th>Title</th><th>Year</th><th>Medium · Dimensions</th><th class="right">Agreed retail</th></tr>
  ${works.map(a => `<tr><td><em>${a.title}</em></td><td>${a.year}</td><td>${a.medium} · ${a.dimensions}</td><td class="right">${fmtMoney(a.price)}</td></tr>`).join("")}
</table>
<p class="muted" style="margin-top:8px">Total agreed retail value: <strong>${fmtMoney(total)}</strong></p>

<h2>Term</h2>
<p>This agreement is effective ${new Date(dateOut).toLocaleDateString()} and continues through ${new Date(expectedReturn).toLocaleDateString()}, unless extended in writing by both parties.</p>

<h2>Split &amp; payment</h2>
<p>Proceeds from sale of any consigned work shall be divided as follows: <strong>${splitLine}</strong>.</p>
<p>Payment to the artist is due <strong>${termsLabel[paymentTerms]}</strong> following receipt of payment by the consignee.</p>

<h2>Return conditions</h2>
<p>Unsold works shall be returned to the artist in their original condition by the end of the term. The consignee is responsible for safe handling, storage, and transit during the term.</p>

<h2>Insurance</h2>
<p>The consignee shall insure all consigned works against loss, theft, and damage at the agreed retail value, for the duration of the term.</p>

<h2>Exhibition &amp; reproduction</h2>
<p>The consignee may exhibit consigned works at its primary location. Reproduction for promotional purposes is permitted with credit to the artist; any other reproduction requires the artist’s written consent.</p>

${notes ? `<h2>Additional notes</h2><p>${notes}</p>` : ""}

<div class="sig">
  <div><span class="muted">Artist signature</span></div>
  <div><span class="muted">Consignee signature</span></div>
</div>

<hr/>
<p class="muted" style="text-align:center">This document is a starting point. We recommend reviewing with a qualified advisor before signing.</p>
</body></html>`;

    // Open print window
    const w = window.open("", "_blank", "width=900,height=1100");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }

    // Persist a consignment record per work + attach generated HTML
    works.forEach(a => {
      const existing = consignments.find(c => c.artworkId === a.id && (c.status === "active" || c.status === "sent"));
      const patch = {
        galleryName: consignee,
        consigneeContactId: consigneeContactId || undefined,
        dateOut: new Date(dateOut).toISOString(),
        expectedReturn: new Date(expectedReturn).toISOString(),
        splitType,
        splitValue,
        agreedPrice: a.price,
        paymentTerms,
        notes,
        generatedAgreementHtml: html,
        generatedAgreementAt: new Date().toISOString(),
        status: "active" as const,
      };
      if (existing) {
        updateConsignment(existing.id, patch);
      } else {
        addConsignment({
          artworkId: a.id,
          galleryName: consignee,
          commissionPct: splitType === "percent" ? splitValue : 0,
          startDate: new Date(dateOut).toISOString(),
          endDate: new Date(expectedReturn).toISOString(),
          status: "active",
          ...patch,
        });
        updateArtwork(a.id, { status: "on_consignment", location: consignee });
      }
    });
    toast.success("Agreement generated and saved");
    onClose();
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl font-normal">Agreement Builder</DialogTitle>
      </DialogHeader>
      <div className="grid gap-5 mt-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Consignee from contacts</Label>
            <Select value={consigneeContactId} onValueChange={(v) => {
              setConsigneeContactId(v);
              const c = contacts.find(x => x.id === v);
              if (c) setConsignee(c.name);
            }}>
              <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
              <SelectContent>
                {contacts.filter(c => c.type === "gallery" || c.type === "consultant" || c.type === "collector").map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Or type a name</Label>
            <Input value={consignee} onChange={e => setConsignee(e.target.value)} placeholder="Gallery, dealer, or individual" />
          </div>
        </div>

        <div>
          <Label>Works to include</Label>
          <div className="hairline-card divide-y divide-border max-h-56 overflow-y-auto mt-1">
            {eligible.length === 0 && <div className="p-4 text-sm text-muted-foreground italic">No eligible works.</div>}
            {eligible.map(a => (
              <label key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer hover:bg-surface/50">
                <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggle(a.id)} />
                <span className="font-display italic flex-1">{a.title}</span>
                <span className="text-xs text-muted-foreground">{a.year} · {a.medium}</span>
                <span className="text-xs tabular-nums">{fmtMoney(a.price)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Split type</Label>
            <Select value={splitType} onValueChange={(v: "percent" | "flat") => setSplitType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentage</SelectItem>
                <SelectItem value="flat">Flat amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{splitType === "percent" ? "Artist %" : "Flat amount (USD)"}</Label>
            <Input type="number" value={splitValue} onChange={e => setSplitValue(+e.target.value)} />
          </div>
          <div>
            <Label>Date out</Label>
            <Input type="date" value={dateOut} onChange={e => setDateOut(e.target.value)} />
          </div>
          <div>
            <Label>Expected return</Label>
            <Input type="date" value={expectedReturn} onChange={e => setExpectedReturn(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Payment terms</Label>
            <Select value={paymentTerms} onValueChange={(v: ConsignmentPaymentTerms) => setPaymentTerms(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="net30">Net 30</SelectItem>
                <SelectItem value="net60">Net 60</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Additional notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Exhibition rights, special handling, anything else worth recording." />
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground italic border-l-2 border-border pl-3">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.5} />
          This document is a starting point. We recommend reviewing with a qualified advisor before signing.
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={generate} className="gap-2"><FileSignature className="h-3.5 w-3.5" /> Generate &amp; save</Button>
        </div>
      </div>
    </DialogContent>
  );
}
