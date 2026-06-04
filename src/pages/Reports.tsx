import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useIsAdmin, fetchAdminDataset, type AdminDataset } from "@/lib/admin";
import { fmtMoney, fmtDate } from "@/lib/store";

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
  sales: number;
  topPaths: { path: string; count: number }[];
}

const fmtMinutes = (m: number) => {
  if (m <= 0) return "—";
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h ? `${h}h ${min}m` : `${min}m`;
};

const fmtWhen = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Never";

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
        const heartbeats = usage.filter((e) => e.event_type === "heartbeat").length;
        const lastFromUsage = usage.reduce<string | null>(
          (m, e) => (!m || e.occurred_at > m ? e.occurred_at : m),
          null
        );
        const pathCounts = new Map<string, number>();
        for (const v of views) {
          const key = v.path ?? "—";
          pathCounts.set(key, (pathCounts.get(key) ?? 0) + 1);
        }
        const topPaths = [...pathCounts.entries()]
          .map(([path, count]) => ({ path, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 4);
        const invoices = invBy.get(p.id) ?? [];
        const sales = invoices
          .filter((i) => i.status === "paid")
          .reduce((s, i) => s + (Number(i.amount) || 0), 0);

        return {
          id: p.id,
          name: p.full_name || "—",
          email: p.email || "—",
          isAdmin: p.is_admin,
          tier: p.tier || "starter",
          lastActive: p.last_seen_at || lastFromUsage,
          pageViews: views.length,
          activeMinutes: heartbeats,
          artworks: (artBy.get(p.id) ?? []).length,
          invoices: invoices.length,
          contacts: (conBy.get(p.id) ?? []).length,
          opportunities: (oppBy.get(p.id) ?? []).length,
          sales,
          topPaths,
        };
      })
      .sort((a, b) => (b.lastActive ?? "").localeCompare(a.lastActive ?? ""));
  }, [data]);

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
    sales: rows.reduce((s, r) => s + r.sales, 0),
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
          { label: "Total sales", value: fmtMoney(totals.sales) },
        ].map((t) => (
          <div key={t.label} className="hairline-card p-5">
            <div className="eyebrow mb-1">{t.label}</div>
            <div className="font-display text-3xl tracking-tight">{t.value}</div>
          </div>
        ))}
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
              <th className="font-normal eyebrow px-4 py-3 text-right">Sales</th>
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
                <td className="px-4 py-3 text-right tabular-nums">{r.sales ? fmtMoney(r.sales) : "—"}</td>
              </tr>
            ))}
            {!rows.length && !error && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading members…</td></tr>
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
              {selectedUser.email} · Studio {selectedUser.tier === "pro" ? "Pro" : "Starter"} ·{" "}
              {selectedUser.opportunities} opportunities · {selectedUser.contacts} contacts
            </p>
          </div>

          {selectedUser.topPaths.length > 0 && (
            <div className="hairline-card p-5">
              <div className="eyebrow mb-3">Most-visited sections</div>
              <div className="flex flex-wrap gap-2">
                {selectedUser.topPaths.map((p) => (
                  <span key={p.path} className="text-xs border border-border rounded-sm px-2 py-1">
                    {p.path === "/" ? "Today" : p.path} · {p.count}
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
