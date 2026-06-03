import { useMemo, useState } from "react";
import { Mail, Inbox, CheckCircle2, Instagram } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore, mockFlaggedEmails } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/StatusPill";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FlagStatus, InboxProvider } from "@/lib/types";
import { toast } from "sonner";

const FILTERS: { value: "all" | FlagStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "needs_reply", label: "Needs reply" },
  { value: "awaiting_response", label: "Awaiting response" },
  { value: "resolved", label: "Resolved" },
];

const providerLabel = (p: InboxProvider) =>
  p === "gmail" ? "Gmail" : p === "outlook" ? "Outlook" : "Instagram DMs";

const Communications = () => {
  const { inboxConnection, flaggedEmails, connectInbox, disconnectInbox, updateFlaggedEmail } = useStore();
  const [filter, setFilter] = useState<"all" | FlagStatus>("all");
  const [previewMode, setPreviewMode] = useState(false);
  const [previewEmails, setPreviewEmails] = useState(() => [] as ReturnType<typeof mockFlaggedEmails>);

  const sourceEmails = previewMode ? previewEmails : flaggedEmails;

  const list = useMemo(() => {
    const sorted = [...sourceEmails].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
    return filter === "all" ? sorted : sorted.filter(e => e.status === filter);
  }, [sourceEmails, filter]);

  const connect = (provider: InboxProvider) => {
    connectInbox({
      provider,
      email:
        provider === "gmail" ? "studio@gmail.com" :
        provider === "outlook" ? "studio@outlook.com" :
        "@studio",
      connectedAt: new Date().toISOString(),
    });
    toast.success(`Connected to ${providerLabel(provider)}`, {
      description: "Demo mode — sample flagged correspondence loaded.",
    });
  };

  const startPreview = () => {
    setPreviewEmails(mockFlaggedEmails());
    setPreviewMode(true);
    toast.message("Preview mode", { description: "Showing sample flagged messages. No inbox connected." });
  };

  const exitPreview = () => {
    setPreviewMode(false);
    setPreviewEmails([]);
  };

  const updatePreviewEmail = (id: string, patch: Partial<typeof previewEmails[number]>) => {
    setPreviewEmails(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  };

  const showList = !!inboxConnection || previewMode;
  const updateEmail = previewMode ? updatePreviewEmail : updateFlaggedEmail;

  return (
    <AppShell
      eyebrow="Module · Communications Hub"
      title="An email triage layer, not another inbox."
      description="A signal layer, not another inbox. Allegory surfaces the emails and messages that actually need your attention — inquiries, leads, deadlines, and opportunities — and leaves everything else alone."
      actions={
        inboxConnection ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: "hsl(var(--success))" }} />
              Connected: {providerLabel(inboxConnection.provider)} · {inboxConnection.email}
            </span>
            <Button size="sm" variant="ghost" onClick={() => { disconnectInbox(); toast.message("Disconnected"); }}>
              Disconnect
            </Button>
          </div>
        ) : previewMode ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground italic">
              Preview mode — sample data
            </span>
            <Button size="sm" variant="ghost" onClick={exitPreview}>Exit preview</Button>
          </div>
        ) : null
      }
    >
      {!showList ? (
        <ConnectPanel onConnect={connect} onPreview={startPreview} />
      ) : (
        <>
          <div className="flex items-center gap-1 mb-6 flex-wrap">
            {FILTERS.map(f => {
              const count = f.value === "all" ? sourceEmails.length : sourceEmails.filter(e => e.status === f.value).length;
              const active = filter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`text-xs px-3 py-1.5 border-b-2 transition-colors ${
                    active ? "border-foreground text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                  <span className="ml-1.5 text-[10px] tabular-nums opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          {list.length === 0 ? (
            <div className="hairline-card p-12 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto text-muted-foreground mb-4" strokeWidth={1.2} />
              <p className="text-sm text-muted-foreground">No flagged correspondence right now. You're all caught up.</p>
            </div>
          ) : (
            <div className="hairline-card divide-y divide-border">
              {list.map(e => (
                <div key={e.id} className="p-5 flex items-start gap-4 group hover:bg-surface/40">
                  <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium shrink-0">
                    {e.sender.split(/\s+/).map(s => s[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <span className="font-medium text-sm">{e.sender}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{e.senderEmail}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {new Date(e.receivedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="font-display text-base mt-0.5 truncate">{e.subject}</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{e.preview}</p>

                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <Select
                        value={e.status}
                        onValueChange={(v: FlagStatus) => updateEmail(e.id, { status: v })}
                      >
                        <SelectTrigger className="h-7 w-44 text-xs border-0 bg-transparent p-0 hover:bg-surface px-2">
                          <StatusPill status={e.status} />
                        </SelectTrigger>
                        <SelectContent>
                          {(["needs_reply", "awaiting_response", "fyi", "resolved"] as FlagStatus[]).map(s => (
                            <SelectItem key={s} value={s}><StatusPill status={s} /></SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {e.status !== "resolved" && (
                        <button
                          onClick={() => { updateEmail(e.id, { status: "resolved" }); toast.success("Marked resolved"); }}
                          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Mark resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
};

function ConnectPanel({ onConnect, onPreview }: { onConnect: (p: InboxProvider) => void; onPreview: () => void }) {
  return (
    <div className="hairline-card p-10 max-w-2xl mx-auto text-center">
      <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-5" strokeWidth={1.2} />
      <h3 className="font-display text-2xl mb-3">Connect your inbox</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-7 leading-relaxed">
        Connect your email or Instagram DMs and Allegory Studio will flag the messages that matter — inquiries, leads, open calls, and anything with a deadline — without replacing your existing workflow.
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Button onClick={() => onConnect("gmail")} className="gap-2">
          <Mail className="h-4 w-4" /> Connect Gmail
        </Button>
        <Button onClick={() => onConnect("outlook")} variant="outline" className="gap-2">
          <Mail className="h-4 w-4" /> Connect Outlook
        </Button>
        <Button onClick={() => onConnect("instagram")} variant="outline" className="gap-2">
          <Instagram className="h-4 w-4" /> Connect Instagram DMs
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground mt-6 italic max-w-md mx-auto">
        Instagram DMs require a connected Facebook Business account and Instagram Professional account. Gmail and Outlook OAuth will be wired in a later release.
      </p>
      <div className="mt-4">
        <button onClick={onPreview} className="text-xs text-muted-foreground underline hover:text-foreground">
          Preview demo
        </button>
      </div>
    </div>
  );
}

export default Communications;
