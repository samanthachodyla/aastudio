import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

interface Props {
  moduleName: string;
  description: string;
  eyebrow?: string;
}

export function LockedModule({ moduleName, description, eyebrow = "Studio Pro" }: Props) {
  return (
    <AppShell title={moduleName} eyebrow={eyebrow} description={description}>
      <div className="hairline-card p-10 md:p-14 max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-6">
          <Lock className="h-5 w-5 text-primary" strokeWidth={1.5} />
        </div>
        <div className="eyebrow mb-3">Locked</div>
        <h2 className="font-display text-3xl md:text-4xl mb-4 tracking-tight">{moduleName}</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">{description}</p>
        <div className="rule mb-6 max-w-xs mx-auto" />
        <p className="text-sm mb-2 inline-flex items-center gap-2 justify-center">
          <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <span>
            Available with <span className="font-medium">Studio Pro</span> — including access to a{" "}
            <span className="font-medium">real arts administrator</span>.
          </span>
        </p>
        <p className="text-xs text-muted-foreground mb-8">
          Monthly strategy calls, priority support, and guidance on grants, exhibitions, pricing, and collector relationships.
        </p>
        <Button asChild size="lg" className="rounded-sm">
          <Link to="/pricing">Upgrade to Studio Pro — $55/month</Link>
        </Button>
      </div>
    </AppShell>
  );
}
