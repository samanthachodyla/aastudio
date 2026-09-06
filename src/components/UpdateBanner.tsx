import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { BUILD_ID, onUpdateAvailable, startVersionWatcher } from "@/lib/appVersion";
import { getActiveUserId } from "@/lib/sync";
import { pendingCount } from "@/lib/outbox";

// Remembers which version we last reloaded *for*, so a page that comes back on
// stale HTML (e.g. a CDN edge still serving the old shell) can't reload-storm:
// we auto-reload for a given target at most once.
const RELOAD_GUARD_KEY = "allegory.reloadedForVersion";

/**
 * Watches for a newer deployed build and gets the user onto it — so a fix we
 * ship actually reaches people instead of sitting behind a tab that's been open
 * for days running old code.
 *
 * Two safe paths onto the new version:
 *  - a one-tap "Refresh" pill (always available), and
 *  - a silent auto-refresh the moment a backgrounded tab is brought back to the
 *    foreground — but only when it's safe: nothing is mid-typing and no writes
 *    are still saving. A per-version guard prevents any reload loop.
 */
export function UpdateBanner() {
  const [remote, setRemote] = useState<string | null>(null);

  useEffect(() => {
    startVersionWatcher();
    return onUpdateAvailable((r) => setRemote(r));
  }, []);

  const reloadNow = () => {
    if (!remote) return;
    try { sessionStorage.setItem(RELOAD_GUARD_KEY, remote); } catch { /* ignore */ }
    window.location.reload();
  };

  useEffect(() => {
    if (!remote || remote === BUILD_ID) return;

    // If we already reloaded targeting this exact version and we're STILL not on
    // it, don't auto-reload again — leave the manual pill and stop there.
    let alreadyTried = false;
    try { alreadyTried = sessionStorage.getItem(RELOAD_GUARD_KEY) === remote; } catch { /* ignore */ }
    if (alreadyTried) return;

    const safeToAutoReload = () => {
      if (pendingCount(getActiveUserId()) > 0) return false; // never drop unsynced work
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return false; // don't interrupt typing
      return true;
    };

    const onVisible = () => {
      if (document.visibilityState === "visible" && safeToAutoReload()) reloadNow();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote]);

  if (!remote || remote === BUILD_ID) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] max-w-[92vw]">
      <button
        onClick={reloadNow}
        className="flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-900 shadow-lg hover:bg-emerald-100"
      >
        <RefreshCw className="h-4 w-4 shrink-0" />
        A new version is available — Refresh
      </button>
    </div>
  );
}
