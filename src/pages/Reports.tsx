import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useIsAdmin, fetchAdminDataset, type AdminDataset } from "@/lib/admin";
import { fmtMoney } from "@/lib/store";
import { labelForPath } from "@/lib/labels";
import { BETA_ALL_PRO } from "@/lib/tier";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

interface PathTime {
  path: string;
  minutes: number;
}

interface UserAgg {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  tier: string;
  plan: string | null;
  cycle: string | null;
  subStatus: string | null;
  joined: string | null;
  lastActive: string | null;
  pageViews: number;
  activeMinutes: number;
  artworks: number;
  invoices: number;
  contacts: number;
  opportunities: number;
  age: number | null;
  zip: string | null;
  desiredFeatures: string[];
  timeByPath: PathTime[];
  revenue: number;      // total sales the member has tracked (sum of their invoices)
  mrr: number;          // monthly recurring revenue this member pays us
  lifecycle: Lifecycle; // engagement/billing stage, for filtering + health
}

// ---- Business metrics ----
// Monthly-equivalent price per plan, so annual plans fold into a comparable MRR.
const PLAN_PRICE: Record<string, number> = {
  "starter:monthly": 25, "starter:annual": 240, "pro:monthly": 55, "pro:annual": 528,
};
/** What this member contributes to MRR right now (0 for trials/comps/churned). */
function monthlyValue(plan: string | null, cycle: string | null, status: string | null): number {
  if (!status || !["active", "past_due"].includes(status)) return 0;
  const p = PLAN_PRICE[`${plan}:${cycle}`];
  if (!p) return 0;
  return cycle === "annual" ? p / 12 : p;
}

type Lifecycle = "Trialing" | "Paying" | "Past due" | "Comp" | "Churned" | "Active" | "Dormant" | "New";
/** A member's stage — billing state first, then engagement recency. Drives the
 *  category filter and a quick read on account health. */
function lifecycleOf(status: string | null, lastActive: string | null, joined: string | null): Lifecycle {
  if (status === "trialing") return "Trialing";
  if (status === "past_due") return "Past due";
  if (status === "comp") return "Comp";
  if (status === "canceled" || status === "unpaid") return "Churned";
  if (status === "active") return "Paying";
  // No paid status — classify by engagement.
  const days = lastActive ? (Date.now() - new Date(lastActive).getTime()) / 86400000 : Infinity;
  if (days <= 7) return "Active";
  const joinedDays = joined ? (Date.now() - new Date(joined).getTime()) / 86400000 : Infinity;
  if (joinedDays <= 7) return "New";
  return "Dormant";
}

// Category filter options for the members table.
const CATEGORY_OPTIONS = [
  "All members", "Paying", "Trialing", "Past due", "Churned", "Comp",
  "Pro plan", "Starter plan", "Active (7d)", "Dormant (30d+)", "Activated", "Not activated",
] as const;
type Category = typeof CATEGORY_OPTIONS[number];

function matchesCategory(r: UserAgg, cat: Category): boolean {
  switch (cat) {
    case "All members": return true;
    case "Paying": return r.subStatus === "active";
    case "Trialing": return r.subStatus === "trialing";
    case "Past due": return r.subStatus === "past_due";
    case "Churned": return r.subStatus === "canceled" || r.subStatus === "unpaid";
    case "Comp": return r.subStatus === "comp";
    case "Pro plan": return r.plan === "pro";
    case "Starter plan": return r.plan === "starter";
    case "Active (7d)": return !!r.lastActive && Date.now() - new Date(r.lastActive).getTime() < 7 * 86400000;
    case "Dormant (30d+)": return !r.lastActive || Date.now() - new Date(r.lastActive).getTime() >= 30 * 86400000;
    case "Activated": return r.artworks > 0;
    case "Not activated": return r.artworks === 0;
    default: return true;
  }
}

// Sortable columns for the members table.
type SortKey = "name" | "lifecycle" | "lastActive" | "pageViews" | "activeMinutes" | "artworks" | "invoices" | "revenue" | "mrr" | "joined";

const fmtMinutes = (m: number) => {
  if (m <= 0) return "—";
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h ? `${h}h ${min}m` : `${min}m`;
};

const fmtWhen = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Never";

const tierLabel = (tier: string) => (BETA_ALL_PRO ? "Pro · beta" : tier === "pro" ? "Pro" : "Starter");

// Plan + billing cycle at a glance, from the subscriptions table.
const ACTIVE_SUB = ["active", "comp", "trialing"];
const planLabel = (plan: string | null, cycle: string | null, status: string | null): string => {
  if (!status) return "—"; // no subscription row at all
  const t = plan === "pro" ? "Pro" : plan === "starter" ? "Starter" : "";
  const cyc = cycle === "annual" ? "Annual" : cycle === "monthly" ? "Monthly" : "";
  if (ACTIVE_SUB.includes(status)) {
    const tag = status === "comp" ? "Comp" : status === "trialing" ? "Trial" : cyc;
    if (!t) return cyc ? `Active · ${cyc}` : "Active";
    return tag ? `${t} · ${tag}` : t;
  }
  // Has a row but isn't active — surface the real state (a follow-up signal:
  // "incomplete" = tried to pay, "canceled" = churned, etc.).
  const state = status === "incomplete" ? "Incomplete"
    : status === "past_due" ? "Past due"
    : status === "canceled" ? "Canceled"
    : status === "unpaid" ? "Unpaid"
    : status === "inactive" ? "Inactive"
    : status.charAt(0).toUpperCase() + status.slice(1);
  return t ? `${t} · ${state}` : state;
};

// Private admin notes on a member — editable, saved to the member_notes table.
function MemberNotes({ userId, initial }: { userId: string; initial: string }) {
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setText(initial); }, [userId, initial]);
  const save = async () => {
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("member_notes")
      .upsert({ user_id: userId, notes: text, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error("Couldn't save notes — is the member_notes table set up?");
    else toast.success("Notes saved.");
  };
  return (
    <div className="hairline-card p-5">
      <div className="eyebrow mb-3">Notes</div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Private notes about this member — plan changes, comps, follow-ups, anything worth remembering…"
        rows={4}
      />
      <div className="mt-3">
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save notes"}</Button>
      </div>
    </div>
  );
}

// A clickable column header that sorts the members table by its key.
function SortTh({ label, k, sortBy, sortDir, onSort, align = "left" }: {
  label: string; k: SortKey; sortBy: SortKey; sortDir: "asc" | "desc"; onSort: (k: SortKey) => void; align?: "left" | "right";
}) {
  const activeCol = sortBy === k;
  return (
    <th className={`font-normal eyebrow px-4 py-3 ${align === "right" ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${activeCol ? "text-foreground" : ""} ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {label}
        {activeCol && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );
}

const Reports = () => {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [data, setData] = useState<AdminDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [resyncing, setResyncing] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All members");
  const [sortBy, setSortBy] = useState<SortKey>("lastActive");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Reconcile everyone's access with Stripe (heals paid-but-locked-out drift).
  const resync = async () => {
    setResyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please sign in again."); return; }
      const res = await fetch("/api/admin/resync", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.ok) { toast.error(json.error || "Resync failed."); return; }
      toast.success(`Resynced from Stripe — ${json.synced} member(s) updated.`);
      fetchAdminDataset().then(setData).catch(() => {});
    } catch {
      toast.error("Couldn't reach the resync service.");
    } finally {
      setResyncing(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchAdminDataset()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load reports"));
  }, [isAdmin]);

  const rows: UserAgg[] = useMemo(() => {
    if (!data) return [];
    const by = <T extends { user_id: string }>(arr: T[]) => {
      const m = new Map<string, T[]>();
      for (const r of arr) {
        if (!m.has(r.user_id)) m.set(r.user_id, []);
        m.get(r.user_id)!.push(r);
      }
      return m;
    };
    const usageBy = by(data.usage);
    const artBy = by(data.artworks);
    const invBy = by(data.invoices);
    const conBy = by(data.contacts);
    const oppBy = by(data.opportunities);
    const subByUser = new Map(data.subscriptions.map((s) => [s.user_id, s]));

    return data.profiles
      .map((p): UserAgg => {
        const usage = usageBy.get(p.id) ?? [];
        const views = usage.filter((e) => e.event_type === "page_view");
        const heartbeats = usage.filter((e) => e.event_type === "heartbeat");
        const lastFromUsage = usage.reduce<string | null>(
          (m, e) => (!m || e.occurred_at > m ? e.occurred_at : m),
          null
        );
        // Time-on-page: each heartbeat ≈ one active minute on its path.
        const minutesByPath = new Map<string, number>();
        for (const hb of heartbeats) {
          const key = hb.path ?? "—";
          minutesByPath.set(key, (minutesByPath.get(key) ?? 0) + 1);
        }
        const timeByPath = [...minutesByPath.entries()]
          .map(([path, minutes]) => ({ path, minutes }))
          .sort((a, b) => b.minutes - a.minutes);

        const sub = subByUser.get(p.id);
        const plan = sub?.plan ?? null;
        const cycle = sub?.cycle ?? null;
        const subStatus = sub?.status ?? null;
        const lastActive = p.last_seen_at || lastFromUsage;
        const joined = p.created_at ?? null;
        // Sales the member has tracked = the total of every invoice they've logged.
        const revenue = (invBy.get(p.id) ?? []).reduce((s, i) => s + (Number((i as { amount?: unknown }).amount) || 0), 0);

        return {
          id: p.id,
          name: p.full_name || "—",
          email: p.email || "—",
          isAdmin: p.is_admin,
          tier: p.tier || "starter",
          plan,
          cycle,
          subStatus,
          joined,
          lastActive,
          pageViews: views.length,
          activeMinutes: heartbeats.length,
          artworks: (artBy.get(p.id) ?? []).length,
          invoices: (invBy.get(p.id) ?? []).length,
          contacts: (conBy.get(p.id) ?? []).length,
          opportunities: (oppBy.get(p.id) ?? []).length,
          age: p.age ?? null,
          zip: p.zip_code ?? null,
          desiredFeatures: p.desired_features ?? (p.desired_feature ? [p.desired_feature] : []),
          timeByPath,
          revenue,
          mrr: monthlyValue(plan, cycle, subStatus),
          lifecycle: lifecycleOf(subStatus, lastActive, joined),
        };
      })
      .sort((a, b) => (b.lastActive ?? "").localeCompare(a.lastActive ?? ""));
  }, [data]);

  // Members after the category filter + search, sorted by the chosen column.
  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) =>
      matchesCategory(r, category) &&
      (!q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
    );
    const dir = sortDir === "asc" ? 1 : -1;
    const val = (r: UserAgg): number | string => {
      switch (sortBy) {
        case "name": return r.name.toLowerCase();
        case "lifecycle": return r.lifecycle;
        case "lastActive": return r.lastActive ? new Date(r.lastActive).getTime() : 0;
        case "joined": return r.joined ? new Date(r.joined).getTime() : 0;
        case "pageViews": return r.pageViews;
        case "activeMinutes": return r.activeMinutes;
        case "artworks": return r.artworks;
        case "invoices": return r.invoices;
        case "revenue": return r.revenue;
        case "mrr": return r.mrr;
        default: return 0;
      }
    };
    return [...list].sort((a, b) => {
      const av = val(a), bv = val(b);
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
  }, [rows, query, category, sortBy, sortDir]);

  // Toggle sort: same column flips direction; a new column sorts descending.
  const sortByCol = (key: SortKey) => {
    if (key === sortBy) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortDir(key === "name" ? "asc" : "desc"); }
  };

  // Studio-wide business metrics (from existing data — no new capture needed).
  const biz = useMemo(() => {
    const mrr = rows.reduce((s, r) => s + r.mrr, 0);
    const paying = rows.filter((r) => r.subStatus === "active").length;
    const trials = rows.filter((r) => r.subStatus === "trialing").length;
    const gmv = rows.reduce((s, r) => s + r.revenue, 0);
    const activated = rows.filter((r) => r.artworks > 0).length;
    const activationRate = rows.length ? Math.round((activated / rows.length) * 100) : 0;
    return { mrr, arr: mrr * 12, paying, trials, gmv, activationRate };
  }, [rows]);

  // Studio-wide time spent per section (heartbeat minutes across all members).
  const globalTimeByPath = useMemo<PathTime[]>(() => {
    if (!data) return [];
    const m = new Map<string, number>();
    for (const e of data.usage) {
      if (e.event_type !== "heartbeat") continue;
      const key = e.path ?? "—";
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return [...m.entries()].map(([path, minutes]) => ({ path, minutes })).sort((a, b) => b.minutes - a.minutes);
  }, [data]);

  // Distribution of the "feature you hope to use most" survey answer.
  const featureCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      for (const feature of r.desiredFeatures) {
        m.set(feature, (m.get(feature) ?? 0) + 1);
      }
    }
    return [...m.entries()].map(([feature, count]) => ({ feature, count })).sort((a, b) => b.count - a.count);
  }, [rows]);

  const maxGlobalMinutes = globalTimeByPath[0]?.minutes ?? 0;
  const maxFeatureCount = featureCounts[0]?.count ?? 0;

  const selectedUser = rows.find((r) => r.id === selected) || null;
  const selectedNotes = data?.notes?.find((n) => n.user_id === selected)?.notes ?? "";
  const selectedArtworks = data?.artworks.filter((a) => a.user_id === selected) ?? [];
  const selectedInvoices = data?.invoices.filter((i) => i.user_id === selected) ?? [];
  const selectedContacts = data?.contacts.filter((c) => c.user_id === selected) ?? [];

  if (adminLoading) {
    return (
      <AppShell title="Reports" eyebrow="Admin">
        <div className="eyebrow text-muted-foreground animate-pulse">Checking access…</div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell title="Reports" eyebrow="Admin">
        <div className="hairline-card p-6 max-w-lg">
          <p className="text-sm text-muted-foreground">
            This section is for studio administrators only.
          </p>
        </div>
      </AppShell>
    );
  }

  const totals = {
    members: rows.length,
    active7d: rows.filter((r) => r.lastActive && Date.now() - new Date(r.lastActive).getTime() < 7 * 86400000).length,
    artworks: rows.reduce((s, r) => s + r.artworks, 0),
    responses: rows.filter((r) => r.desiredFeatures.length > 0).length,
  };

  return (
    <AppShell title="Reports" eyebrow="Admin" description="Engagement and studio activity across all members.">
      {error && (
        <div className="hairline-card p-4 mb-6 border-destructive/40">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Members", value: totals.members },
          { label: "Active (7d)", value: totals.active7d },
          { label: "Artworks", value: totals.artworks },
          { label: "Survey responses", value: totals.responses },
        ].map((t) => (
          <div key={t.label} className="hairline-card p-5">
            <div className="eyebrow mb-1">{t.label}</div>
            <div className="font-display text-3xl tracking-tight">{t.value}</div>
          </div>
        ))}
      </div>

      {/* Business metrics — the growth story at a glance (from existing data). */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: "MRR", value: fmtMoney(Math.round(biz.mrr)), hint: "Monthly recurring revenue" },
          { label: "ARR", value: fmtMoney(Math.round(biz.arr)), hint: "Annualized run-rate" },
          { label: "Paying", value: String(biz.paying), hint: "Members on an active paid plan" },
          { label: "Trials", value: String(biz.trials), hint: "Active free trials" },
          { label: "Sales tracked", value: fmtMoney(Math.round(biz.gmv)), hint: "Total invoices logged by all artists" },
          { label: "Activation", value: `${biz.activationRate}%`, hint: "Members with ≥1 artwork" },
        ].map((t) => (
          <div key={t.label} className="hairline-card p-5" title={t.hint}>
            <div className="eyebrow mb-1">{t.label}</div>
            <div className="font-display text-2xl tracking-tight">{t.value}</div>
          </div>
        ))}
      </div>

      {/* Studio-wide engagement + survey aggregates */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="hairline-card p-5">
          <div className="eyebrow mb-4">Where time is spent</div>
          {globalTimeByPath.length ? (
            <ul className="space-y-2.5">
              {globalTimeByPath.slice(0, 8).map((p) => (
                <li key={p.path}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{labelForPath(p.path)}</span>
                    <span className="text-muted-foreground tabular-nums">{fmtMinutes(p.minutes)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary/70"
                      style={{ width: `${maxGlobalMinutes ? (p.minutes / maxGlobalMinutes) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          )}
        </div>

        <div className="hairline-card p-5">
          <div className="eyebrow mb-4">Most-wanted features (survey)</div>
          {featureCounts.length ? (
            <ul className="space-y-2.5">
              {featureCounts.map((f) => (
                <li key={f.feature}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{f.feature}</span>
                    <span className="text-muted-foreground tabular-nums">{f.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary/70"
                      style={{ width: `${maxFeatureCount ? (f.count / maxFeatureCount) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No survey responses yet.</p>
          )}
        </div>
      </div>

      {/* Members table */}
      <div className="flex items-center justify-between mb-3">
        <div className="eyebrow">Members</div>
        <Button size="sm" variant="outline" onClick={resync} disabled={resyncing} title="Reconcile every member's access with Stripe">
          {resyncing ? "Resyncing…" : "Resync from Stripe"}
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email…" className="pl-9" />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
          <SelectTrigger className="w-full sm:w-[190px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground sm:ml-auto whitespace-nowrap">{visibleRows.length} of {rows.length}</span>
      </div>
      <div className="hairline-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <SortTh label="Member" k="name" sortBy={sortBy} sortDir={sortDir} onSort={sortByCol} />
              <SortTh label="Plan" k="mrr" sortBy={sortBy} sortDir={sortDir} onSort={sortByCol} />
              <SortTh label="Last active" k="lastActive" sortBy={sortBy} sortDir={sortDir} onSort={sortByCol} />
              <SortTh label="Page views" k="pageViews" sortBy={sortBy} sortDir={sortDir} onSort={sortByCol} align="right" />
              <SortTh label="Active time" k="activeMinutes" sortBy={sortBy} sortDir={sortDir} onSort={sortByCol} align="right" />
              <SortTh label="Artworks" k="artworks" sortBy={sortBy} sortDir={sortDir} onSort={sortByCol} align="right" />
              <SortTh label="Invoices" k="invoices" sortBy={sortBy} sortDir={sortDir} onSort={sortByCol} align="right" />
              <SortTh label="Sales" k="revenue" sortBy={sortBy} sortDir={sortDir} onSort={sortByCol} align="right" />
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelected(r.id === selected ? null : r.id)}
                className={`border-b border-border/60 cursor-pointer transition-colors hover:bg-muted/40 ${
                  selected === r.id ? "bg-muted/50" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.name}</span>
                    {r.isAdmin && <span className="text-[10px] uppercase tracking-wider text-accent-foreground bg-accent rounded-sm px-1.5 py-0.5">admin</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.email}</div>
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    const label = planLabel(r.plan, r.cycle, r.subStatus);
                    if (label === "—") return <span className="text-muted-foreground">—</span>;
                    const active = ACTIVE_SUB.includes(r.subStatus || "");
                    const cls = !active
                      ? "bg-muted text-muted-foreground" // incomplete / canceled / past due
                      : r.plan === "pro"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-foreground/70";
                    return (
                      <span className={`inline-block text-[11px] font-medium tracking-wide rounded-sm px-2 py-0.5 whitespace-nowrap ${cls}`}>
                        {label}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{fmtWhen(r.lastActive)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{r.pageViews}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtMinutes(r.activeMinutes)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{r.artworks}</td>
                <td className="px-4 py-3 text-right tabular-nums">{r.invoices}</td>
                <td className="px-4 py-3 text-right tabular-nums">{r.revenue > 0 ? fmtMoney(r.revenue) : "—"}</td>
              </tr>
            ))}
            {!visibleRows.length && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                {!rows.length && !error ? "Loading members…" : "No members match this filter."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drill-down for a selected member */}
      {selectedUser && (
        <div className="mt-8 space-y-6 animate-fade-in">
          <div className="rule" />
          <div>
            <div className="eyebrow mb-1">Member detail</div>
            <h2 className="font-display text-3xl tracking-tight">{selectedUser.name}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedUser.email} ·{" "}
              {planLabel(selectedUser.plan, selectedUser.cycle, selectedUser.subStatus) === "—"
                ? `Studio ${tierLabel(selectedUser.tier)}`
                : planLabel(selectedUser.plan, selectedUser.cycle, selectedUser.subStatus)}{" "}
              · {selectedUser.opportunities} opportunities · {selectedUser.contacts} contacts
            </p>
          </div>

          {/* Membership & activity — works for every member (not just beta) */}
          <div className="hairline-card p-5">
            <div className="eyebrow mb-3">Membership &amp; activity</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Plan</div>
                <div>{planLabel(selectedUser.plan, selectedUser.cycle, selectedUser.subStatus)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Stage</div>
                <div>{selectedUser.lifecycle}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Sales tracked</div>
                <div className="tabular-nums">{selectedUser.revenue > 0 ? fmtMoney(selectedUser.revenue) : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Joined</div>
                <div>{fmtWhen(selectedUser.joined)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Last active</div>
                <div>{fmtWhen(selectedUser.lastActive)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Active time</div>
                <div className="tabular-nums">{fmtMinutes(selectedUser.activeMinutes)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Page views</div>
                <div className="tabular-nums">{selectedUser.pageViews}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Artworks</div>
                <div className="tabular-nums">{selectedUser.artworks}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Invoices</div>
                <div className="tabular-nums">{selectedUser.invoices}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Contacts</div>
                <div className="tabular-nums">{selectedUser.contacts}</div>
              </div>
            </div>
          </div>

          {/* Private admin notes on this member */}
          <MemberNotes userId={selectedUser.id} initial={selectedNotes} />

          {/* Survey responses — beta demographics only; hidden when there's none */}
          {(selectedUser.age != null || selectedUser.zip || selectedUser.desiredFeatures.length > 0) && (
          <div className="hairline-card p-5">
            <div className="eyebrow mb-3">Survey responses</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Age</div>
                <div>{selectedUser.age ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">ZIP code</div>
                <div>{selectedUser.zip ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Most-wanted features</div>
                <div>{selectedUser.desiredFeatures.length ? selectedUser.desiredFeatures.join(", ") : "—"}</div>
              </div>
            </div>
          </div>
          )}

          {/* Time by section */}
          {selectedUser.timeByPath.length > 0 && (
            <div className="hairline-card p-5">
              <div className="eyebrow mb-3">Time by section</div>
              <div className="flex flex-wrap gap-2">
                {selectedUser.timeByPath.slice(0, 8).map((p) => (
                  <span key={p.path} className="text-xs border border-border rounded-sm px-2 py-1">
                    {labelForPath(p.path)} · {fmtMinutes(p.minutes)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="hairline-card p-5">
              <div className="eyebrow mb-3">Artworks ({selectedArtworks.length})</div>
              <ul className="space-y-2 text-sm">
                {selectedArtworks.slice(0, 12).map((a) => (
                  <li key={a.id} className="flex justify-between gap-3">
                    <span className="truncate">{a.title}{a.year ? ` · ${a.year}` : ""}</span>
                    <span className="text-muted-foreground shrink-0">{a.status}{a.price ? ` · ${fmtMoney(Number(a.price))}` : ""}</span>
                  </li>
                ))}
                {!selectedArtworks.length && <li className="text-muted-foreground">No artworks.</li>}
              </ul>
            </div>

            <div className="hairline-card p-5">
              <div className="eyebrow mb-3">Invoices ({selectedInvoices.length})</div>
              <ul className="space-y-2 text-sm">
                {selectedInvoices.slice(0, 12).map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span className="truncate">{i.number || "—"} · {i.buyer_name || "—"}</span>
                    <span className="text-muted-foreground shrink-0">{i.status}{i.amount ? ` · ${fmtMoney(Number(i.amount))}` : ""}</span>
                  </li>
                ))}
                {!selectedInvoices.length && <li className="text-muted-foreground">No invoices.</li>}
              </ul>
            </div>
          </div>

          <div className="hairline-card p-5">
            <div className="eyebrow mb-3">Contacts ({selectedContacts.length})</div>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {selectedContacts.slice(0, 16).map((c) => (
                <li key={c.id} className="flex justify-between gap-3">
                  <span className="truncate">{c.name}</span>
                  <span className="text-muted-foreground shrink-0">{c.type || ""}</span>
                </li>
              ))}
              {!selectedContacts.length && <li className="text-muted-foreground">No contacts.</li>}
            </ul>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default Reports;
