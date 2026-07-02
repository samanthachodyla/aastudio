import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Trash2, Mail, Phone, MapPin, Search, ArrowUpRight, Calendar as CalendarIcon, X, UserPlus, Upload,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore, fmtMoney, fmtDate, daysSince, daysUntil } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/StatusPill";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Contact, ContactType, InteractionKind, LeadStatus } from "@/lib/types";

const TYPES: ContactType[] = ["gallery", "collector", "consultant", "subcontractor", "press", "curator", "peer", "other"];
const TAB_TRIGGER = "rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm gap-2";

const Contacts = () => {
  const { contacts, addContact, deleteContact, updateContact, invoices, artworks, leads, addLead, updateLead, deleteLead } = useStore();
  const [openNew, setOpenNew] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);

  const importContacts = (rows: Omit<Contact, "id">[]) => {
    rows.forEach(r => addContact(r));
    setOpenImport(false);
    toast.success(`Imported ${rows.length} contact${rows.length === 1 ? "" : "s"}`);
  };
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const enriched = useMemo(() => contacts.map(c => {
    const owned = invoices.filter(i => i.buyerName.toLowerCase() === c.name.toLowerCase() && i.status === "paid");
    const totalSpend = owned.reduce((s, i) => s + i.amount, 0);
    return { ...c, ownedInvoices: owned, totalSpend };
  }), [contacts, invoices]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter(c => {
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (!q) return true;
      return [c.name, c.email, c.location, c.notes, ...(c.tags ?? [])]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [enriched, query, typeFilter]);

  const active = enriched.find(c => c.id === activeId) ?? null;

  return (
    <AppShell
      eyebrow="Module · Relationships"
      title="The people behind the practice."
      description="A working CRM for your studio. Log every interaction and know who to reach out to next."
      actions={
        <div className="flex items-center gap-2">
          <Dialog open={openImport} onOpenChange={setOpenImport}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2"><Upload className="h-3.5 w-3.5" /> Import</Button>
            </DialogTrigger>
            <ImportContactsDialog key={openImport ? "open" : "closed"} onImport={importContacts} />
          </Dialog>
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" /> New contact</Button>
            </DialogTrigger>
            <ContactForm key={openNew ? "open" : "closed"} onSubmit={(d) => { addContact(d); setOpenNew(false); }} />
          </Dialog>
        </div>
      }
    >
      {/* Filters */}
      <div className="hairline-card p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, location, tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {(query || typeFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setTypeFilter("all"); }} className="gap-1">
            <X className="h-3 w-3" /> Clear
          </Button>
        )}
        <div className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {contacts.length}
        </div>
      </div>

      <Tabs defaultValue="list">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 mb-6 overflow-x-auto">
          <TabsTrigger value="list" className={TAB_TRIGGER}>Roster</TabsTrigger>
          <TabsTrigger value="followups" className={TAB_TRIGGER}>Follow-ups</TabsTrigger>
          <TabsTrigger value="leads" className={TAB_TRIGGER}>Leads</TabsTrigger>
        </TabsList>

        {/* ============ LIST / TABLE ============ */}
        <TabsContent value="list">
          <div className="hairline-card overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] px-5 py-3 border-b border-border eyebrow text-[10px]">
              <div>Name</div>
              <div>Type</div>
              <div>Last contact</div>
              <div>Follow-up</div>
              <div className="text-right">Spend</div>
            </div>
            {filtered.length === 0 && (
              <div className="p-12 text-center text-muted-foreground italic">
                No contacts match those filters.
              </div>
            )}
            <ul className="divide-y divide-border">
              {filtered.map(c => {
                const overdue = c.followUpAt && daysUntil(c.followUpAt) < 0;
                return (
                  <li
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 px-5 py-4 items-center cursor-pointer hover:bg-surface/40 transition-colors"
                  >
                    <div>
                      <div className="font-display text-lg leading-tight">{c.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {c.email || c.location || "—"}
                      </div>
                    </div>
                    <div><StatusPill status={c.type} /></div>
                    <div className="text-xs text-muted-foreground">
                      {c.lastInteractionAt
                        ? `${daysSince(c.lastInteractionAt)}d ago`
                        : <span className="italic">never</span>}
                    </div>
                    <div className={`text-xs ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                      {c.followUpAt ? fmtDate(c.followUpAt) : <span className="italic">—</span>}
                    </div>
                    <div className="text-right tabular-nums text-sm">
                      {c.totalSpend > 0 ? fmtMoney(c.totalSpend) : <span className="text-muted-foreground">—</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </TabsContent>

        {/* ============ FOLLOW-UPS ============ */}
        <TabsContent value="followups">
          {(() => {
            const withFollowup = filtered
              .filter(c => c.followUpAt)
              .sort((a, b) => +new Date(a.followUpAt!) - +new Date(b.followUpAt!));
            const overdue = withFollowup.filter(c => daysUntil(c.followUpAt!) < 0);
            const soon = withFollowup.filter(c => {
              const d = daysUntil(c.followUpAt!);
              return d >= 0 && d <= 7;
            });
            const later = withFollowup.filter(c => daysUntil(c.followUpAt!) > 7);
            const Section = ({ title, items, tone }: { title: string; items: typeof withFollowup; tone?: "alert" }) => (
              <div className="mb-8">
                <h3 className={`eyebrow mb-3 ${tone === "alert" ? "text-destructive" : ""}`}>{title} · {items.length}</h3>
                {items.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic">Nothing here.</div>
                ) : (
                  <ul className="hairline-card divide-y divide-border">
                    {items.map(c => (
                      <li key={c.id} onClick={() => setActiveId(c.id)} className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-surface/40 transition-colors">
                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-base">{c.name}</div>
                          <div className="text-xs text-muted-foreground truncate capitalize">{c.type}</div>
                        </div>
                        <div className={`text-xs ${tone === "alert" ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                          {fmtDate(c.followUpAt!)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
            return (
              <div>
                <Section title="Overdue" items={overdue} tone="alert" />
                <Section title="Next 7 days" items={soon} />
                <Section title="Later" items={later} />
              </div>
            );
          })()}
        </TabsContent>

        {/* ============ LEADS ============ */}
        <TabsContent value="leads">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="eyebrow mb-2">Leads · to follow up with</div>
              <h2 className="font-display text-2xl">Conversations in progress.</h2>
            </div>
            <Dialog open={leadOpen} onOpenChange={setLeadOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <UserPlus className="h-3.5 w-3.5" /> New lead
                </Button>
              </DialogTrigger>
              <LeadForm onSubmit={(data) => { addLead(data); setLeadOpen(false); toast.success("Lead added"); }} />
            </Dialog>
          </div>
          <div className="rule mb-4" />

          {leads.length === 0 ? (
            <div className="hairline-card px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground italic mb-4">
                No leads yet. Track collectors, galleries, or anyone showing interest in the work.
              </p>
              <Button size="sm" variant="outline" onClick={() => setLeadOpen(true)} className="gap-2">
                <UserPlus className="h-3.5 w-3.5" /> Add your first lead
              </Button>
            </div>
          ) : (
            <div className="hairline-card overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="text-left border-b border-border">
                  {["Name", "Interest", "Notes", "Follow up", "Status", ""].map(h => (
                    <th key={h} className="eyebrow px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {leads.map(l => (
                    <tr key={l.id} className="hover:bg-surface/50 group align-top">
                      <td className="px-4 py-4">
                        <div className="font-medium">{l.name}</div>
                        {l.contactInfo && <div className="text-xs text-muted-foreground">{l.contactInfo}</div>}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{l.interest || "—"}</td>
                      <td className="px-4 py-4 text-muted-foreground max-w-md">
                        <p className="whitespace-pre-wrap leading-relaxed">{l.notes || "—"}</p>
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {l.followUpAt ? fmtDate(l.followUpAt) : "—"}
                      </td>
                      <td className="px-4 py-4">
                        <Select
                          value={l.status}
                          onValueChange={(v: LeadStatus) => updateLead(l.id, { status: v })}
                        >
                          <SelectTrigger className="h-7 w-32 text-xs border-0 bg-transparent p-0 hover:bg-surface px-2">
                            <StatusPill status={l.status} />
                          </SelectTrigger>
                          <SelectContent>
                            {(["new", "following_up", "negotiating", "won", "lost"] as LeadStatus[]).map(s => (
                              <SelectItem key={s} value={s}><StatusPill status={s} /></SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => deleteLead(l.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============ DETAIL DRAWER ============ */}
      <Sheet open={!!active} onOpenChange={(o) => !o && setActiveId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {active && (
            <ContactDrawer
              contact={active}
              ownedInvoices={active.ownedInvoices}
              relatedLeads={leads.filter(l => l.name.toLowerCase() === active.name.toLowerCase())}
              relatedArtworks={artworks.filter(a => a.location?.toLowerCase().includes(active.name.toLowerCase()))}
              onUpdate={(patch) => updateContact(active.id, patch)}
              onDelete={() => { deleteContact(active.id); setActiveId(null); }}
            />
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
};

// =================== Detail Drawer ===================
function ContactDrawer({
  contact, ownedInvoices, relatedLeads, relatedArtworks, onUpdate, onDelete,
}: {
  contact: Contact & { totalSpend: number };
  ownedInvoices: ReturnType<typeof useStore.getState>["invoices"];
  relatedLeads: ReturnType<typeof useStore.getState>["leads"];
  relatedArtworks: ReturnType<typeof useStore.getState>["artworks"];
  onUpdate: (patch: Partial<Contact>) => void;
  onDelete: () => void;
}) {
  const { addInteraction, deleteInteraction } = useStore();
  const [tagInput, setTagInput] = useState("");
  const [newInt, setNewInt] = useState<{ kind: InteractionKind; summary: string; date: string }>({
    kind: "email", summary: "", date: new Date().toISOString().slice(0, 10),
  });

  const interactions = [...(contact.interactions ?? [])].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <div className="space-y-6">
      <SheetHeader className="text-left space-y-3 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <SheetTitle className="font-display text-3xl font-normal leading-tight">{contact.name}</SheetTitle>
            <div className="flex items-center gap-2 mt-2">
              <StatusPill status={contact.type} />
            </div>
          </div>
          <button onClick={onDelete} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-foreground">
              <Mail className="h-3 w-3" /> {contact.email}
            </a>
          )}
          {contact.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {contact.phone}</div>}
          {contact.location && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {contact.location}</div>}
        </div>
      </SheetHeader>

      {/* Follow-up control */}
      <div>
        <Label className="eyebrow text-[10px]">Follow-up</Label>
        <Input
          type="date" className="h-8 mt-1"
          value={contact.followUpAt ? contact.followUpAt.slice(0, 10) : ""}
          onChange={(e) => onUpdate({ followUpAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
        />
      </div>

      {/* Tags */}
      <div>
        <Label className="eyebrow text-[10px]">Tags</Label>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(contact.tags ?? []).map(t => (
            <Badge key={t} variant="outline" className="gap-1 font-normal">
              {t}
              <button
                onClick={() => onUpdate({ tags: (contact.tags ?? []).filter(x => x !== t) })}
                className="hover:text-destructive"
              ><X className="h-2.5 w-2.5" /></button>
            </Badge>
          ))}
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagInput.trim()) {
                e.preventDefault();
                onUpdate({ tags: [...(contact.tags ?? []), tagInput.trim()] });
                setTagInput("");
              }
            }}
            placeholder="Add tag…"
            className="h-7 text-xs w-32"
          />
        </div>
      </div>

      {/* Tabs: Activity / Linked / Notes */}
      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="linked">Linked</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          {/* Add interaction */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newInt.summary.trim()) return;
              addInteraction(contact.id, {
                kind: newInt.kind,
                summary: newInt.summary.trim(),
                date: new Date(newInt.date).toISOString(),
              });
              setNewInt({ kind: newInt.kind, summary: "", date: new Date().toISOString().slice(0, 10) });
            }}
            className="hairline-card p-3 space-y-2"
          >
            <div className="grid grid-cols-[110px_140px_1fr] gap-2">
              <Select value={newInt.kind} onValueChange={(v: InteractionKind) => setNewInt({ ...newInt, kind: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["email","call","meeting","visit","sale","exhibition","note"] as InteractionKind[]).map(k =>
                    <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" className="h-8" value={newInt.date} onChange={(e) => setNewInt({ ...newInt, date: e.target.value })} />
              <Input placeholder="What happened?" className="h-8" value={newInt.summary} onChange={(e) => setNewInt({ ...newInt, summary: e.target.value })} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" variant="outline" className="gap-1"><Plus className="h-3 w-3" /> Log</Button>
            </div>
          </form>

          {interactions.length === 0 ? (
            <div className="text-sm text-muted-foreground italic py-6 text-center">No interactions logged yet.</div>
          ) : (
            <ol className="relative border-l border-border pl-5 space-y-4">
              {interactions.map(i => (
                <li key={i.id} className="relative group">
                  <span className="absolute -left-[23px] top-1.5 w-2 h-2 rounded-full bg-foreground/40" />
                  <div className="flex items-baseline justify-between gap-2">
                    <StatusPill status={i.kind} />
                    <span className="text-[11px] text-muted-foreground tabular-nums">{fmtDate(i.date)}</span>
                  </div>
                  <p className="text-sm mt-1.5 leading-relaxed">{i.summary}</p>
                  <button
                    onClick={() => deleteInteraction(contact.id, i.id)}
                    className="absolute -right-1 top-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  ><Trash2 className="h-3 w-3" /></button>
                </li>
              ))}
            </ol>
          )}
        </TabsContent>

        <TabsContent value="linked" className="space-y-5">
          <div>
            <div className="eyebrow mb-2">Total spend</div>
            <div className="font-display text-3xl">{contact.totalSpend > 0 ? fmtMoney(contact.totalSpend) : "—"}</div>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <div className="eyebrow">Invoices</div>
              <Link to="/sales" className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">All →</Link>
            </div>
            {ownedInvoices.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">No matched invoices.</div>
            ) : (
              <ul className="divide-y divide-border border border-border">
                {ownedInvoices.map(i => (
                  <li key={i.id} className="px-3 py-2 flex items-center justify-between text-sm">
                    <span className="font-mono text-xs">{i.number}</span>
                    <span className="tabular-nums">{fmtMoney(i.amount)}</span>
                    <StatusPill status={i.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <div className="eyebrow">Open leads</div>
              <Link to="/sales" className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">Sales →</Link>
            </div>
            {relatedLeads.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">No leads attached.</div>
            ) : (
              <ul className="divide-y divide-border border border-border">
                {relatedLeads.map(l => (
                  <li key={l.id} className="px-3 py-2 flex items-center justify-between text-sm">
                    <span className="truncate">{l.interest || "—"}</span>
                    <StatusPill status={l.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <div className="eyebrow">Works on hand / placed with</div>
              <Link to="/inventory" className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">Inventory →</Link>
            </div>
            {relatedArtworks.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">No works currently linked.</div>
            ) : (
              <ul className="divide-y divide-border border border-border">
                {relatedArtworks.map(a => (
                  <li key={a.id} className="px-3 py-2 flex items-center justify-between text-sm">
                    <span className="truncate">{a.title}</span>
                    <StatusPill status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <Textarea
            value={contact.notes ?? ""}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Quiet observations about this person — preferences, history, context."
            className="min-h-[160px]"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =================== New Contact Form ===================
function ContactForm({ onSubmit }: { onSubmit: (d: Omit<Contact, "id">) => void }) {
  const [form, setForm] = useState<Omit<Contact, "id">>({
    name: "", type: "gallery", stage: "prospect",
    email: "", phone: "", location: "", notes: "", tags: [], interactions: [],
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle className="font-display text-2xl font-normal">New contact</DialogTitle></DialogHeader>
      <form className="grid gap-4 mt-2" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v: ContactType) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Location</Label><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Email</Label><Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>
        <div><Label>Notes</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="flex justify-end"><Button type="submit">Save contact</Button></div>
      </form>
    </DialogContent>
  );
}

function LeadForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({
    name: "",
    contactInfo: "",
    interest: "",
    notes: "",
    status: "new" as LeadStatus,
    followUpAt: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      contactInfo: form.contactInfo || undefined,
      interest: form.interest || undefined,
      notes: form.notes || undefined,
      status: form.status,
      followUpAt: form.followUpAt ? new Date(form.followUpAt).toISOString() : undefined,
    });
  };

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader><DialogTitle className="font-display text-2xl font-normal">New lead</DialogTitle></DialogHeader>
      <form className="grid gap-4 mt-2" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Name</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Person or organization" />
          </div>
          <div className="col-span-2">
            <Label>Contact info</Label>
            <Input value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} placeholder="email, phone, or handle" />
          </div>
          <div className="col-span-2">
            <Label>Interest</Label>
            <Input value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} placeholder="Artwork title or area of interest" />
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Conversations, next steps, context…" />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v: LeadStatus) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="following_up">Following up</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Follow up by</Label>
            <Input type="date" value={form.followUpAt} onChange={(e) => setForm({ ...form, followUpAt: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end"><Button type="submit">Add lead</Button></div>
      </form>
    </DialogContent>
  );
}

// =================== Mass Import ===================
// Minimal CSV parser: handles quoted fields, escaped quotes (""), and
// commas/newlines inside quotes. Returns rows of string cells.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const t = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (inQuotes) {
      if (ch === '"') {
        if (t[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell); cell = "";
    } else if (ch === "\n") {
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  row.push(cell);
  rows.push(row);
  // Drop fully-empty rows.
  return rows.filter(r => r.some(c => c.trim() !== ""));
}

// Header aliases → Contact field. Anything unrecognized is ignored.
const HEADER_ALIASES: Record<string, keyof Omit<Contact, "id">> = {
  name: "name", "full name": "name", contact: "name",
  email: "email", "e-mail": "email", "email address": "email",
  phone: "phone", "phone number": "phone", tel: "phone", mobile: "phone",
  location: "location", city: "location", address: "location",
  type: "type", category: "type",
  notes: "notes", note: "notes", comment: "notes", comments: "notes",
};
const POSITIONAL: (keyof Omit<Contact, "id">)[] = ["name", "email", "phone", "location", "type", "notes"];

function rowsToContacts(cells: string[][]): Omit<Contact, "id">[] {
  if (cells.length === 0) return [];
  // Detect a header row: first row contains a recognizable column name.
  const first = cells[0].map(c => c.trim().toLowerCase());
  const hasHeader = first.some(c => c in HEADER_ALIASES);
  const map = hasHeader ? first.map(h => HEADER_ALIASES[h]) : POSITIONAL;
  const body = hasHeader ? cells.slice(1) : cells;

  const out: Omit<Contact, "id">[] = [];
  for (const r of body) {
    const rec: Record<string, string> = {};
    r.forEach((val, i) => {
      const field = map[i];
      if (field) rec[field] = (rec[field] ? rec[field] + " " : "") + val.trim();
    });
    const name = (rec.name ?? "").trim();
    if (!name) continue; // name is required
    const rawType = (rec.type ?? "").trim().toLowerCase();
    const type = (TYPES as string[]).includes(rawType) ? (rawType as ContactType) : "other";
    out.push({
      name,
      type,
      stage: "prospect",
      email: rec.email?.trim() || "",
      phone: rec.phone?.trim() || "",
      location: rec.location?.trim() || "",
      notes: rec.notes?.trim() || "",
      tags: [],
      interactions: [],
    });
  }
  return out;
}

function ImportContactsDialog({ onImport }: { onImport: (rows: Omit<Contact, "id">[]) => void }) {
  const [raw, setRaw] = useState("");
  const parsed = useMemo(() => (raw.trim() ? rowsToContacts(parseCsv(raw)) : []), [raw]);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? ""));
    reader.readAsText(file);
  };

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader><DialogTitle className="font-display text-2xl font-normal">Import contacts</DialogTitle></DialogHeader>
      <div className="grid gap-4 mt-2">
        <p className="text-sm text-muted-foreground">
          Upload a <span className="font-medium">.csv</span> file or paste rows below. Columns are matched by header
          (<span className="font-mono text-xs">name, email, phone, location, type, notes</span>) — or, with no header,
          read in that order. Only <span className="font-medium">name</span> is required.
        </p>

        <div>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={(e) => onFile(e.target.files?.[0])}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:cursor-pointer hover:file:bg-surface"
          />
        </div>

        <div>
          <Label className="eyebrow text-[10px]">Or paste CSV</Label>
          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={7}
            placeholder={"name,email,phone,location,type,notes\nJane Rivera,jane@gallery.com,,New York,gallery,Met at Basel\nMarco Vale,marco@studio.co,,,collector,"}
            className="font-mono text-xs mt-1"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {raw.trim()
              ? `${parsed.length} valid contact${parsed.length === 1 ? "" : "s"} detected${parsed.length === 0 ? " — check that each row has a name." : "."}`
              : "Nothing to import yet."}
          </span>
          <Button disabled={parsed.length === 0} onClick={() => onImport(parsed)} className="gap-2">
            <Upload className="h-3.5 w-3.5" /> Import {parsed.length > 0 ? parsed.length : ""}
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground italic">
          Recognized types: {TYPES.join(", ")}. Anything else is saved as “other.”
        </p>
      </div>
    </DialogContent>
  );
}

export default Contacts;
