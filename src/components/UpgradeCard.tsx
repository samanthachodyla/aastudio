import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Props {
  title?: string;
  description: string;
  ctaLabel?: string;
  compact?: boolean;
}

export function UpgradeCard({
  title = "A Studio Pro feature",
  description,
  ctaLabel = "Upgrade to Pro — $55/mo",
  compact = false,
}: Props) {
  return (
    <div
      className={`hairline-card ${compact ? "p-5" : "p-6 md:p-8"} bg-primary/5 border-primary/20`}
    >
      <div className="flex items-start gap-4">
        <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 shrink-0">
          <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="eyebrow mb-1.5 text-primary inline-flex items-center gap-1.5">
            <Lock className="h-3 w-3" strokeWidth={1.5} /> {title}
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">{description}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="sm" className="rounded-sm">
              <Link to="/pricing">{ctaLabel}</Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="rounded-sm">
              <Link to="/pricing">Learn more</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
