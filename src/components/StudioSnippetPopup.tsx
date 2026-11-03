import { useEffect, useMemo, useState } from "react";
import { Lightbulb } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { snippetForToday } from "@/lib/studioSnippets";

// Show the daily snippet once per calendar day (per device). Stored as a plain
// date string so a new day re-opens it, the same day does not.
const SEEN_KEY = "allegory.snippet.seen.v1";
const todayKey = () => new Date().toISOString().slice(0, 10);

// Brand accent colors (kept inline, these aren't app theme tokens).
const BAR = ["#7a98d3", "#e27a55", "#cfc581", "#e2ad44", "#efd2c4", "#522513"];
const MARIGOLD = "#e2ad44";

/**
 * The daily "Studio snippet" as a small branded popup (was a dashboard section).
 * Opens once a day on the dashboard, with a brand accent bar and a marigold paint
 * splatter. `enabled` lets the dashboard hold it back while the welcome overlay
 * is up, so two things never pop at once.
 */
export function StudioSnippetPopup({ enabled = true }: { enabled?: boolean }) {
  const snippet = useMemo(() => snippetForToday(), []);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let seen = "";
    try { seen = localStorage.getItem(SEEN_KEY) || ""; } catch { /* ignore */ }
    if (seen === todayKey()) return;
    const t = window.setTimeout(() => setOpen(true), 450);
    return () => window.clearTimeout(t);
  }, [enabled]);

  const dismiss = () => {
    setOpen(false);
    try { localStorage.setItem(SEEN_KEY, todayKey()); } catch { /* ignore */ }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        {/* Brand accent bar */}
        <div className="flex h-1.5 w-full">
          {BAR.map((c) => <i key={c} className="flex-1" style={{ background: c }} />)}
        </div>
        <div className="relative overflow-hidden px-7 pb-7 pt-5">
          {/* Paint splatter */}
          <svg
            aria-hidden="true"
            viewBox="0 0 120 120"
            className="pointer-events-none absolute -right-6 -top-5 h-36 w-36 opacity-40"
            style={{ color: MARIGOLD }}
          >
            <g fill="currentColor">
              <path d="M58 20c14-4 30 6 31 20 1 10-6 16-2 26 3 8 12 13 9 23-3 11-18 14-29 11-9-2-14-10-24-11-11-1-22-7-21-19 1-10 12-13 17-22 5-9 4-24 19-28z" />
              <circle cx="96" cy="30" r="6" />
              <circle cx="104" cy="48" r="3.5" />
              <circle cx="22" cy="40" r="4.5" />
              <circle cx="30" cy="96" r="5" />
              <circle cx="92" cy="96" r="4" />
              <circle cx="14" cy="70" r="3" />
              <ellipse cx="100" cy="70" rx="3" ry="6" />
            </g>
          </svg>

          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="sr-only">Studio snippet</DialogTitle>
            </DialogHeader>
            <div className="mb-3 flex items-center gap-2">
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                style={{ background: "rgba(226,173,68,0.2)", color: "#8a6a1f" }}
              >
                <Lightbulb className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: "#c35b38" }}
              >
                Studio snippet · {snippet.category}
              </span>
            </div>
            <p className="font-display text-xl leading-relaxed text-foreground">{snippet.tip}</p>
            <div className="mt-6 flex justify-end">
              <Button onClick={dismiss}>Thanks, got it</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
