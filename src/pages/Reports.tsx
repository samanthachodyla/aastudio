import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useIsAdmin, fetchAdminDataset, type AdminDataset } from "@/lib/admin";
import { fmtMoney } from "@/lib/store";
import { labelForPath } from "@/lib/labels";
import { BETA_ALL_PRO } from "@/lib/tier";

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
  lastActive: string | null;
  pageViews: number;
  activeMinutes: number;
  artworks: number;
  invoices: number;
  contacts: number;
  opportunities: number;
  age: number | null;
  zip: string | null;
  desiredFeature: string | null;
  timeByPath: PathTime[];
}

const fmtMinutes = (m: number) => {
  if (m <= 0) return "—";
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h ? `${h}h ${min}m` : `${min}m`;
};

const fmtWhen = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Never";

const tierLabel = (tier: string) => (BETA_ALL_PRO ? "Pro · beta" : tier === "pro" ? "Pro" : "Starter");

const Reports = () => {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [data, setData] = useState<AdminDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

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

        return {
          id: p.id,
          name: p.full_name || "—",
          email: p.email || "—",
          isAdmin: p.is_admin,
          tier: p.tier || "starter",
          lastActive: p.last_seen_at || lastFromUsage,
          pageViews: views.length,
          activeMinutes: heartbeats.length,
          artworks: (artBy.get(p.id) ?? []).length,
          invoices: (invBy.get(p.id) ?? []).length,
          contacts: (conBy.get(p.id) ?? []).length,
          opportunities: (oppBy.get(p.id) ?? []).length,
          age: p.age ?? null,
          zip: p.zip_code ?? null,
          desiredFeature: p.desired_feature ?? null,
          timeByPath,
        };
      })
      .sort((a, b) => (b.lastActive ?? "").localeCompare(a.lastActive ?? ""));
  }, [data]);

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
      if (!r.desiredFeature) continue;
      m.set(r.desiredFeature, (m.get(r.desiredFeature) ?? 0) + 1);
    }
    return [...m.entries()].map(([feature, count]) => ({ feature, count })).sort((a, b) => b.count - a.count);
  }, [rows]);

  const maxGlobalMinutes = globalTimeByPath[0]?.minutes ?? 0;
  const maxFeatureCount = featureCounts[0]?.count ?? 0;

  const selectedUser = rows.find((r) => r.id === selected) || null;
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
    responses: rows.filter((r) => r.desiredFeature).length,
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
      <div className="hairline-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="font-normal eyebrow px-4 py-3">Member</th>
              <th className="font-normal eyebrow px-4 py-3">Last active</th>
              <th className="font-normal eyebrow px-4 py-3 text-right">Page views</th>
              <th className="font-normal eyebrow px-4 py-3 text-right">Active time</th>
              <th className="font-normal eyebrow px-4 py-3 text-right">Artworks</th>
              <th className="font-normal eyebrow px-4 py-3 text-right">Invoices</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
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
                <td className="px-4 py-3 text-muted-foreground">{fmtWhen(r.lastActive)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{r.pageViews}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtMinutes(r.activeMinutes)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{r.artworks}</td>
                <td className="px-4 py-3 text-right tabular-nums">{r.invoices}</td>
              </tr>
            ))}
            {!rows.length && !error && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading members…</td></tr>
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
              {selectedUser.email} · Studio {tierLabel(selectedUser.tier)} ·{" "}
              {selectedUser.opportunities} opportunities · {selectedUser.contacts} contacts
            </p>
          </div>

          {/* Survey responses */}
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
                <div className="text-xs text-muted-foreground mb-0.5">Most-wanted feature</div>
                <div>{selectedUser.desiredFeature ?? "—"}</div>
              </div>
            </div>
          </div>

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
