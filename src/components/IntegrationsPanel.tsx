import { useEffect, useState } from "react";
import { Check, ChevronDown, Link2, Loader2, Plug, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type ProviderId = "quickbooks" | "wave" | "squarespace";

interface Provider {
  id: ProviderId;
  name: string;
  blurb: string;
  status: "supported" | "limited";
  note?: string;
}

const PROVIDERS: Provider[] = [
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    blurb: "Two-way sync of invoices, customers and payments.",
    status: "supported",
  },
  {
    id: "wave",
    name: "Wave",
    blurb: "Import paid invoices and customer records.",
    status: "limited",
    note: "Wave closed its public API to new apps in 2024 — CSV import is the supported path.",
  },
  {
    id: "squarespace",
    name: "Squarespace Invoicing",
    blurb: "Pull invoice and order history from your Squarespace store.",
    status: "limited",
    note: "No public invoicing API — orders sync via Commerce API; invoices via CSV.",
  },
];

interface Connection {
  connected: boolean;
  account?: string;
  lastSync?: string;
}

type ConnectionsMap = Record<ProviderId, Connection>;

const STORAGE_KEY = "allegory-integrations-v1";

const empty: ConnectionsMap = {
  quickbooks: { connected: false },
  wave: { connected: false },
  squarespace: { connected: false },
};

function load(): ConnectionsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

function save(c: ConnectionsMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}

export function IntegrationsPanel() {
  const [conns, setConns] = useState<ConnectionsMap>(empty);
  const [busy, setBusy] = useState<ProviderId | null>(null);

  useEffect(() => {
    setConns(load());
  }, []);

  const update = (id: ProviderId, patch: Partial<Connection>) => {
    setConns((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      save(next);
      return next;
    });
  };

  const connect = async (p: Provider) => {
    setBusy(p.id);
    // Mock OAuth handshake delay
    await new Promise((r) => setTimeout(r, 900));
    update(p.id, {
      connected: true,
      account: `studio@${p.id}.demo`,
      lastSync: new Date().toISOString(),
    });
    setBusy(null);
    toast.success(`${p.name} connected`, {
      description: "Demo connection — no data is being exchanged yet.",
    });
  };

  const disconnect = (p: Provider) => {
    update(p.id, { connected: false, account: undefined, lastSync: undefined });
    toast.message(`${p.name} disconnected`);
  };

  const sync = async (p: Provider) => {
    setBusy(p.id);
    await new Promise((r) => setTimeout(r, 700));
    update(p.id, { lastSync: new Date().toISOString() });
    setBusy(null);
    toast.success(`${p.name} synced`);
  };

  const connectedCount = Object.values(conns).filter((c) => c.connected).length;

  return (
    <section className="hairline-card p-6 mb-10">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="eyebrow mb-2">Integrations</div>
          <h3 className="font-display text-xl font-normal">Invoicing platforms</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-lg">
            Sync invoices and payments two ways.{" "}
            {connectedCount > 0
              ? `${connectedCount} connected.`
              : "Scaffold only — no data is exchanged yet."}
          </p>
        </div>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2 h-9">
              <Plug className="h-3.5 w-3.5" /> Manage integrations
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 max-h-[70vh] overflow-y-auto">
            <DropdownMenuLabel className="px-3 py-2 eyebrow">Available platforms</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PROVIDERS.map((p, i) => {
              const c = conns[p.id];
              const isBusy = busy === p.id;
              return (
                <div key={p.id}>
                  {i > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="flex flex-col items-stretch gap-2 p-3 focus:bg-transparent cursor-default"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{p.name}</span>
                          {c.connected && (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider">
                              <Check className="h-3 w-3" /> On
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                          {p.status === "supported" ? "OAuth ready" : "Limited / CSV"}
                        </div>
                      </div>
                      {c.connected ? (
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => sync(p)}
                            disabled={isBusy}
                          >
                            {isBusy ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            Sync
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => disconnect(p)}
                            disabled={isBusy}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 shrink-0"
                          onClick={() => connect(p)}
                          disabled={isBusy}
                        >
                          {isBusy ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Link2 className="h-3 w-3" />
                          )}
                          Connect
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.blurb}</p>
                    {p.note && (
                      <p className="text-[11px] italic text-muted-foreground border-l-2 border-border pl-2">
                        {p.note}
                      </p>
                    )}
                    {c.connected && c.lastSync && (
                      <div className="text-[11px] text-muted-foreground">
                        {c.account} · synced{" "}
                        {new Date(c.lastSync).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </DropdownMenuItem>
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </section>
  );
}
