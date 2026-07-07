import { useMemo, useState, useRef } from "react";
import {
  Plus, Sparkles, Trash2, Download, Calendar as CalIcon, Lightbulb, MessageSquare, Mail,
  TrendingUp, RefreshCw, ChevronLeft, ChevronRight, Copy, X, Loader2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore, fmtDate } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusPill } from "@/components/StatusPill";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  SocialPlatform, IdeaStatus, CaptionStatus, ScheduleStatus, NewsletterStatus, CaptionDraft, ScheduledPost,
} from "@/lib/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const PLATFORMS: SocialPlatform[] = ["instagram", "newsletter", "facebook", "linkedin"];

const CHAR_LIMIT: Record<SocialPlatform, number | null> = {
  instagram: 2200,
  facebook: 2200,
  linkedin: 3000,
  newsletter: null,
};

const Marketing = () => {
  return (
    <AppShell
      eyebrow="Marketing Assistant"
      title="A consistent presence, without the constant juggle."
      description="Ideas and captions — one calm workspace for everything that goes out into the world."
    >
      <Tabs defaultValue="ideas" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 mb-8 overflow-x-auto">
          <TabsTrigger value="ideas" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm gap-2">
            <Lightbulb className="h-3.5 w-3.5" /> Content ideas
          </TabsTrigger>
          <TabsTrigger value="captions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm gap-2">
            <MessageSquare className="h-3.5 w-3.5" /> Caption drafts
          </TabsTrigger>
          {/* Schedule, Trends, and Newsletter are hidden until those features are built out.
              The tab components below remain in place so re-enabling is a one-line restore. */}
        </TabsList>

        <TabsContent value="ideas" className="m-0"><IdeasTab /></TabsContent>
        <TabsContent value="captions" className="m-0"><CaptionsTab /></TabsContent>
      </Tabs>
    </AppShell>
  );
};

/* ============== AI Coming-soon button ============== */
function AiSoonButton({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button size="sm" variant="outline" disabled className="gap-2 cursor-not-allowed opacity-60">
            <Sparkles className="h-3.5 w-3.5" /> {label}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Coming soon</TooltipContent>
    </Tooltip>
  );
}

/* ============== Tab 1 · Ideas ============== */
type Suggestion = { platform: SocialPlatform; idea: string; timing: string; rationale: string };

function IdeasTab() {
  const { contentIdeas, addContentIdea, updateContentIdea, deleteContentIdea, invoices, opportunities, scheduledPosts } = useStore();
  const [open, setOpen] = useState(false);

  const [sugLoading, setSugLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [sugError, setSugError] = useState<string | null>(null);

  const generateSuggestions = async () => {
    setSugLoading(true);
    setSugError(null);
    try {
      const paid = invoices
        .filter(i => i.status === "paid")
        .sort((a, b) => (b.paidAt ?? b.issuedAt).localeCompare(a.paidAt ?? a.issuedAt))
        .slice(0, 5)
        .map(i => ({
          title: i.customWork?.title ?? "(artwork)",
          medium: i.customWork?.medium,
          amount: i.amount,
        }));
      const now = Date.now();
      const upcoming = opportunities
        .filter(o => {
          const t = new Date(o.deadline).getTime();
          return t >= now && t - now <= 30 * 86400000;
        })
        .map(o => ({ title: o.title, organization: o.organization, type: o.type, deadline: o.deadline }));
      const ideas = contentIdeas.map(i => ({ platform: i.platform, description: i.description, status: i.status }));
      const recentPosts = [...scheduledPosts]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5)
        .map(p => ({ date: p.date, platform: p.platform, content: p.content.slice(0, 200) }));

      const { data, error } = await supabase.functions.invoke("marketing-intelligence", {
        body: { mode: "suggestions", context: { recentPaidInvoices: paid, upcomingOpportunities: upcoming, contentIdeas: ideas, recentScheduledPosts: recentPosts } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const list = (data?.parsed?.suggestions ?? []) as Suggestion[];
      if (!list.length) throw new Error("No suggestions returned");
      setSuggestions(list);
    } catch (e: any) {
      setSugError(e.message ?? "Failed to generate suggestions");
    } finally {
      setSugLoading(false);
    }
  };

  return (
    <div>
      {/* Suggested for you */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <div className="eyebrow mb-1">Suggested for you</div>
            <h3 className="font-display text-xl font-normal">Post ideas based on your recent activity.</h3>
          </div>
          <Button size="sm" onClick={generateSuggestions} disabled={sugLoading} className="gap-2">
            {sugLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {sugLoading ? "Generating…" : "Generate suggestions"}
          </Button>
        </div>

        {sugError && <p className="text-xs text-destructive mb-3">{sugError}</p>}

        {suggestions && suggestions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((s, idx) => (
              <div key={idx} className="hairline-card border-dashed p-4 flex flex-col">
                <div className="mb-3"><StatusPill status={s.platform} /></div>
                <p className="text-sm leading-relaxed mb-3">{s.idea}</p>
                <p className="text-xs text-muted-foreground mb-2"><span className="eyebrow">Timing</span> · {s.timing}</p>
                <p className="text-xs text-muted-foreground italic mb-4">{s.rationale}</p>
                <div className="mt-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 w-full"
                    onClick={() => {
                      addContentIdea({ platform: s.platform, description: s.idea, status: "idea" });
                      toast.success("Saved to ideas");
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add to ideas
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground max-w-md">A simple board for things to post about. Capture them now, refine later.</p>
        <div className="flex items-center gap-2">
          <AiSoonButton label="Generate ideas with AI" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" /> New idea</Button>
            </DialogTrigger>
            <IdeaForm onSubmit={(d) => { addContentIdea(d); setOpen(false); toast.success("Idea added"); }} />
          </Dialog>
        </div>
      </div>

      {contentIdeas.length === 0 ? (
        <EmptyCard icon={Lightbulb} title="No ideas yet" body="Capture loose thoughts here — finished posts can come later." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contentIdeas.map(i => (
            <div key={i.id} className="hairline-card p-4 group">
              <div className="flex items-start justify-between gap-2 mb-3">
                <StatusPill status={i.platform} />
                <button onClick={() => deleteContentIdea(i.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-sm leading-relaxed mb-4">{i.description}</p>
              <Select value={i.status} onValueChange={(v: IdeaStatus) => updateContentIdea(i.id, { status: v })}>
                <SelectTrigger className="h-7 w-full text-xs border-0 bg-transparent p-0 hover:bg-surface px-2 justify-start">
                  <StatusPill status={i.status} />
                </SelectTrigger>
                <SelectContent>
                  {(["idea", "in_progress", "scheduled", "posted"] as IdeaStatus[]).map(s => (
                    <SelectItem key={s} value={s}><StatusPill status={s} /></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IdeaForm({ onSubmit }: { onSubmit: (d: { platform: SocialPlatform; description: string; status: IdeaStatus }) => void }) {
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [description, setDescription] = useState("");

  return (
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle className="font-display text-2xl font-normal">New idea</DialogTitle></DialogHeader>
      <form className="grid gap-4 mt-2" onSubmit={(e) => { e.preventDefault(); if (!description.trim()) return; onSubmit({ platform, description: description.trim(), status: "idea" }); }}>
        <div>
          <Label>Platform</Label>
          <Select value={platform} onValueChange={(v: SocialPlatform) => setPlatform(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}><StatusPill status={p} /></SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Idea</Label>
          <Textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} maxLength={500} placeholder="What's the post about?" required />
        </div>
        <div className="flex justify-end"><Button type="submit">Add idea</Button></div>
      </form>
    </DialogContent>
  );
}

/* ============== Tab 2 · Captions ============== */
function CaptionsTab() {
  const { captionDrafts, artworks, addCaptionDraft, updateCaptionDraft, deleteCaptionDraft } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground max-w-md">Captions tied to your work. Save drafts, mark them ready, reuse across platforms.</p>
        <div className="flex items-center gap-2">
          <AiSoonButton label="Draft with AI" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" /> New caption draft</Button>
            </DialogTrigger>
            <CaptionForm onSubmit={(d) => { addCaptionDraft(d); setOpen(false); toast.success("Draft saved"); }} />
          </Dialog>
        </div>
      </div>

      {captionDrafts.length === 0 ? (
        <EmptyCard icon={MessageSquare} title="No caption drafts" body="Drafts you save here can be linked to scheduled posts." />
      ) : (
        <div className="hairline-card divide-y divide-border">
          {captionDrafts.map(c => {
            const aw = c.artworkId ? artworks.find(a => a.id === c.artworkId) : undefined;
            return (
              <div key={c.id} className="p-5 group">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusPill status={c.platform} />
                    {aw && <span className="text-xs font-display italic text-muted-foreground">— {aw.title}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={c.status} onValueChange={(v: CaptionStatus) => updateCaptionDraft(c.id, { status: v })}>
                      <SelectTrigger className="h-7 w-28 text-xs border-0 bg-transparent p-0 hover:bg-surface px-2"><StatusPill status={c.status} /></SelectTrigger>
                      <SelectContent>
                        {(["draft", "ready", "posted"] as CaptionStatus[]).map(s => (
                          <SelectItem key={s} value={s}><StatusPill status={s} /></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button onClick={() => deleteCaptionDraft(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{c.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CaptionForm({ onSubmit }: { onSubmit: (d: { platform: SocialPlatform; artworkId?: string; text: string; status: CaptionStatus }) => void }) {
  const { artworks } = useStore();
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [artworkId, setArtworkId] = useState<string>("__none__");
  const [text, setText] = useState("");

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle className="font-display text-2xl font-normal">New caption draft</DialogTitle></DialogHeader>
      <form className="grid gap-4 mt-2" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; onSubmit({ platform, artworkId: artworkId === "__none__" ? undefined : artworkId, text: text.trim(), status: "draft" }); }}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Platform</Label>
            <Select value={platform} onValueChange={(v: SocialPlatform) => setPlatform(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}><StatusPill status={p} /></SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Artwork (optional)</Label>
            <Select value={artworkId} onValueChange={setArtworkId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None —</SelectItem>
                {artworks.map(a => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Caption</Label>
          <Textarea rows={6} value={text} onChange={e => setText(e.target.value)} maxLength={2200} placeholder="Write your caption…" required />
        </div>
        <div className="flex justify-end"><Button type="submit">Save draft</Button></div>
      </form>
    </DialogContent>
  );
}

/* ============== Tab 3 · Schedule ============== */
function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // Mon=0
  x.setDate(x.getDate() - day);
  return x;
}

function startOfMonth(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function copyPostToClipboard(p: ScheduledPost) {
  const block = [p.content, p.hashtags?.trim()].filter(Boolean).join("\n\n");
  navigator.clipboard.writeText(block).then(
    () => toast.success("Copied to clipboard"),
    () => toast.error("Could not copy"),
  );
}

function ScheduleTab() {
  const { scheduledPosts, captionDrafts, addScheduledPost, updateScheduledPost, deleteScheduledPost } = useStore();
  const [open, setOpen] = useState(false);
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => startOfMonth(new Date()));

  const gridStart = useMemo(() => startOfWeek(monthAnchor), [monthAnchor]);

  const gridDays = useMemo(() => {
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [gridStart]);

  const inCurrentMonth = (d: Date) =>
    d.getMonth() === monthAnchor.getMonth() && d.getFullYear() === monthAnchor.getFullYear();
  const isoInMonth = (iso: string) => {
    const t = new Date(iso);
    return t.getMonth() === monthAnchor.getMonth() && t.getFullYear() === monthAnchor.getFullYear();
  };

  const postsByDay = useMemo(() => {
    const map: Record<string, ScheduledPost[]> = {};
    scheduledPosts.forEach(p => {
      const key = new Date(p.date).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [scheduledPosts]);

  const upcoming = useMemo(
    () => [...scheduledPosts]
      .filter(p => !isoInMonth(p.date))
      .sort((a, b) => a.date.localeCompare(b.date)),
    [scheduledPosts, monthAnchor],
  );

  const monthLabel = monthAnchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground max-w-md italic">Social publishing integrations coming soon — for now, a calm planner.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" /> Schedule post</Button>
          </DialogTrigger>
          <ScheduleForm onSubmit={(d) => { addScheduledPost(d); setOpen(false); toast.success("Scheduled"); }} drafts={captionDrafts} />
        </Dialog>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="eyebrow mb-1">Month of</div>
          <div className="font-display text-lg">{monthLabel}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1))} className="gap-1"><ChevronLeft className="h-3.5 w-3.5" /> Prev</Button>
          <Button size="sm" variant="outline" onClick={() => setMonthAnchor(startOfMonth(new Date()))}>Today</Button>
          <Button size="sm" variant="outline" onClick={() => setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1))} className="gap-1">Next <ChevronRight className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {/* Month grid */}
      <div className="hairline-card overflow-hidden">
        <div className="grid grid-cols-7 divide-x divide-border border-b border-border bg-surface/40">
          {weekdayLabels.map(l => (
            <div key={l} className="eyebrow px-2 py-2">{l}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 divide-x divide-y divide-border">
          {gridDays.map(d => {
            const isToday = d.toDateString() === new Date().toDateString();
            const inMonth = inCurrentMonth(d);
            const posts = postsByDay[d.toDateString()] ?? [];
            return (
              <div key={d.toISOString()} className={`min-h-[120px] flex flex-col ${inMonth ? "" : "bg-surface/30"}`}>
                <div className={`px-2 py-1 ${isToday ? "bg-surface/60" : ""}`}>
                  <div className={`font-display text-sm tabular-nums ${inMonth ? "" : "text-muted-foreground/50"}`}>{d.getDate()}</div>
                </div>
                <div className="flex-1 p-1.5 space-y-1.5">
                  {inMonth && posts.map(p => (
                    <PostCard key={p.id} p={p} onCopy={() => copyPostToClipboard(p)} onDelete={() => deleteScheduledPost(p.id)} onStatus={(s) => updateScheduledPost(p.id, { status: s })} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming list */}
      {upcoming.length > 0 && (
        <div className="mt-8">
          <div className="eyebrow mb-3">Upcoming &amp; other months</div>
          <div className="hairline-card divide-y divide-border">
            {upcoming.map(p => (
              <div key={p.id} className="px-4 py-3 flex items-center gap-3 group">
                <span className="text-xs tabular-nums text-muted-foreground w-24 shrink-0">{fmtDate(p.date)}</span>
                <StatusPill status={p.platform} />
                <p className="text-sm flex-1 line-clamp-1">{p.content}</p>
                <Select value={p.status} onValueChange={(v: ScheduleStatus) => updateScheduledPost(p.id, { status: v })}>
                  <SelectTrigger className="h-7 w-28 text-xs border-0 bg-transparent p-0 hover:bg-surface px-2"><StatusPill status={p.status} /></SelectTrigger>
                  <SelectContent>
                    {(["scheduled", "posted"] as ScheduleStatus[]).map(s => (
                      <SelectItem key={s} value={s}><StatusPill status={s} /></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button onClick={() => copyPostToClipboard(p)} title="Copy post" className="text-muted-foreground hover:text-foreground"><Copy className="h-3.5 w-3.5" /></button>
                <button onClick={() => deleteScheduledPost(p.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PostCard({ p, onCopy, onDelete, onStatus }: { p: ScheduledPost; onCopy: () => void; onDelete: () => void; onStatus: (s: ScheduleStatus) => void }) {
  return (
    <div className="hairline-card p-2 text-xs group/post bg-background">
      <div className="flex items-center justify-between gap-1 mb-1">
        <StatusPill status={p.platform} />
        <div className="flex items-center gap-1 opacity-0 group-hover/post:opacity-100">
          <button onClick={onCopy} title="Copy" className="text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button>
          <button onClick={onDelete} title="Delete" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
        </div>
      </div>
      {p.imageBase64 && (
        <img src={p.imageBase64} alt="" className="w-full h-12 object-cover rounded-sm mb-1" />
      )}
      <p className="text-xs leading-snug line-clamp-3 mb-1">{p.content}</p>
      <Select value={p.status} onValueChange={(v: ScheduleStatus) => onStatus(v)}>
        <SelectTrigger className="h-6 w-full text-[10px] border-0 bg-transparent p-0 px-1 hover:bg-surface justify-start"><StatusPill status={p.status} /></SelectTrigger>
        <SelectContent>
          {(["scheduled", "posted"] as ScheduleStatus[]).map(s => (
            <SelectItem key={s} value={s}><StatusPill status={s} /></SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ScheduleForm({ onSubmit, drafts }: { onSubmit: (d: Omit<ScheduledPost, "id">) => void; drafts: CaptionDraft[] }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [draftId, setDraftId] = useState<string>("__custom__");
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  const useDraft = (id: string) => {
    setDraftId(id);
    if (id !== "__custom__") {
      const d = drafts.find(x => x.id === id);
      if (d) { setContent(d.text); setPlatform(d.platform); }
    }
  };

  const onFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(f);
  };

  const limit = CHAR_LIMIT[platform];
  const remaining = limit !== null ? limit - content.length : null;

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle className="font-display text-2xl font-normal">Schedule post</DialogTitle></DialogHeader>
      <form className="grid gap-4 mt-2" onSubmit={(e) => {
        e.preventDefault();
        if (!content.trim()) return;
        onSubmit({
          date: new Date(date).toISOString(),
          platform,
          content: content.trim(),
          hashtags: hashtags.trim() || undefined,
          imageBase64,
          captionDraftId: draftId === "__custom__" ? undefined : draftId,
          status: "scheduled",
        });
      }}>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
          <div>
            <Label>Platform</Label>
            <Select value={platform} onValueChange={(v: SocialPlatform) => setPlatform(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}><StatusPill status={p} /></SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        {drafts.length > 0 && (
          <div>
            <Label>Use a saved draft</Label>
            <Select value={draftId} onValueChange={useDraft}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__custom__">— Write fresh —</SelectItem>
                {drafts.map(d => <SelectItem key={d.id} value={d.id}>{d.text.slice(0, 60)}{d.text.length > 60 ? "…" : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label>Content</Label>
          <Textarea rows={5} value={content} onChange={e => setContent(e.target.value)} maxLength={limit ?? undefined} required />
          <div className="text-xs text-muted-foreground mt-1 tabular-nums">
            {remaining !== null
              ? `${remaining} characters remaining (${platform} limit ${limit})`
              : "No character limit for newsletter"}
          </div>
        </div>
        <div>
          <Label>Hashtags</Label>
          <Input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#studio #painting #newwork" />
          <p className="text-xs text-muted-foreground mt-1 italic">Stored separately and appended to content on copy/export.</p>
        </div>
        <div>
          <Label>Attach image</Label>
          {imageBase64 ? (
            <div className="flex items-start gap-3 mt-1">
              <img src={imageBase64} alt="preview" className="h-20 w-20 object-cover rounded-sm border border-border" />
              <button type="button" onClick={() => { setImageBase64(undefined); if (fileRef.current) fileRef.current.value = ""; }} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                <X className="h-3 w-3" /> Remove
              </button>
            </div>
          ) : (
            <Input ref={fileRef} type="file" accept="image/*" onChange={e => onFile(e.target.files?.[0] ?? null)} />
          )}
          <p className="text-xs text-muted-foreground mt-1 italic">Max 2MB. Stored locally as base64.</p>
        </div>
        <div className="flex justify-end"><Button type="submit">Schedule</Button></div>
      </form>
    </DialogContent>
  );
}

/* ============== Tab · Trends ============== */
type Trend = { title: string; explanation: string };

function TrendsTab() {
  const [loading, setLoading] = useState(false);
  const [trends, setTrends] = useState<Trend[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke("marketing-intelligence", { body: { mode: "trends" } });
      if (err) throw err;
      if (data?.error) throw new Error(data.error);
      const list = (data?.parsed?.trends ?? []) as Trend[];
      if (!list.length) throw new Error("No trends returned");
      setTrends(list);
      setUpdatedAt(new Date());
    } catch (e: any) {
      setError(e.message ?? "Failed to fetch trends");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <div className="eyebrow mb-1">Trend tracker</div>
          <h3 className="font-display text-xl font-normal">What's moving on social this week.</h3>
          {updatedAt && (
            <p className="text-xs text-muted-foreground mt-1">Last updated {updatedAt.toLocaleString()}</p>
          )}
        </div>
        <Button size="sm" onClick={refresh} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {loading ? "Refreshing…" : "Refresh trends"}
        </Button>
      </div>

      {error && <p className="text-xs text-destructive mb-3">{error}</p>}

      {!trends && !loading && (
        <EmptyCard icon={TrendingUp} title="No trends yet" body="Hit refresh to pull this week's trends for visual artists on social." />
      )}

      {loading && !trends && (
        <div className="hairline-card p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Pulling trends…
        </div>
      )}

      {trends && (
        <div className="hairline-card divide-y divide-border">
          {trends.map((t, i) => (
            <div key={i} className="p-5">
              <div className="font-display text-base mb-1">{t.title}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============== Tab 4 · Newsletter ============== */
function NewsletterTab() {
  const { newsletters, contentIdeas, addNewsletter, updateNewsletter, deleteNewsletter } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<{ subject: string; bodyHtml: string } | null>(null);

  const editingDoc = editing ? newsletters.find(n => n.id === editing) : null;
  const formInitial = editingDoc
    ? editingDoc
    : prefill
      ? { subject: prefill.subject, bodyHtml: prefill.bodyHtml, status: "draft" as NewsletterStatus }
      : undefined;

  // Draft assistant state
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftResult, setDraftResult] = useState<{ subject: string; body: string } | null>(null);

  const runDraft = async () => {
    if (!topic.trim()) {
      toast.error("Tell us what the newsletter is about first");
      return;
    }
    setDraftLoading(true);
    setDraftError(null);
    try {
      const ideas = contentIdeas.map(i => ({ platform: i.platform, description: i.description, status: i.status }));
      const { data, error } = await supabase.functions.invoke("marketing-intelligence", {
        body: { mode: "newsletter_draft", context: { topic, contentNotes: notes, contentIdeas: ideas } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const parsed = data?.parsed as { subject?: string; body?: string } | null;
      if (!parsed?.subject || !parsed?.body) throw new Error("No draft returned");
      setDraftResult({ subject: parsed.subject, body: parsed.body });
    } catch (e: any) {
      setDraftError(e.message ?? "Failed to draft newsletter");
    } finally {
      setDraftLoading(false);
    }
  };

  const useDraftInForm = () => {
    if (!draftResult) return;
    const bodyHtml = draftResult.body
      .split(/\n{2,}/)
      .map(para => `<p>${para.replace(/\n/g, "<br>")}</p>`)
      .join("");
    setEditing(null);
    setPrefill({ subject: draftResult.subject, bodyHtml });
    setOpen(true);
  };

  const copyDraft = () => {
    if (!draftResult) return;
    const text = `Subject: ${draftResult.subject}\n\n${draftResult.body}`;
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copied to clipboard"),
      () => toast.error("Could not copy"),
    );
  };

  const exportNewsletter = (id: string, format: "html" | "txt") => {
    const n = newsletters.find(x => x.id === id);
    if (!n) return;
    const ext = format === "html" ? "html" : "txt";
    const content = format === "html" ? `<!doctype html><html><head><meta charset="utf-8"><title>${n.subject}</title></head><body>${n.bodyHtml}</body></html>` : n.bodyHtml.replace(/<[^>]+>/g, "");
    const blob = new Blob([content], { type: format === "html" ? "text/html" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${n.subject.replace(/[^\w-]+/g, "_")}.${ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Draft assistant */}
      <section className="mb-10">
        <div className="eyebrow mb-1">Draft assistant</div>
        <h3 className="font-display text-xl font-normal mb-2">Start with something to say.</h3>
        <p className="text-sm text-muted-foreground italic mb-5">Share a few notes about what's on your mind and we'll help shape it into a newsletter worth sending.</p>

        <div className="grid gap-4 max-w-2xl">
          <div>
            <Label>What do you want this newsletter to be about?</Label>
            <Textarea
              rows={4}
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="A recent sale, a new body of work, an upcoming show, something you've been thinking about…"
            />
          </div>
          <div>
            <Label>Any content ideas to draw from?</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Pull from your content ideas board, or jot down anything relevant."
            />
          </div>
          <div>
            <Button size="sm" onClick={runDraft} disabled={draftLoading} className="gap-2">
              {draftLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {draftLoading ? "Drafting…" : "Help me draft this"}
            </Button>
            <p className="text-xs text-muted-foreground italic mt-2">Your draft is a starting point — edit it until it sounds like you.</p>
          </div>
          {draftError && <p className="text-xs text-destructive">{draftError}</p>}
        </div>

        {draftResult && (
          <div className="hairline-card p-6 mt-4 max-w-2xl">
            <div className="eyebrow mb-1">Suggested subject line</div>
            <div className="font-display text-lg mb-3">{draftResult.subject}</div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{draftResult.body}</div>
            <div className="flex items-center gap-2 mt-5">
              <Button size="sm" onClick={useDraftInForm} className="gap-2"><Plus className="h-3.5 w-3.5" /> Use this draft</Button>
              <Button size="sm" variant="outline" onClick={copyDraft} className="gap-2"><Copy className="h-3.5 w-3.5" /> Copy to clipboard</Button>
            </div>
          </div>
        )}
      </section>

      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground max-w-md italic">Mailchimp and Klaviyo integrations coming soon — for now, draft and export.</p>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setPrefill(null); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={() => { setEditing(null); setPrefill(null); }}><Plus className="h-3.5 w-3.5" /> New newsletter</Button>
          </DialogTrigger>
          <NewsletterForm
            initial={formInitial}
            isEdit={!!editingDoc}
            onSubmit={(d) => {
              if (editingDoc) { updateNewsletter(editingDoc.id, d); toast.success("Updated"); }
              else { addNewsletter({ ...d, date: new Date().toISOString() }); toast.success("Saved"); }
              setOpen(false); setEditing(null); setPrefill(null);
            }}
          />
        </Dialog>
      </div>

      {newsletters.length === 0 ? (
        <EmptyCard icon={Mail} title="No newsletters yet" body="Drafts live here. Sent issues stay as a read-only archive." />
      ) : (
        <div className="hairline-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b border-border">
              {["Subject", "Date", "Status", ""].map(h => <th key={h} className="eyebrow px-4 py-3 font-medium">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {newsletters.map(n => (
                <tr key={n.id} className="group hover:bg-surface/40">
                  <td className="px-4 py-4 font-display text-base">{n.subject}</td>
                  <td className="px-4 py-4 text-xs text-muted-foreground tabular-nums">{fmtDate(n.sentAt ?? n.date)}</td>
                  <td className="px-4 py-4">
                    {n.status === "sent" ? (
                      <StatusPill status="sent" />
                    ) : (
                      <Select value={n.status} onValueChange={(v: NewsletterStatus) => updateNewsletter(n.id, { status: v, sentAt: v === "sent" ? new Date().toISOString() : undefined })}>
                        <SelectTrigger className="h-7 w-28 text-xs border-0 bg-transparent p-0 hover:bg-surface px-2"><StatusPill status={n.status} /></SelectTrigger>
                        <SelectContent>
                          {(["draft", "scheduled", "sent"] as NewsletterStatus[]).map(s => (
                            <SelectItem key={s} value={s}><StatusPill status={s} /></SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    {n.status !== "sent" && (
                      <button onClick={() => { setPrefill(null); setEditing(n.id); setOpen(true); }} className="text-xs text-muted-foreground hover:text-foreground mr-3 underline-offset-2 hover:underline">Edit</button>
                    )}
                    <button onClick={() => exportNewsletter(n.id, "html")} className="text-muted-foreground hover:text-foreground mr-2" title="Export HTML">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteNewsletter(n.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NewsletterForm({ initial, isEdit, onSubmit }: {
  initial?: { subject: string; bodyHtml: string; status: NewsletterStatus };
  isEdit?: boolean;
  onSubmit: (d: { subject: string; bodyHtml: string; status: NewsletterStatus }) => void;
}) {
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [bodyHtml, setBodyHtml] = useState(initial?.bodyHtml ?? "");
  const [status, setStatus] = useState<NewsletterStatus>(initial?.status ?? "draft");

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    const el = document.getElementById("nl-editor");
    if (el) setBodyHtml(el.innerHTML);
  };
  const insertLink = () => {
    const url = prompt("Link URL:");
    if (url) exec("createLink", url);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle className="font-display text-2xl font-normal">{isEdit ? "Edit" : "New"} newsletter</DialogTitle></DialogHeader>
      <form className="grid gap-4 mt-2" onSubmit={(e) => { e.preventDefault(); if (!subject.trim() || !bodyHtml.trim()) return; onSubmit({ subject: subject.trim(), bodyHtml, status }); }}>
        <div>
          <Label>Subject line</Label>
          <Input value={subject} onChange={e => setSubject(e.target.value)} maxLength={150} required />
        </div>
        <div>
          <Label>Body</Label>
          <div className="border border-input rounded-sm overflow-hidden">
            <div className="flex items-center gap-1 p-2 border-b border-border bg-surface/50 text-xs">
              <button type="button" onClick={() => exec("bold")} className="font-bold px-2 py-0.5 hover:bg-surface rounded-sm">B</button>
              <button type="button" onClick={() => exec("italic")} className="italic px-2 py-0.5 hover:bg-surface rounded-sm">I</button>
              <button type="button" onClick={() => exec("insertUnorderedList")} className="px-2 py-0.5 hover:bg-surface rounded-sm">• List</button>
              <button type="button" onClick={insertLink} className="underline px-2 py-0.5 hover:bg-surface rounded-sm">Link</button>
            </div>
            <div
              id="nl-editor"
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => setBodyHtml((e.target as HTMLDivElement).innerHTML)}
              className="p-3 min-h-[220px] text-sm leading-relaxed focus:outline-none prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: initial?.bodyHtml ?? "" }}
            />
          </div>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={(v: NewsletterStatus) => setStatus(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end"><Button type="submit">{isEdit ? "Save changes" : "Save"}</Button></div>
      </form>
    </DialogContent>
  );
}

/* ============== Shared empty state ============== */
function EmptyCard({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="hairline-card p-12 text-center">
      <img src="/AAC_Brandmark-03_Emerald.png" alt="" style={{ width: 40, height: "auto" }} className="mx-auto mb-4 opacity-20" />
      <div className="font-display text-lg mb-2">{title}</div>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{body}</p>
    </div>
  );
}

export default Marketing;
