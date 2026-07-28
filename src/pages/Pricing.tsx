import { useEffect, useState } from "react";
import { Check, Minus, Sparkles, Brain, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useSubscription, hasActiveAccess } from "@/lib/subscription";
import { BETA_ALL_PRO } from "@/lib/tier";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Plan = "starter" | "pro";

type Cycle = "monthly" | "annual";

const PRICES = {
  starter: { monthly: 25, annual: 20 },
  pro: { monthly: 55, annual: 44 },
};

const ANNUAL = {
  starter: { total: 240, savings: 60 },
  pro: { total: 528, savings: 132 },
};

const STARTER_FEATURES = [
  "Inventory Manager",
  "Sales & Finance",
  "Deadline & Opportunity Tracker",
  "Contacts — light CRM",
  "Finance Dashboard",
  "Daily Check-In dashboard",
  "Cancel anytime",
];

const PRO_MODULES: { label: string; emphasize?: boolean }[] = [
  { label: "Everything in Studio Starter" },
  { label: "Direct access to a professional arts administrator", emphasize: true },
  { label: "Profile Vault" },
  { label: "Communications Hub" },
  { label: "Marketing Assistant" },
  { label: "Smarter pricing, informed by your sales history" },
  { label: "Statements shaped to fit every opportunity" },
  { label: "Opportunity discovery, personalized to your practice" },
  { label: "Content suggestions and social trend insights" },
  { label: "Cancel anytime" },
];

type Cell = boolean | string;
interface CompareRow {
  label: string;
  starter: Cell;
  pro: Cell;
  highlight?: boolean;
  group?: string;
  tooltip?: string;
}

const COMPARE_ROWS: CompareRow[] = [
  { label: "Priority support", starter: false, pro: true, highlight: true },
  { label: "Inventory Manager", starter: true, pro: true },
  { label: "Sales & Finance", starter: true, pro: true },
  { label: "Deadline & Opportunity Tracker", starter: true, pro: true },
  { label: "Contacts", starter: true, pro: true },
  { label: "Finance Dashboard", starter: true, pro: true },
  { label: "Daily Check-In dashboard", starter: true, pro: true },

  { label: "Profile Vault", starter: "Lite", pro: "Full", group: "Profile Vault",
    tooltip: "Working artists juggle dozens of bio versions, statements, and image files. Pro keeps them all organized, tailored, and ready for whatever comes next." },
  { label: "Artist bio", starter: "1 version", pro: "Unlimited variants by context" },
  { label: "Artist statement", starter: "1 statement", pro: "Statement library + tailored statements" },
  { label: "CV / résumé", starter: "Basic upload & parse", pro: "Full CV builder + export" },
  { label: "Work images", starter: "Up to 10", pro: "Unlimited + full metadata" },
  { label: "Headshot", starter: "1", pro: "Library" },
  { label: "Press & Publications log", starter: false, pro: true },

  { label: "Consignments (within Inventory)", starter: "Track consigned artworks", pro: "Track consigned artworks", group: "Consignments" },
  { label: "Agreement document storage", starter: true, pro: true },
  { label: "Return & payment reminders", starter: true, pro: true },
  { label: "Sale flow with auto-split", starter: true, pro: true },
  { label: "Consignment Statements generator", starter: false, pro: true },
  { label: "Agreement Builder (PDF generator)", starter: false, pro: true,
    tooltip: "Pro generates a complete consignment agreement PDF from a simple form — no templates to track down, no formatting headaches." },

  { label: "Communications Hub", starter: false, pro: true },
  { label: "Marketing Assistant", starter: false, pro: true },
  { label: "Intelligent tools across modules", starter: false, pro: true },
];

const Pricing = () => {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [openCompare, setOpenCompare] = useState(false);
  const [busy, setBusy] = useState<Plan | null>(null);
  const { subscription, fetch: fetchSubscription } = useSubscription();

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  // Note a canceled/returned checkout so the user isn't left wondering.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "cancel") {
      window.history.replaceState({}, "", "/pricing");
      toast.message("Checkout canceled — no charge was made.");
    }
  }, []);

  // The plan the user is actively subscribed to (null during beta or if none).
  const currentPlan = !BETA_ALL_PRO && hasActiveAccess(subscription) ? subscription?.plan ?? null : null;

  const startCheckout = async (plan: Plan) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Please sign in again."); return; }
    setBusy(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan, cycle }),
      });
      const json = await res.json();
      if (json.url) { window.location.href = json.url; return; }
      toast.error(json.detail || json.error || "Couldn't start checkout. Please try again.");
    } catch {
      toast.error("Couldn't reach checkout. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const starterPrice = PRICES.starter[cycle];
  const proPrice = PRICES.pro[cycle];

  return (
    <AppShell
      title="Choose your plan"
      eyebrow="Pricing"
      description="Built for working artists. Cancel anytime."
    >
      <p className="text-sm text-muted-foreground -mt-4 mb-10">
        Pick a plan to get started. Cancel anytime · have a discount code? Add it at checkout.
      </p>

      {/* Billing toggle */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center gap-1 p-1 border border-border rounded-sm bg-card">
          {(["monthly", "annual"] as Cycle[]).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`px-4 py-1.5 text-xs uppercase tracking-[0.2em] rounded-sm transition-colors ${
                cycle === c
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Starter */}
        <div className="hairline-card p-8 flex flex-col">
          <div className="eyebrow mb-3">Studio Starter</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-display text-5xl tracking-tight">${starterPrice}</span>
            <span className="text-sm text-muted-foreground">/month</span>
            {cycle === "annual" && (
              <Badge className="ml-2 bg-accent text-accent-foreground rounded-sm text-[10px] tracking-wider">
                2 months free
              </Badge>
            )}
          </div>
          {cycle === "annual" && (
            <div className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
              <span>${ANNUAL.starter.total} billed annually —</span>
              <Badge className="bg-accent text-accent-foreground rounded-sm text-[10px] tracking-wider">
                save ${ANNUAL.starter.savings}
              </Badge>
            </div>
          )}
          <p className="text-sm text-muted-foreground italic mb-6 mt-2">
            Get organized and take control of your practice.
          </p>
          <div className="rule mb-6" />
          <ul className="space-y-3 mb-8 flex-1">
            {STARTER_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            className="rounded-sm w-full"
            disabled={currentPlan === "starter" || busy !== null}
            onClick={() => startCheckout("starter")}
          >
            {currentPlan === "starter" ? "Current plan" : busy === "starter" ? "Starting…" : "Choose Starter"}
          </Button>
        </div>

        {/* Pro */}
        <div className="hairline-card p-8 flex flex-col relative border-primary/30 bg-card">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-sm text-[10px] tracking-[0.2em] uppercase px-3 py-1">
            Most popular
          </Badge>
          <div className="eyebrow mb-3 text-primary">Studio Pro</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-display text-5xl tracking-tight">${proPrice}</span>
            <span className="text-sm text-muted-foreground">/month</span>
            {cycle === "annual" && (
              <Badge className="ml-2 bg-accent text-accent-foreground rounded-sm text-[10px] tracking-wider">
                2 months free
              </Badge>
            )}
          </div>
          {cycle === "annual" && (
            <div className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
              <span>${ANNUAL.pro.total} billed annually —</span>
              <Badge className="bg-accent text-accent-foreground rounded-sm text-[10px] tracking-wider">
                save ${ANNUAL.pro.savings}
              </Badge>
            </div>
          )}
          <p className="text-sm text-muted-foreground italic mb-6 mt-2">
            Your practice, supported by someone who understands it.
          </p>

          {/* Human layer callout */}
          <div className="border-l-2 border-primary pl-4 py-2 mb-4 bg-primary/5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <span className="text-sm font-medium">Built by a working arts administrator</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Allegory Studio was designed from the inside of the arts world — by someone who has
              worked with artists, galleries, and institutions for years. Pro subscribers get direct
              access to ask questions and get guidance when they need it.
            </p>
          </div>

          {/* Intelligent tools callout */}
          <div className="border-l-2 border-primary pl-4 py-2 mb-6 bg-primary/5">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <span className="text-sm font-medium">Tools that think ahead so you don't have to.</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pricing guidance, tailored statements, opportunity discovery, and content
              suggestions — tools that work quietly in the background so you can focus on the work.
            </p>
          </div>

          <div className="rule mb-6" />
          <ul className="space-y-3 mb-8 flex-1">
            {PRO_MODULES.map((f) => (
              <li key={f.label} className="flex items-start gap-3 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
                <span className={f.emphasize ? "font-medium" : undefined}>{f.label}</span>
              </li>
            ))}
          </ul>
          <Button
            className="rounded-sm w-full"
            disabled={currentPlan === "pro" || busy !== null}
            onClick={() => startCheckout("pro")}
          >
            {currentPlan === "pro" ? "Current plan" : busy === "pro" ? "Starting…" : "Choose Pro"}
          </Button>
        </div>
      </div>

      {/* Compare all features */}
      <div className="max-w-4xl mx-auto mt-12">
        <Collapsible open={openCompare} onOpenChange={setOpenCompare}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm hover:text-primary transition-colors mx-auto">
            <span className="eyebrow">Compare all features</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${openCompare ? "rotate-180" : ""}`}
              strokeWidth={1.5}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-6">
            <div className="hairline-card overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_1fr] border-b border-border bg-muted/40">
                <div className="px-4 py-3 eyebrow">Feature</div>
                <div className="px-4 py-3 eyebrow text-center">Starter</div>
                <div className="px-4 py-3 eyebrow text-center text-primary">Pro</div>
              </div>
              {COMPARE_ROWS.map((row, i) => {
                const renderCell = (val: Cell, isPro: boolean) => {
                  if (typeof val === "string") {
                    return <span className={`text-xs text-center ${isPro ? "text-foreground" : "text-muted-foreground"}`}>{val}</span>;
                  }
                  return val ? (
                    <Check className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  ) : (
                    <Minus className="h-4 w-4 opacity-40" strokeWidth={1.5} />
                  );
                };
                const isGroup = !!row.group;
                return (
                  <div
                    key={row.label + i}
                    className={`grid grid-cols-[2fr_1fr_1fr] text-sm ${
                      i !== COMPARE_ROWS.length - 1 ? "border-b border-border" : ""
                    } ${row.highlight ? "bg-primary/5" : ""} ${isGroup ? "bg-muted/30" : ""}`}
                    title={row.tooltip}
                  >
                    <div className={`px-4 py-3 ${row.highlight || isGroup ? "font-medium" : ""}`}>
                      {row.label}
                      {row.tooltip && <span className="ml-1.5 text-[10px] uppercase tracking-wider text-primary/70">ⓘ</span>}
                    </div>
                    <div className="px-4 py-3 flex justify-center text-muted-foreground">
                      {renderCell(row.starter, false)}
                    </div>
                    <div className="px-4 py-3 flex justify-center">
                      {renderCell(row.pro, true)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </AppShell>
  );
};

export default Pricing;
