import { useState, useMemo, useRef } from "react";
import { Plus, Search, Download, Trash2, Upload, X, ImageIcon, Boxes, Handshake } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore, fmtMoney } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/StatusPill";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConsignmentsView } from "@/components/ConsignmentsView";
import type { ArtworkStatus } from "@/lib/types";

const exportableStatuses: { value: ArtworkStatus; label: string }[] = [
  { value: "in_studio", label: "In studio" },
  { value: "on_consignment", label: "On consignment" },
  { value: "sold", label: "Sold" },
  { value: "loaned", label: "Loaned" },
  { value: "nfs", label: "NFS" },
];

const statuses: { value: ArtworkStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_studio", label: "In studio" },
  { value: "on_consignment", label: "On consignment" },
  { value: "sold", label: "Sold" },
  { value: "loaned", label: "Loaned" },
  { value: "nfs", label: "NFS" },
];

const Inventory = () => {
  const { artworks, addArtwork, deleteArtwork } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<ArtworkStatus | "all">("all");
  const [open, setOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportStatuses, setExportStatuses] = useState<ArtworkStatus[]>(
    exportableStatuses.map(s => s.value)
  );

  const toggleExportStatus = (s: ArtworkStatus) => {
    setExportStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const filtered = useMemo(() => {
    return artworks.filter(a => {
      if (filter !== "all" && a.status !== filter) return false;
      if (q && !`${a.title} ${a.medium} ${a.year}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [artworks, q, filter]);

  const exportCSV = () => {
    const selected = new Set(exportStatuses);
    const data = artworks.filter(a => selected.has(a.status));
    const header = ["Title", "Year", "Medium", "Dimensions", "Edition", "Price", "Status", "Location"];
    const rows = data.map(a => [a.title, a.year, a.medium, a.dimensions, a.edition ?? "", a.price, a.status, a.location ?? ""]);
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "allegory-inventory.csv"; a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  return (
    <AppShell
      eyebrow="Module · Inventory"
      title="The catalogue."
      description="Every work, every state, every location. Your single source of truth for what exists in the studio and what's out in the world."
      actions={
        <>
          <Dialog open={exportOpen} onOpenChange={setExportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Export inventory CSV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select which status categories to include in the export.
                </p>
                <div className="space-y-2">
                  {exportableStatuses.map(s => (
                    <label key={s.value} className="flex items-center gap-3 text-sm cursor-pointer">
                      <Checkbox
                        checked={exportStatuses.includes(s.value)}
                        onCheckedChange={() => toggleExportStatus(s.value)}
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setExportStatuses(exportableStatuses.map(s => s.value))}
                    className="text-muted-foreground hover:text-foreground uppercase tracking-wider"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportStatuses([])}
                    className="text-muted-foreground hover:text-foreground uppercase tracking-wider"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setExportOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={exportCSV} disabled={exportStatuses.length === 0} className="gap-2">
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" /> New work</Button>
            </DialogTrigger>
            <ArtworkForm onSubmit={(data) => { addArtwork(data); setOpen(false); }} />

          </Dialog>
        </>
      }
    >
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 mb-6">
          <TabsTrigger value="inventory" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm gap-2">
            <Boxes className="h-3.5 w-3.5" /> Inventory
          </TabsTrigger>
          <TabsTrigger value="consignments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm gap-2">
            <Handshake className="h-3.5 w-3.5" /> Consignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="m-0">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-6">
            <div className="relative w-full sm:flex-1 sm:min-w-[220px] sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, medium, year…" className="pl-9 bg-card" />
            </div>
            <div className="flex items-center gap-1 text-xs overflow-x-auto no-scrollbar -mx-1 px-1">
              {statuses.map(s => (
                <button
                  key={s.value}
                  onClick={() => setFilter(s.value)}
                  className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-sm uppercase tracking-wider transition-colors ${
                    filter === s.value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground sm:ml-auto">{filtered.length} works</span>
          </div>

          {/* Desktop: full table */}
          <div className="hairline-card overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  {["", "Title", "Medium", "Year", "Dimensions", "Status", "Location", "Price", ""].map((h, i) => (
                    <th key={i} className="eyebrow px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground italic">No works match.</td></tr>
                )}
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-surface/50 transition-colors group">
                    <td className="px-4 py-3 w-16">
                      {a.imageUrl ? (
                        <img src={a.imageUrl} alt={a.title} className="h-12 w-12 object-cover rounded-sm border border-border" />
                      ) : (
                        <div className="h-12 w-12 flex items-center justify-center rounded-sm border border-border bg-surface text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 font-display italic text-base">{a.title}</td>
                    <td className="px-4 py-4 text-muted-foreground">{a.medium}</td>
                    <td className="px-4 py-4 tabular-nums text-muted-foreground">{a.year}</td>
                    <td className="px-4 py-4 text-muted-foreground">{a.dimensions}</td>
                    <td className="px-4 py-4"><StatusPill status={a.status} /></td>
                    <td className="px-4 py-4 text-muted-foreground">{a.location ?? "—"}</td>
                    <td className="px-4 py-4 tabular-nums text-right">{fmtMoney(a.price)}</td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => deleteArtwork(a.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: readable cards */}
          <div className="md:hidden grid gap-3">
            {filtered.length === 0 && (
              <div className="hairline-card p-10 text-center text-muted-foreground italic text-sm">No works match.</div>
            )}
            {filtered.map(a => (
              <div key={a.id} className="hairline-card p-4 flex gap-3">
                {a.imageUrl ? (
                  <img src={a.imageUrl} alt={a.title} className="h-16 w-16 shrink-0 object-cover rounded-sm border border-border" />
                ) : (
                  <div className="h-16 w-16 shrink-0 flex items-center justify-center rounded-sm border border-border bg-surface text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-display italic text-base leading-tight">{a.title}</span>
                    <button
                      onClick={() => deleteArtwork(a.id)}
                      aria-label="Delete work"
                      className="shrink-0 -mr-1 -mt-1 p-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {[a.medium, a.year, a.dimensions].filter(Boolean).join(" · ")}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2.5">
                    <StatusPill status={a.status} />
                    <span className="tabular-nums text-sm">{fmtMoney(a.price)}</span>
                  </div>
                  {a.location && (
                    <div className="text-[11px] text-muted-foreground mt-1.5">{a.location}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="consignments" className="m-0">
          <ConsignmentsView />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};


const BUILT_IN_STATUSES: { value: string; label: string }[] = [
  { value: "in_studio", label: "In studio" },
  { value: "on_consignment", label: "On consignment" },
  { value: "sold", label: "Sold" },
  { value: "loaned", label: "Loaned" },
  { value: "nfs", label: "NFS" },
];

const ADD_NEW_STATUS = "__add_new_status__";

function ArtworkForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const customStatuses = useStore(s => s.customStatuses);
  const addCustomStatus = useStore(s => s.addCustomStatus);
  const [form, setForm] = useState({
    title: "", year: new Date().getFullYear(), medium: "", dimensions: "",
    edition: "", price: 0, status: "in_studio" as ArtworkStatus, location: "",
    imageUrl: "" as string,
  });
  const [addingStatus, setAddingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, imageUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const confirmNewStatus = () => {
    const v = newStatus.trim();
    if (!v) return;
    addCustomStatus(v);
    setForm(f => ({ ...f, status: v }));
    setNewStatus("");
    setAddingStatus(false);
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle className="font-display text-2xl font-normal">New work</DialogTitle></DialogHeader>
      <form
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2"
        onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, price: Number(form.price), year: Number(form.year), imageUrl: form.imageUrl || undefined }); }}
      >
        <div className="col-span-2">
          <Label>Image</Label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {form.imageUrl ? (
            <div className="relative mt-1 group">
              <img src={form.imageUrl} alt="Preview" className="w-full h-48 object-cover rounded-sm border border-border" />
              <button
                type="button"
                onClick={() => setForm({ ...form, imageUrl: "" })}
                className="absolute top-2 right-2 bg-background/90 border border-border rounded-sm p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-1 w-full h-32 border border-dashed border-border rounded-sm flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs uppercase tracking-wider">Upload image</span>
              <span className="text-[10px] text-muted-foreground">PNG, JPG up to 5MB</span>
            </button>
          )}
        </div>
        <div className="col-span-2"><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Year</Label><Input type="number" required value={form.year} onChange={(e) => setForm({ ...form, year: +e.target.value })} /></div>
        <div><Label>Price (USD)</Label><Input type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>
        <div className="col-span-2"><Label>Medium</Label><Input required value={form.medium} onChange={(e) => setForm({ ...form, medium: e.target.value })} /></div>
        <div><Label>Dimensions</Label><Input required value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} placeholder="e.g. 24 × 30 in" /></div>
        <div><Label>Edition</Label><Input value={form.edition} onChange={(e) => setForm({ ...form, edition: e.target.value })} placeholder="e.g. 1/5" /></div>
        <div>
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => {
              if (v === ADD_NEW_STATUS) {
                setAddingStatus(true);
                return;
              }
              setForm({ ...form, status: v });
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BUILT_IN_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
              {customStatuses.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
              <SelectItem value={ADD_NEW_STATUS}>＋ Add new status…</SelectItem>
            </SelectContent>
          </Select>
          {addingStatus && (
            <div className="mt-2 flex items-center gap-2">
              <Input
                autoFocus
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); confirmNewStatus(); }
                  if (e.key === "Escape") { setAddingStatus(false); setNewStatus(""); }
                }}
                placeholder="Status name"
                className="h-8 text-sm"
              />
              <Button type="button" size="sm" onClick={confirmNewStatus}>Add</Button>
            </div>
          )}
        </div>
        <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div className="col-span-2 flex justify-end gap-2 mt-2">
          <Button type="submit">Add to catalogue</Button>
        </div>
      </form>
    </DialogContent>
  );
}

export default Inventory;
