import { useMemo, useRef, useState } from "react";
import { Plus, Upload, Download, Trash2, FileText, Pencil, Wand2, Loader2, Copy, Save, Sparkles, Newspaper, ExternalLink, Eye } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore, fmtDate } from "@/lib/store";
import { useTier } from "@/lib/tier";
import { UpgradeCard } from "@/components/UpgradeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { VaultDoc, VaultDocKind, PressItem } from "@/lib/types";
import { toast } from "sonner";

type TextKind = "statement" | "bio" | "cv";

const KIND_LABEL: Record<TextKind, string> = {
  statement: "Artist statement",
  bio: "Bio",
  cv: "CV / Résumé",
};

const KIND_EMPTY: Record<TextKind, string> = {
  statement: "No statements yet. Save versions for grants, exhibitions, or general use.",
  bio: "No bios yet. Keep short and long versions ready for any application.",
  cv: "No CVs yet. Upload a PDF or build one inline.",
};

const ProfileVault = () => {
  const { vaultDocs, vaultOnboarded, markVaultOnboarded, pressItems } = useStore();
  const { tier } = useTier();
  const isPro = tier === "pro";
  const [tab, setTab] = useState<TextKind | "press">("statement");

  const showOnboarding = !vaultOnboarded && vaultDocs.length === 0;

  const currentCount = (k: TextKind) => vaultDocs.filter(d => d.kind === k).length;
  const liteCap = (k: TextKind) => 1;
  const canAdd = (k: TextKind) => isPro || currentCount(k) < liteCap(k);

  const filtered = useMemo(
    () => tab === "press"
      ? []
      : vaultDocs.filter(d => d.kind === tab).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [vaultDocs, tab]
  );

  return (
    <AppShell
      eyebrow={`Profile Vault${isPro ? "" : " · Lite"}`}
      title="The materials you reach for, always current."
      description="Statements, bios, and CVs — versioned, labelled, export-ready. One source of truth across every application."
      actions={tab !== "press" && canAdd(tab as TextKind) ? <NewDocButton kind={tab as TextKind} /> : undefined}
    >
      {showOnboarding && <OnboardingPanel onDone={markVaultOnboarded} />}

      <Tabs value={tab} onValueChange={(v) => setTab(v as TextKind | "press")} className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 mb-8 overflow-x-auto no-scrollbar flex-nowrap">
          {(["statement", "bio", "cv"] as TextKind[]).map(k => (
            <TabsTrigger
              key={k}
              value={k}
              className="shrink-0 whitespace-nowrap rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm"
            >
              {KIND_LABEL[k]}
              <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                {vaultDocs.filter(d => d.kind === k).length}
              </span>
            </TabsTrigger>
          ))}
          <TabsTrigger
            value="press"
            className="shrink-0 whitespace-nowrap rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm gap-2"
          >
            Press &amp; Publications
            {!isPro && <Badge variant="outline" className="text-[9px] tracking-wider uppercase border-primary/40 text-primary">Pro</Badge>}
            {isPro && <span className="ml-1 text-xs text-muted-foreground tabular-nums">{pressItems.length}</span>}
          </TabsTrigger>
        </TabsList>

        {(["statement", "bio", "cv"] as TextKind[]).map(k => (
          <TabsContent key={k} value={k} className="m-0 space-y-5">
            {!canAdd(k) && (
              <UpgradeCard
                title={k === "bio" ? "Bio variants live in Pro" : k === "statement" ? "Statement library lives in Pro" : "Full CV builder lives in Pro"}
                description={
                  k === "bio"
                    ? "You have one bio on Starter. Upgrade to Pro to build a library of bio variants tailored to galleries, grants, press, and social — so you’re never scrambling for the right words again."
                    : k === "statement"
                    ? "Your statement library lives in Pro. Adapt your voice to any opportunity — residencies, grants, gallery submissions, commissions."
                    : "Pro unlocks a full CV builder with formatted PDF and Word export, plus unlimited revisions."
                }
                compact
              />
            )}
            {filtered.length === 0 ? (
              <EmptyState kind={k} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(d => <DocCard key={d.id} doc={d} isPro={isPro} />)}
              </div>
            )}
          </TabsContent>
        ))}

        <TabsContent value="press" className="m-0">
          {isPro ? <PressLog items={pressItems} /> : (
            <UpgradeCard
              title="Press &amp; Publications log"
              description="Pro keeps a running log of every mention, review, and feature — date, outlet, link, and excerpt — so the next press kit writes itself."
            />
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

function OnboardingPanel({ onDone }: { onDone: () => void }) {
  const { addVaultDoc } = useStore();
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [done, setDone] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") { toast.error("PDF files only for now"); return; }
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Naive parse: store as CV by default; users can edit fields after.
      addVaultDoc({
        kind: "cv",
        title: f.name.replace(/\.pdf$/i, "") || "CV",
        fileName: f.name,
        fileData: dataUrl,
        notes: "Imported during onboarding",
      });
      setBusy(false);
      setDone(true);
      toast.success("Profile organized");
    };
    reader.readAsDataURL(f);
  };

  return (
    <div className="hairline-card p-6 md:p-8 mb-8 bg-primary/5 border-primary/20">
      <div className="flex items-start gap-4">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 shrink-0">
          <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="eyebrow mb-1.5 text-primary">Welcome to Profile Vault</div>
          {done ? (
            <>
              <h3 className="font-display text-2xl mb-2">Here’s your professional profile, organized and ready to use.</h3>
              <p className="text-sm text-muted-foreground mb-4">Edit any section to refine — or add a bio and statement next.</p>
              <Button size="sm" onClick={onDone}>Got it</Button>
            </>
          ) : (
            <>
              <h3 className="font-display text-2xl mb-2">Upload your CV, bio, or statement</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We’ll organize it into a clean, structured profile you can reach for any time — no re-typing, no scrambling.
              </p>
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={onFile} />
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" disabled={busy} onClick={() => fileRef.current?.click()} className="gap-2">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {busy ? "Organizing…" : "Upload PDF"}
                </Button>
                <Button size="sm" variant="ghost" onClick={onDone}>Skip for now</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PressLog({ items }: { items: PressItem[] }) {
  const { addPressItem, deletePressItem } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", outlet: "", date: new Date().toISOString().slice(0, 10), link: "", excerpt: "" });

  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.outlet.trim()) { toast.error("Title and outlet required"); return; }
    addPressItem({ ...form, title: form.title.trim(), outlet: form.outlet.trim(), date: new Date(form.date).toISOString() });
    setForm({ title: "", outlet: "", date: new Date().toISOString().slice(0, 10), link: "", excerpt: "" });
    setOpen(false);
    toast.success("Logged");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-muted-foreground">Every mention, review, and feature — kept close at hand.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" /> Log press</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-display text-2xl font-normal">Log a press mention</DialogTitle></DialogHeader>
            <form className="grid gap-4 mt-2" onSubmit={submit}>
              <div><Label>Headline / title</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Outlet</Label><Input required value={form.outlet} onChange={e => setForm({ ...form, outlet: e.target.value })} /></div>
                <div><Label>Date</Label><Input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              </div>
              <div><Label>Link <span className="text-muted-foreground font-normal">(optional)</span></Label><Input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://…" /></div>
              <div><Label>Excerpt <span className="text-muted-foreground font-normal">(optional)</span></Label><Textarea rows={3} value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} /></div>
              <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {sorted.length === 0 ? (
        <div className="hairline-card p-12 text-center">
          <Newspaper className="h-8 w-8 mx-auto text-muted-foreground mb-4" strokeWidth={1.2} />
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">Nothing logged yet. Add your first feature, review, or mention.</p>
        </div>
      ) : (
        <div className="hairline-card divide-y divide-border">
          {sorted.map(p => (
            <div key={p.id} className="p-5 flex items-start gap-4 group">
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg leading-tight">{p.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.outlet} · {fmtDate(p.date)}</div>
                {p.excerpt && <p className="text-sm text-foreground/80 mt-2 line-clamp-2">{p.excerpt}</p>}
                {p.link && (
                  <a href={p.link} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-2 hover:underline">
                    Visit <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <button onClick={() => deletePressItem(p.id)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1.5">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ kind }: { kind: TextKind }) {
  return (
    <div className="hairline-card p-12 text-center">
      <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-4" strokeWidth={1.2} />
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">{KIND_EMPTY[kind]}</p>
      <NewDocButton kind={kind} />
    </div>
  );
}

function DocCard({ doc, isPro = true }: { doc: VaultDoc; isPro?: boolean }) {
  const { deleteVaultDoc } = useStore();
  const [editOpen, setEditOpen] = useState(false);
  const [tailorOpen, setTailorOpen] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);

  const exportDoc = () => {
    if (doc.fileData && doc.fileName) {
      const a = document.createElement("a");
      a.href = doc.fileData;
      a.download = doc.fileName;
      a.click();
      return;
    }
    if (doc.body) {
      const blob = new Blob([doc.body], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.title.replace(/[^\w-]+/g, "_")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    toast.message("Nothing to export");
  };

  // Open an uploaded PDF in a new tab for a quick read. Data URLs are converted
  // to a blob URL first, which browsers reliably display in their PDF viewer.
  const previewDoc = async () => {
    if (!doc.fileData) return;
    try {
      const res = await fetch(doc.fileData);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      window.open(doc.fileData, "_blank", "noopener");
    }
  };

  // The AI "tailor" tool works on the document's TEXT. An uploaded PDF has a file
  // but no text body yet, so guide the user to paste it in rather than dead-ending
  // on a greyed-out button.
  const handleTailor = () => {
    if (!isPro) { setUpsellOpen(true); return; }
    if (doc.body) { setTailorOpen(true); return; }
    toast.message("Add the text first", {
      description: "Paste this document's text so the AI can tailor it — the file upload keeps the PDF, but the AI needs the words.",
    });
    setEditOpen(true);
  };

  return (
    <div className="hairline-card p-5 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="font-display text-lg leading-tight truncate">{doc.title}</div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">
            Updated {fmtDate(doc.updatedAt)}
            {doc.fileName && <span className="ml-2 normal-case tracking-normal">· {doc.fileName}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleTailor}
            className="p-1.5 hover:bg-surface rounded-sm"
            title={isPro ? (doc.body ? "Tailor for opportunity" : "Add the text, then tailor with AI") : "Tailored statements are a Pro feature"}
          >
            <Wand2 className="h-3.5 w-3.5" />
          </button>
          {doc.fileData && (
            <button onClick={previewDoc} className="p-1.5 hover:bg-surface rounded-sm" title="Preview PDF">
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => setEditOpen(true)} className="p-1.5 hover:bg-surface rounded-sm" title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={exportDoc} className="p-1.5 hover:bg-surface rounded-sm" title="Export">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => { deleteVaultDoc(doc.id); toast.success("Deleted"); }} className="p-1.5 hover:bg-surface rounded-sm text-muted-foreground hover:text-destructive" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {doc.body && (
        <p className="text-sm leading-relaxed text-foreground/80 line-clamp-4 whitespace-pre-wrap mb-3">
          {doc.body}
        </p>
      )}

      {doc.notes && (
        <div className="text-[11px] italic text-muted-foreground border-l-2 border-border pl-2 mt-3">
          {doc.notes}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DocForm
          kind={doc.kind}
          initial={doc}
          onClose={() => setEditOpen(false)}
        />
      </Dialog>

      <Dialog open={tailorOpen} onOpenChange={setTailorOpen}>
        {tailorOpen && <TailorDialog doc={doc} onClose={() => setTailorOpen(false)} />}
      </Dialog>

      <Dialog open={upsellOpen} onOpenChange={setUpsellOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-2xl font-normal">Tailored statements</DialogTitle></DialogHeader>
          <UpgradeCard
            title="A Studio Pro feature"
            description="Pro shapes your statement to fit the specific opportunity in front of you — residency, grant, gallery, commission. Your original stays untouched."
            compact
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TailorDialog({ doc, onClose }: { doc: VaultDoc; onClose: () => void }) {
  const { opportunities, addVaultDoc } = useStore();
  const [selected, setSelected] = useState<string>("manual");
  const [manualDesc, setManualDesc] = useState("");
  const [focus, setFocus] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const buildOpportunityDescription = (): string => {
    if (selected === "manual") return manualDesc.trim();
    const opp = opportunities.find(o => o.id === selected);
    if (!opp) return "";
    const parts = [
      `Title: ${opp.title}`,
      `Organization: ${opp.organization}`,
      `Type: ${opp.type}`,
      opp.requirements ? `Requirements: ${opp.requirements}` : "",
      opp.award ? `Award: ${opp.award}` : "",
      opp.notes ? `Notes: ${opp.notes}` : "",
    ].filter(Boolean);
    return parts.join("\n");
  };

  const submit = async () => {
    const opportunityDescription = buildOpportunityDescription();
    if (!opportunityDescription) {
      toast.error("Add an opportunity description");
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke("tailor-document", {
        body: { documentBody: doc.body, opportunityDescription, focus: focus.trim() || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data?.text || "");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const saveAsNewVersion = () => {
    const today = new Date().toISOString().slice(0, 10);
    addVaultDoc({
      kind: doc.kind,
      title: `${doc.title} — tailored ${today}`,
      body: result,
      notes: selected === "manual" ? "Tailored version" : `Tailored for: ${opportunities.find(o => o.id === selected)?.title || ""}`,
    });
    toast.success("Saved as new version");
    onClose();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl font-normal">Tailor this document</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 mt-2">
        <div>
          <Label>Original</Label>
          <div className="text-sm text-muted-foreground bg-surface p-4 rounded-sm max-h-40 overflow-y-auto whitespace-pre-wrap mt-1">
            {doc.body}
          </div>
        </div>

        <div>
          <Label>Select an opportunity</Label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Enter manually instead</SelectItem>
              {opportunities.map(o => (
                <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected === "manual" && (
          <div>
            <Label>Opportunity description</Label>
            <Textarea
              value={manualDesc}
              onChange={e => setManualDesc(e.target.value)}
              rows={5}
              placeholder="Paste the call for entry, grant description, residency brief, or any relevant text…"
            />
          </div>
        )}

        <div>
          <Label>Any specific focus or angle? <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            value={focus}
            onChange={e => setFocus(e.target.value)}
            placeholder='e.g. "emphasize community work" or "focus on my printmaking practice"'
          />
        </div>

        <div>
          <Button onClick={submit} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            {loading ? "Tailoring…" : "Tailor document"}
          </Button>
          <p className="text-xs text-muted-foreground italic mt-2">
            The tailored version will be saved alongside your original — nothing gets overwritten.
          </p>
        </div>

        {result && (
          <div className="grid gap-3">
            <div className="hairline-card p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
            <div className="flex gap-2">
              <Button onClick={saveAsNewVersion} size="sm" className="gap-2">
                <Save className="h-3.5 w-3.5" /> Save as new version
              </Button>
              <Button onClick={copyToClipboard} size="sm" variant="outline" className="gap-2">
                <Copy className="h-3.5 w-3.5" /> Copy to clipboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );
}

function NewDocButton({ kind }: { kind: VaultDocKind }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" /> New {KIND_LABEL[kind].toLowerCase()}</Button>
      </DialogTrigger>
      <DocForm kind={kind} onClose={() => setOpen(false)} />
    </Dialog>
  );
}

function DocForm({ kind, initial, onClose }: { kind: VaultDocKind; initial?: VaultDoc; onClose: () => void }) {
  const { addVaultDoc, updateVaultDoc } = useStore();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [fileName, setFileName] = useState(initial?.fileName);
  const [fileData, setFileData] = useState(initial?.fileData);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") { toast.error("PDF files only"); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error("PDF must be under 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setFileData(reader.result as string);
      setFileName(f.name);
      toast.success("PDF attached");
    };
    reader.readAsDataURL(f);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title required"); return; }
    const payload = { kind, title: title.trim(), body: body || undefined, notes: notes || undefined, fileName, fileData };
    if (initial) {
      updateVaultDoc(initial.id, payload);
      toast.success("Updated");
    } else {
      addVaultDoc(payload);
      toast.success("Saved");
    }
    onClose();
  };

  return (
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl font-normal">
          {initial ? "Edit" : "New"} {KIND_LABEL[kind].toLowerCase()}
        </DialogTitle>
      </DialogHeader>
      <form className="grid gap-4 mt-2" onSubmit={submit}>
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} placeholder='e.g. "Statement — 150 words" or "CV updated Jan 2025"' required />
        </div>
        <div>
          <Label>Body</Label>
          <Textarea value={body} onChange={e => setBody(e.target.value)} rows={kind === "cv" ? 10 : 6} placeholder="Write or paste content here…" />
        </div>
        <div>
          <Label>Or attach a PDF</Label>
          <input ref={fileRef} type="file" accept="application/pdf" onChange={onFile} className="hidden" />
          <div className="flex items-center gap-3 mt-1">
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> {fileName ? "Replace PDF" : "Upload PDF"}
            </Button>
            {fileName && (
              <span className="text-xs text-muted-foreground truncate flex-1">
                {fileName}
                <button type="button" onClick={() => { setFileName(undefined); setFileData(undefined); }} className="ml-2 underline">remove</button>
              </span>
            )}
          </div>
        </div>
        <div>
          <Label>Notes</Label>
          <Input value={notes} onChange={e => setNotes(e.target.value)} maxLength={200} placeholder='e.g. "Used for Guggenheim application"' />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initial ? "Save changes" : "Save"}</Button>
        </div>
      </form>
    </DialogContent>
  );
}

export default ProfileVault;
