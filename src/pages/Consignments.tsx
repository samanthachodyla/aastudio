import { useState } from "react";
import { Plus, FileText, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore, fmtDate, fmtMoney, daysSince } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/StatusPill";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ConsignmentStatus } from "@/lib/types";

const Consignments = () => {
  const { consignments, artworks, addConsignment, updateConsignment, deleteConsignment } = useStore();
  const [open, setOpen] = useState(false);

  const exportAgreement = (id: string) => {
    const c = consignments.find(x => x.id === id); if (!c) return;
    const aw = artworks.find(a => a.id === c.artworkId);
    const w = window.open("", "_blank", "width=800,height=1000"); if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Consignment Agreement</title>
<style>body{font-family:Georgia,serif;padding:60px;color:#1a1a1a;max-width:680px;margin:auto;line-height:1.6;background:#f5f3ee}
h1{font-weight:400;font-size:36px;letter-spacing:-.01em}.eyebrow{font-family:Helvetica,sans-serif;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#666}
hr{border:none;border-top:1px solid #ccc;margin:24px 0}.sig{margin-top:60px;display:flex;justify-content:space-between;font-family:Helvetica,sans-serif;font-size:12px}
.sig div{width:45%;border-top:1px solid #1a1a1a;padding-top:8px}</style></head><body>
<div class="eyebrow">Allegory Studio</div><h1>Consignment Agreement</h1><hr/>
<p>This agreement, entered into on <strong>${fmtDate(c.startDate)}</strong>, is between the Artist and <strong>${c.galleryName}</strong> (the "Gallery").</p>
<p><strong>Work consigned:</strong> <em>${aw?.title}</em> (${aw?.year}), ${aw?.medium}, ${aw?.dimensions}.<br/>
<strong>Retail price:</strong> ${fmtMoney(aw?.price ?? 0)}<br/>
<strong>Gallery commission:</strong> ${c.commissionPct}%<br/>
<strong>Term:</strong> ${fmtDate(c.startDate)} through ${fmtDate(c.endDate)}.</p>
<p>The Gallery agrees to exhibit the work in good faith, to insure it for its full retail value while in its possession, and to remit payment within 30 days of any sale.</p>
<p>Upon expiration of the term, the Gallery shall return the work to the Artist at the Gallery's expense, unless renewed in writing.</p>
<div class="sig"><div>Artist signature</div><div>Gallery signature</div></div></body></html>`);
    w.document.close(); setTimeout(() => w.print(), 300);
  };

  return (
    <AppShell
      eyebrow="Module · Consignments"
      title="Paper trails, on purpose."
      description="Agreements drawn from inventory, signed and tracked. No more handshake consignments quietly disappearing for years."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" /> New agreement</Button></DialogTrigger>
          <ConsignmentForm artworks={artworks} onSubmit={(d) => { addConsignment(d); setOpen(false); }} />
        </Dialog>
      }
    >
      <div className="grid gap-px bg-border border border-border">
        {consignments.length === 0 && (
          <div className="bg-background p-12 text-center text-muted-foreground italic">No active consignments.</div>
        )}
        {consignments.map(c => {
          const aw = artworks.find(a => a.id === c.artworkId);
          const days = daysSince(c.startDate);
          const stale = c.status === "active" && days >= 90;
          return (
            <article key={c.id} className="bg-background p-6 grid md:grid-cols-[1fr_auto] gap-6 group">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <StatusPill status={c.status} />
                  {stale && <span className="text-[10px] uppercase tracking-wider text-warning">{days} days · review</span>}
                </div>
                <h3 className="font-display text-2xl mb-1">
                  <span className="italic">{aw?.title ?? "—"}</span>
                  <span className="text-muted-foreground text-base ml-3">at {c.galleryName}</span>
                </h3>
                <div className="text-sm text-muted-foreground">
                  {aw?.medium} · {aw?.dimensions} · {fmtMoney(aw?.price ?? 0)}
                </div>
                <div className="grid grid-cols-3 gap-6 mt-5 text-sm">
                  <div><div className="eyebrow mb-1">Term</div><div>{fmtDate(c.startDate)} → {fmtDate(c.endDate)}</div></div>
                  <div><div className="eyebrow mb-1">Commission</div><div className="tabular-nums">{c.commissionPct}%</div></div>
                  <div><div className="eyebrow mb-1">Contact</div><div>{c.contactName ?? "—"}</div></div>
                </div>
              </div>
              <div className="flex md:flex-col gap-2 md:items-end justify-end">
                <Select value={c.status} onValueChange={(v: ConsignmentStatus) => updateConsignment(c.id, { status: v })}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["draft", "sent", "active", "expired", "returned", "sold"] as ConsignmentStatus[]).map(s => (
                      <SelectItem key={s} value={s}><StatusPill status={s} /></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => exportAgreement(c.id)} className="gap-2">
                  <FileText className="h-3.5 w-3.5" /> PDF
                </Button>
                <button onClick={() => deleteConsignment(c.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity self-end p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
};

function ConsignmentForm({ artworks, onSubmit }: { artworks: any[]; onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({
    artworkId: artworks[0]?.id ?? "", galleryName: "", contactName: "", contactEmail: "",
    commissionPct: 50,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
    status: "draft" as ConsignmentStatus,
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle className="font-display text-2xl font-normal">New consignment</DialogTitle></DialogHeader>
      <form className="grid gap-4 mt-2" onSubmit={(e) => { e.preventDefault(); onSubmit({
        ...form, commissionPct: Number(form.commissionPct),
        startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString(),
      }); }}>
        <div>
          <Label>Work</Label>
          <Select value={form.artworkId} onValueChange={(v) => setForm({ ...form, artworkId: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{artworks.map(a => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Gallery</Label><Input required value={form.galleryName} onChange={(e) => setForm({ ...form, galleryName: e.target.value })} /></div>
          <div><Label>Commission %</Label><Input type="number" value={form.commissionPct} onChange={(e) => setForm({ ...form, commissionPct: +e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Contact name</Label><Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
          <div><Label>Contact email</Label><Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Start</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
          <div><Label>End</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
        </div>
        <div className="flex justify-end"><Button type="submit">Create agreement</Button></div>
      </form>
    </DialogContent>
  );
}

export default Consignments;
