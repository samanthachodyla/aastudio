import { useMemo, useRef, useState } from "react";
import { Plus, Trash2, Sparkles, Loader2, ChevronDown, CalendarClock, Search, ExternalLink, Check, Paperclip, Download, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useStore, fmtDate, daysUntil } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusPill } from "@/components/StatusPill";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Opportunity, OpportunityStatus, OpportunityType, OppAttachment } from "@/lib/types";

const typeLabels: Record<string, string> = {
  open_call: "Open call",
  residency: "Residency",
  prize: "Prize",
  show: "Show",
  grant: "Grant",
  commission: "Commission",
  delivery: "Delivery deadline",
};

// Built-in types the form always offers.
const BUILT_IN_OPP_TYPES = Object.keys(typeLabels);
const ADD_NEW_OPP_TYPE = "__add_new_opp_type__";

// Turn a custom type value (e.g. "artist_talk" or "Pop-up market") into a
// readable label. Known types use their curated label; anything else is
// shown as-is (or de-underscored/capitalized if it looks slug-like).
const labelForType = (t?: string): string => {
  if (!t) return "—";
  if (typeLabels[t]) return typeLabels[t];
  if (/^[a-z0-9_]+$/.test(t)) {
    return t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }
  return t;
};

// ---- Opportunity attachments (on-device) ----
const MAX_ATT_BYTES = 5 * 1024 * 1024; // 5MB per file

const fmtBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;

type PendingAttachment = Omit<OppAttachment, "id" | "addedAt">;

function readAttachment(file: File): Promise<PendingAttachment | null> {
  if (file.size > MAX_ATT_BYTES) {
    toast.error(`"${file.name}" is over 5MB — please attach a smaller file.`);
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      mime: file.type || "application/octet-stream",
      size: file.size,
      dataUrl: String(reader.result),
    });
    reader.onerror = () => { toast.error(`Couldn't read "${file.name}".`); resolve(null); };
    reader.readAsDataURL(file);
  });
}

/** Hidden file input rendered as a labelled button; hands parsed attachments back. */
function AttachmentButton({ onFiles, label = "Attach file" }: { onFiles: (a: PendingAttachment[]) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,.heic,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          const parsed = (await Promise.all(files.map(readAttachment))).filter(Boolean) as PendingAttachment[];
          if (parsed.length) onFiles(parsed);
          if (ref.current) ref.current.value = "";
        }}
      />
      <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => ref.current?.click()}>
        <Paperclip className="h-3.5 w-3.5" /> {label}
      </Button>
    </>
  );
}

/** One attachment row with a download link and a remove button. */
function AttachmentRow({ att, onRemove }: { att: OppAttachment | PendingAttachment; onRemove: () => void }) {
  const id = "id" in att ? att.id : att.name;
  return (
    <li key={id} className="flex items-center gap-3 py-2 px-3 border border-border rounded-sm bg-surface/40">
      <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-sm truncate">{att.name}</div>
        <div className="text-[11px] text-muted-foreground">{fmtBytes(att.size)}</div>
      </div>
      <a
        href={att.dataUrl}
        download={att.name}
        className="text-muted-foreground hover:text-foreground shrink-0"
        title="Download"
      >
        <Download className="h-3.5 w-3.5" />
      </a>
      <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive shrink-0" title="Remove">
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

// Text fields the opportunity search reads. Add a new field here (e.g. "location")
// to include it in search — that's the only change required.
const OPPORTUNITY_SEARCH_FIELDS: (keyof Opportunity)[] = [
  "title", "organization", "notes", "requirements", "award",
];

const Exhibitions = () => {
  const { opportunities, addOpportunity, updateOpportunity, deleteOpportunity,
    opportunityAttachments, addOppAttachment, removeOppAttachment } = useStore();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const sorted = [...opportunities].sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(o =>
      OPPORTUNITY_SEARCH_FIELDS.some(f => String(o[f] ?? "").toLowerCase().includes(q)),
    );
  }, [sorted, query]);

  return (
    <AppShell
      eyebrow="Deadlines & applications"
      title="Everything with a deadline."
      description="Submissions, grants, commissions, deliverables. Sorted by what's next — one place for anything the calendar needs to know about."
    >
      <Tabs defaultValue="deadlines" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 mb-8 overflow-x-auto">
          <TabsTrigger value="deadlines" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm gap-2">
            <CalendarClock className="h-3.5 w-3.5" /> Deadlines
          </TabsTrigger>
          <TabsTrigger value="finder" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm gap-2">
            <Sparkles className="h-3.5 w-3.5" /> Find opportunities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deadlines" className="m-0">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search opportunities…"
                className="pl-9"
              />
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm" className="gap-2 shrink-0"><Plus className="h-3.5 w-3.5" /> New opportunity</Button></DialogTrigger>
              <OpportunityForm onSubmit={(d, files) => {
                const created = addOpportunity(d);
                files.forEach(f => addOppAttachment(created.id, f));
                setOpen(false);
              }} />
            </Dialog>
          </div>
          <ul className="divide-y divide-border border-b border-border">
            {filtered.map(o => {
              const d = daysUntil(o.deadline);
              const overdue = d < 0 && ["researching", "applying"].includes(o.status);
              const isExpanded = expandedId === o.id;
              return (
                <li key={o.id} className="group">
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : o.id)}
                    className="py-6 grid md:grid-cols-[80px_1fr_auto] gap-6 items-start cursor-pointer"
                  >
                    <div className={`text-right ${overdue ? "text-destructive" : ""}`}>
                      <div className="font-display text-4xl tabular-nums leading-none">
                        {d < 0 ? Math.abs(d) : d}
                      </div>
                      <div className="eyebrow mt-1">{d < 0 ? "days late" : d === 0 ? "today" : "days"}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="eyebrow">{labelForType(o.type)}</span>
                        <span className="text-muted-foreground text-xs">· {fmtDate(o.deadline)}</span>
                      </div>
                      <h3 className="font-display text-2xl flex items-center gap-2">
                        {o.title}
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </h3>
                      <div className="text-sm text-muted-foreground">{o.organization}</div>
                      {o.notes && !isExpanded && <p className="text-sm text-muted-foreground italic mt-2 max-w-prose line-clamp-1">{o.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Select value={o.status} onValueChange={(v: OpportunityStatus) => updateOpportunity(o.id, { status: v })}>
                        <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["researching", "applying", "submitted", "accepted", "declined", "withdrawn"] as OpportunityStatus[]).map(s => (
                            <SelectItem key={s} value={s}><StatusPill status={s} /></SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button onClick={() => deleteOpportunity(o.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="pb-6 pl-0 md:pl-[104px] pr-2 grid gap-4 max-w-3xl" onClick={(e) => e.stopPropagation()}>
                      {o.notes && (
                        <div>
                          <div className="eyebrow mb-1">Notes</div>
                          <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">{o.notes}</p>
                        </div>
                      )}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="eyebrow">More info or application link</Label>
                          <Input
                            value={o.link || ""}
                            onChange={(e) => updateOpportunity(o.id, { link: e.target.value })}
                            placeholder="https://…"
                          />
                        </div>
                        <div>
                          <Label className="eyebrow">Entry fee</Label>
                          <Input
                            type="number"
                            min={0}
                            value={o.fee ?? ""}
                            onChange={(e) => updateOpportunity(o.id, { fee: e.target.value === "" ? undefined : Number(e.target.value) })}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="eyebrow">Award / stipend / value</Label>
                        <Input
                          value={o.award || ""}
                          onChange={(e) => updateOpportunity(o.id, { award: e.target.value })}
                          placeholder="e.g. $5,000 + 4-week residency"
                        />
                      </div>
                      <div>
                        <Label className="eyebrow">Requirements or materials needed</Label>
                        <Textarea
                          value={o.requirements || ""}
                          onChange={(e) => updateOpportunity(o.id, { requirements: e.target.value })}
                          placeholder="Artist statement, 10 images, CV…"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="eyebrow">Attachments</Label>
                          <AttachmentButton onFiles={(atts) => atts.forEach(a => addOppAttachment(o.id, a))} />
                        </div>
                        {(opportunityAttachments[o.id]?.length ?? 0) === 0 ? (
                          <p className="text-xs text-muted-foreground italic">
                            No files yet. Attach a prospectus, application PDF, or reference image.
                          </p>
                        ) : (
                          <ul className="grid gap-2">
                            {opportunityAttachments[o.id].map(att => (
                              <AttachmentRow key={att.id} att={att} onRemove={() => removeOppAttachment(o.id, att.id)} />
                            ))}
                          </ul>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-2 italic">
                          Files are saved on this device. PDF, Word, or images up to 5MB each.
                        </p>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="py-12 text-center text-muted-foreground italic">
                {opportunities.length === 0
                  ? "No opportunities tracked yet."
                  : `No opportunities match "${query.trim()}".`}
              </li>
            )}
          </ul>
        </TabsContent>

        <TabsContent value="finder" className="m-0">
          <OpportunityFinder existingTitles={opportunities.map(o => o.title)} onAdd={addOpportunity} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

function OpportunityForm({ onSubmit }: { onSubmit: (d: any, files: PendingAttachment[]) => void }) {
  const customOpportunityTypes = useStore(s => s.customOpportunityTypes);
  const addCustomOpportunityType = useStore(s => s.addCustomOpportunityType);
  const [addingType, setAddingType] = useState(false);
  const [newType, setNewType] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [form, setForm] = useState({
    title: "", organization: "",
    deadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    type: "open_call" as OpportunityType,
    status: "researching" as OpportunityStatus,
    notes: "",
    link: "",
    fee: "" as string,
    requirements: "",
    award: "",
  });

  const confirmNewType = () => {
    const v = newType.trim();
    if (!v) return;
    addCustomOpportunityType(v);
    setForm(f => ({ ...f, type: v }));
    setNewType("");
    setAddingType(false);
  };
  return (
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle className="font-display text-2xl font-normal">New opportunity</DialogTitle></DialogHeader>
      <form className="grid gap-4 mt-2" onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...form,
          deadline: new Date(form.deadline).toISOString(),
          fee: form.fee === "" ? undefined : Number(form.fee),
          link: form.link || undefined,
          requirements: form.requirements || undefined,
          award: form.award || undefined,
        }, pendingAttachments);
      }}>
        <div><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Organization</Label><Input required value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} /></div>
          <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => {
                if (v === ADD_NEW_OPP_TYPE) { setAddingType(true); return; }
                setForm({ ...form, type: v });
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BUILT_IN_OPP_TYPES.map(k => <SelectItem key={k} value={k}>{typeLabels[k]}</SelectItem>)}
                {customOpportunityTypes.map(t => <SelectItem key={t} value={t}>{labelForType(t)}</SelectItem>)}
                <SelectItem value={ADD_NEW_OPP_TYPE}>＋ Add your own type…</SelectItem>
              </SelectContent>
            </Select>
            {addingType && (
              <div className="mt-2 flex items-center gap-2">
                <Input
                  autoFocus
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); confirmNewType(); }
                    if (e.key === "Escape") { setAddingType(false); setNewType(""); }
                  }}
                  placeholder="e.g. Art fair, Pop-up, Podcast…"
                  className="h-8 text-sm"
                />
                <Button type="button" size="sm" onClick={confirmNewType}>Add</Button>
              </div>
            )}
            {!addingType && customOpportunityTypes.length > 0 && (
              <p className="text-[11px] text-muted-foreground mt-1">Your saved types stay in this list for next time.</p>
            )}
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v: OpportunityStatus) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["researching", "applying", "submitted", "accepted", "declined", "withdrawn"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>More info or application link</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://…" /></div>
          <div><Label>Entry fee</Label><Input type="number" min={0} value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} placeholder="0" /></div>
        </div>
        <div><Label>Award / stipend / value</Label><Input value={form.award} onChange={(e) => setForm({ ...form, award: e.target.value })} placeholder="e.g. $5,000 + residency" /></div>
        <div><Label>Requirements or materials needed</Label><Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="Artist statement, 10 images, CV…" /></div>
        <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Anything else worth remembering…" /></div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Attachments</Label>
            <AttachmentButton onFiles={(atts) => setPendingAttachments(prev => [...prev, ...atts])} />
          </div>
          {pendingAttachments.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Optional — attach a prospectus, application PDF, or reference image (PDF, Word, or images up to 5MB each).
            </p>
          ) : (
            <ul className="grid gap-2">
              {pendingAttachments.map((att, i) => (
                <AttachmentRow
                  key={att.name + i}
                  att={att}
                  onRemove={() => setPendingAttachments(prev => prev.filter((_, j) => j !== i))}
                />
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-end"><Button type="submit">Save opportunity</Button></div>
      </form>
    </DialogContent>
  );
}

const FINDER_TYPES = [
  { value: "Open call", label: "Open call" },
  { value: "Residency", label: "Residency" },
  { value: "Grant", label: "Grant" },
  { value: "Prize", label: "Prize" },
];

interface Suggestion {
  name: string;
  organization?: string;
  type?: string;
  deadline_season?: string;
  description?: string;
  where_to_find?: string;
}

// Fields the suggestion search reads. Add one here to include it in search.
const SUGGESTION_SEARCH_FIELDS: (keyof Suggestion)[] = [
  "name", "organization", "type", "description", "where_to_find",
];

// A "where to find" value is a clickable link only if it's an http(s) URL.
const asUrl = (v?: string): string | null => {
  const s = (v ?? "").trim();
  return /^https?:\/\/\S+$/i.test(s) ? s : null;
};

// Map the finder's free-text type onto the app's opportunity types.
const SUGGESTION_TYPE_MAP: Record<string, OpportunityType> = {
  "open call": "open_call", residency: "residency", grant: "grant",
  prize: "prize", show: "show", commission: "commission", platform: "open_call",
};
const mapSuggestionType = (t?: string): OpportunityType =>
  SUGGESTION_TYPE_MAP[(t ?? "").trim().toLowerCase()] ?? "open_call";

// Statuses offered in the "Track this" dropdown on each suggestion.
const TRACK_STATUSES: { value: OpportunityStatus; label: string }[] = [
  { value: "researching", label: "Researching" },
  { value: "applying", label: "Applying" },
  { value: "submitted", label: "Submitted" },
];

function OpportunityFinder({ existingTitles, onAdd }: {
  existingTitles: string[];
  onAdd: (o: Omit<Opportunity, "id">) => void;
}) {
  const [region, setRegion] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [feePreference, setFeePreference] = useState("Any");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [query, setQuery] = useState("");
  const [added, setAdded] = useState<Set<string>>(new Set());

  const trackSuggestion = (s: Suggestion, status: OpportunityStatus) => {
    onAdd({
      title: s.name,
      organization: s.organization ?? "",
      deadline: new Date(Date.now() + 60 * 86400000).toISOString(), // placeholder — refine in Deadlines
      type: mapSuggestionType(s.type),
      status,
      notes: [
        s.description,
        s.deadline_season ? `Suggested timing: ${s.deadline_season}` : "",
        "Saved from Opportunity Finder",
      ].filter(Boolean).join("\n\n"),
      link: asUrl(s.where_to_find) ?? undefined,
    });
    setAdded(prev => new Set(prev).add(s.name));
    toast.success(`Added “${s.name}” to your deadlines`, {
      description: "Set its exact deadline in the Deadlines tab.",
    });
  };

  const filteredSuggestions = useMemo(() => {
    if (!suggestions) return null;
    const q = query.trim().toLowerCase();
    if (!q) return suggestions;
    return suggestions.filter(s =>
      SUGGESTION_SEARCH_FIELDS.some(f => String(s[f] ?? "").toLowerCase().includes(q)),
    );
  }, [suggestions, query]);

  const toggleType = (t: string) => {
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuggestions(null);
    setQuery("");
    try {
      const { data, error } = await supabase.functions.invoke("opportunity-finder", {
        body: { region, discipline, types, feePreference, existingTitles },
      });
      if (error) {
        // Surface the function's real error body (e.g. "ANTHROPIC_API_KEY not
        // configured") instead of the generic "non-2xx status code" wrapper.
        let msg = error.message || "Couldn't reach the opportunity finder.";
        try {
          const body = await (error as { context?: Response }).context?.json?.();
          if (body?.error) msg = body.error;
        } catch { /* keep default */ }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      setSuggestions(data?.suggestions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-16">
      <div className="mb-6">
        <div className="eyebrow">Opportunity finder</div>
        <h2 className="font-display text-3xl mt-1">Find your next opportunity.</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 max-w-2xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Region</Label>
            <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Southeast US, National…" />
          </div>
          <div>
            <Label>Discipline or medium</Label>
            <Input value={discipline} onChange={(e) => setDiscipline(e.target.value)} placeholder="painting, mixed media…" />
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Opportunity type</Label>
          <div className="flex flex-wrap gap-4">
            {FINDER_TYPES.map(t => (
              <label key={t.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={types.includes(t.value)} onCheckedChange={() => toggleType(t.value)} />
                {t.label}
              </label>
            ))}
          </div>
        </div>
        <div className="max-w-xs">
          <Label>Fee preference</Label>
          <Select value={feePreference} onValueChange={setFeePreference}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="No fee only">No fee only</SelectItem>
              <SelectItem value="Under $35">Under $35</SelectItem>
              <SelectItem value="Any">Any</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Button type="submit" size="sm" className="gap-2" disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? "Finding…" : "Find opportunities"}
          </Button>
          <p className="text-xs text-muted-foreground italic mt-2">
            Suggestions are AI-generated based on known opportunities and should be verified directly with the hosting organization.
          </p>
        </div>
      </form>

      {error && (
        <div className="mt-6 hairline-card p-4 text-sm text-destructive">{error}</div>
      )}

      {suggestions && suggestions.length > 0 && (
        <>
          <div className="relative mt-8 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter these suggestions…"
              className="pl-9"
            />
          </div>

          {filteredSuggestions && filteredSuggestions.length > 0 ? (
            <div className="mt-4 hairline-card divide-y divide-border">
              {filteredSuggestions.map((s, i) => {
                const url = asUrl(s.where_to_find);
                const isAdded = added.has(s.name);
                return (
                  <div key={i} className="p-5">
                    <div className="flex items-baseline justify-between gap-4 flex-wrap">
                      <h3 className="font-display text-xl">
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:underline">
                            {s.name}
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                          </a>
                        ) : s.name}
                      </h3>
                      {s.deadline_season && <span className="eyebrow">{s.deadline_season}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {[s.organization, s.type].filter(Boolean).join(" · ")}
                    </div>
                    {s.description && <p className="text-sm text-muted-foreground mt-2">{s.description}</p>}

                    <div className="flex items-center flex-wrap gap-3 mt-4">
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Visit site
                        </a>
                      ) : s.where_to_find ? (
                        <span className="text-xs text-muted-foreground italic">Where to find: {s.where_to_find}</span>
                      ) : null}

                      <div className="ml-auto">
                        {isAdded ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Check className="h-3.5 w-3.5" /> Added to deadlines
                          </span>
                        ) : (
                          <Select onValueChange={(v: OpportunityStatus) => trackSuggestion(s, v)}>
                            <SelectTrigger className="h-8 w-40 text-xs">
                              <SelectValue placeholder="Track this…" />
                            </SelectTrigger>
                            <SelectContent>
                              {TRACK_STATUSES.map(st => (
                                <SelectItem key={st.value} value={st.value} className="text-xs">
                                  {st.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 text-sm text-muted-foreground italic">No suggestions match "{query.trim()}".</div>
          )}
        </>
      )}

      {suggestions && suggestions.length === 0 && (
        <div className="mt-6 text-sm text-muted-foreground italic">No suggestions returned. Try adjusting your criteria.</div>
      )}
    </section>
  );
}

export default Exhibitions;
