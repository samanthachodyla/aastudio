import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, AlertCircle, Clock, DollarSign, Boxes, Inbox, Megaphone, CalendarClock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore, fmtMoney, fmtDate, daysUntil, daysSince } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/StatusPill";
import { StudioManagerBubble } from "@/components/StudioManagerBubble";
import { DashboardTodos } from "@/components/DashboardTodos";
import { useUserProfile, getFirstName } from "@/lib/userProfile";
import { useSubscription } from "@/lib/subscription";
import { toast } from "sonner";

const Dashboard = () => {
  const { artworks, invoices, opportunities, flaggedEmails, scheduledPosts, contentIdeas, leads, contacts, expenses } = useStore();
  const { fullName, welcomeDismissed, dismissWelcome } = useUserProfile();
  const firstName = getFirstName(fullName);
  const refetchSubscription = useSubscription((s) => s.fetch);

  // Returning from a successful Stripe Checkout — confirm and refresh access.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      window.history.replaceState({}, "", "/dashboard");
      toast.success("You're all set — welcome to Allegory Studio. ✦");
      refetchSubscription();
    }
  }, [refetchSubscription]);

  const checkin = useMemo(() => {
    const items: { tone: "alert" | "info" | "muted"; icon: any; text: string; cta?: { to: string; label: string } }[] = [];
    const upcoming = opportunities.filter(o => {
      const d = daysUntil(o.deadline);
      return d >= 0 && d <= 7 && !["accepted", "declined", "withdrawn"].includes(o.status);
    });
    if (upcoming.length) items.push({
      tone: "alert", icon: Clock,
      text: `${upcoming.length} deadline${upcoming.length > 1 ? "s" : ""} within the next 7 days.`,
      cta: { to: "/exhibitions", label: "Review" },
    });

    const overdueInv = invoices.filter(i => i.status === "overdue");
    const unpaid = invoices.filter(i => i.status === "sent");
    if (overdueInv.length) items.push({
      tone: "alert", icon: AlertCircle,
      text: `${overdueInv.length} overdue invoice${overdueInv.length > 1 ? "s" : ""} — ${fmtMoney(overdueInv.reduce((s, i) => s + i.amount, 0))} outstanding.`,
      cta: { to: "/sales", label: "Send reminder" },
    });
    if (unpaid.length) items.push({
      tone: "info", icon: DollarSign,
      text: `${unpaid.length} unpaid invoice${unpaid.length > 1 ? "s" : ""} awaiting payment.`,
      cta: { to: "/sales", label: "Open" },
    });




    const overdueFollowups = contacts.filter(c => c.followUpAt && daysUntil(c.followUpAt) <= 0);
    if (overdueFollowups.length) items.push({
      tone: "alert", icon: AlertCircle,
      text: `${overdueFollowups.length} contact${overdueFollowups.length > 1 ? "s" : ""} to reach out to today.`,
      cta: { to: "/contacts", label: "Open" },
    });

    const needsReply = flaggedEmails.filter(e => e.status === "needs_reply");
    if (needsReply.length) items.push({
      tone: "alert", icon: Inbox,
      text: `${needsReply.length} flagged email${needsReply.length > 1 ? "s" : ""} awaiting your reply.`,
      cta: { to: "/communications", label: "Triage" },
    });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAhead = new Date(today); weekAhead.setDate(weekAhead.getDate() + 7);
    const postsSoon = scheduledPosts.filter(p => {
      const d = new Date(p.date);
      return p.status === "scheduled" && d >= today && d <= weekAhead;
    });
    if (postsSoon.length) items.push({
      tone: "info", icon: Megaphone,
      text: `${postsSoon.length} post${postsSoon.length > 1 ? "s" : ""} scheduled this week.`,
      cta: { to: "/marketing", label: "Review" },
    });

    const ideasInFlight = contentIdeas.filter(i => i.status === "idea" || i.status === "in_progress").length;
    if (!postsSoon.length && ideasInFlight === 0 && scheduledPosts.length === 0) items.push({
      tone: "muted", icon: Megaphone,
      text: "No content in motion. Consider drafting a post or idea.",
      cta: { to: "/marketing", label: "Open" },
    });

    if (!items.length) items.push({
      tone: "muted", icon: Clock,
      text: firstName ? `Nothing urgent today, ${firstName}. A good day to make work.` : "Nothing urgent today. A good day to make work.",
    });

    // Always-visible financial snapshot for the current month
    const now = new Date();
    const sameMonth = (iso?: string) => {
      if (!iso) return false;
      const d = new Date(iso);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };
    const gross = invoices
      .filter(i => i.status === "paid" && sameMonth(i.paidAt))
      .reduce((s, i) => s + i.amount, 0);
    const spent = expenses
      .filter(e => sameMonth(e.date))
      .reduce((s, e) => s + e.amount, 0);
    const net = gross - spent;
    const financialText = gross === 0 && spent === 0
      ? "No financial activity logged this month."
      : `${fmtMoney(gross)} earned · ${fmtMoney(spent)} in expenses · ${fmtMoney(net)} net this month.`;
    items.push({ tone: "muted", icon: DollarSign, text: financialText });

    return items;
  }, [opportunities, invoices, flaggedEmails, scheduledPosts, contentIdeas, contacts, expenses, firstName]);

  const stats = useMemo(() => {
    const inStudio = artworks.filter(a => a.status === "in_studio").length;
    const ytdRev = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
    const outstanding = invoices.filter(i => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0);
    const openLeads = leads.filter(l => l.status !== "won" && l.status !== "lost").length;
    const nurture = contacts.filter(c => c.followUpAt && daysUntil(c.followUpAt) <= 7).length;
    return [
      { label: "Works in studio", value: inStudio, sub: `of ${artworks.length} total`, to: "/inventory" },
      { label: "Revenue (paid)", value: fmtMoney(ytdRev), sub: "this period", to: "/sales" },
      { label: "Outstanding", value: fmtMoney(outstanding), sub: "awaiting payment", to: "/sales" },
      { label: "Leads — to follow up with", value: openLeads, sub: openLeads === 1 ? "active conversation" : "active conversations", to: "/contacts" },
      { label: "Contacts to nurture", value: nurture, sub: "due within 7 days", to: "/contacts" },
    ];
  }, [artworks, invoices, leads, contacts]);

  const upcomingDeadlines = [...opportunities]
    .filter(o => daysUntil(o.deadline) >= -3 && !["accepted", "declined", "withdrawn"].includes(o.status))
    .sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline))
    .slice(0, 4);

  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const eyebrow = firstName
    ? `Daily check-in · ${firstName}'s studio · ${dateStr}`
    : `Daily check-in · ${dateStr}`;
  const showWelcome = !!firstName && !welcomeDismissed;

  return (
    <AppShell
      eyebrow={eyebrow}
      title="Today, in the studio."
      description="Quiet observations from across your practice — what needs your attention before you get back to the work."
    >
      {showWelcome && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center cursor-pointer"
          onClick={dismissWelcome}
        >
          <div className="text-center px-6">
            <h2 className="font-display text-3xl mb-3">Welcome to Allegory Studio, {firstName}.</h2>
            <p className="text-sm text-muted-foreground mb-6">Your studio is ready. Let's get to work.</p>
            <Button onClick={dismissWelcome}>Take me in.</Button>
          </div>
        </div>
      )}
      {/* Check-in panel */}
      <section className="mb-12">
        <div className="hairline-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="eyebrow">The morning brief</div>
            <span className="text-[11px] text-muted-foreground italic font-display">
              advisory, not just organized
            </span>
          </div>
          <ul className="divide-y divide-border">
            {checkin.map((item, i) => (
              <li key={i} className="px-6 py-5 flex items-center gap-5">
                <item.icon
                  className={`h-4 w-4 shrink-0 ${item.tone === "alert" ? "text-destructive" : "text-muted-foreground"}`}
                  strokeWidth={1.5}
                />
                <p className="flex-1 text-[15px] leading-snug">{item.text}</p>
                {item.cta && (
                  <Button asChild variant="ghost" size="sm" className="text-xs uppercase tracking-wider gap-1">
                    <Link to={item.cta.to}>{item.cta.label} <ArrowUpRight className="h-3 w-3" /></Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* To-do */}
      <DashboardTodos />

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-border mb-12 border border-border">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="bg-background p-6 hover:bg-surface/40 transition-colors">
            <div className="eyebrow mb-3">{s.label}</div>
            <div className="font-display text-3xl">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
          </Link>
        ))}
      </section>

      {/* Two column: deadlines + recent works */}
      <section className="grid md:grid-cols-2 gap-10">
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-2xl">On the horizon</h2>
            <Link to="/exhibitions" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">
              All deadlines →
            </Link>
          </div>
          <div className="rule mb-2" />
          <ul className="divide-y divide-border">
            {upcomingDeadlines.length === 0 && (
              <li className="py-6 text-sm text-muted-foreground italic">No upcoming deadlines.</li>
            )}
            {upcomingDeadlines.map(o => {
              const d = daysUntil(o.deadline);
              return (
                <li key={o.id} className="py-4 flex items-center gap-4">
                  <div className="font-display text-3xl tabular-nums w-12 text-right">
                    {d < 0 ? "!" : d}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{o.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.organization} · {fmtDate(o.deadline)}
                    </div>
                  </div>
                  <StatusPill status={o.status} />
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-2xl">In motion</h2>
            <Link to="/communications" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">
              Communications →
            </Link>
          </div>
          <div className="rule mb-2" />
          {(() => {
            const flagged = flaggedEmails
              .filter(e => e.status === "needs_reply" || e.status === "awaiting_response")
              .slice(0, 2);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const posts = [...scheduledPosts]
              .filter(p => p.status === "scheduled" && new Date(p.date) >= today)
              .sort((a, b) => +new Date(a.date) - +new Date(b.date))
              .slice(0, 2);

            if (flagged.length === 0 && posts.length === 0) {
              return (
                <div className="py-6 text-sm text-muted-foreground italic">
                  Nothing in motion. Connect your inbox or schedule a post to see signals here.
                </div>
              );
            }
            return (
              <ul className="divide-y divide-border">
                {flagged.map(e => (
                  <li key={e.id} className="py-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface rounded-sm shrink-0 flex items-center justify-center text-muted-foreground">
                      <Inbox className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{e.subject}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {e.sender} · {fmtDate(e.receivedAt)}
                      </div>
                    </div>
                    <StatusPill status={e.status} />
                  </li>
                ))}
                {posts.map(p => (
                  <li key={p.id} className="py-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface rounded-sm shrink-0 flex items-center justify-center text-muted-foreground">
                      <CalendarClock className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{p.content}</div>
                      <div className="text-xs text-muted-foreground truncate capitalize">
                        {p.platform} · {fmtDate(p.date)}
                      </div>
                    </div>
                    <StatusPill status={p.status} />
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>
      </section>
      <StudioManagerBubble />
    </AppShell>
  );
};

export default Dashboard;
