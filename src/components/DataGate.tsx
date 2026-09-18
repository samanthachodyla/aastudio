import { ReactNode, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { setActiveUserId, importLocalDataIfNeeded, loadAllForUser, overlayOutbox, replayOutbox, migrateLocalTodos } from "@/lib/sync";
import { Button } from "@/components/ui/button";
import { SyncStatusBanner } from "@/components/SyncStatusBanner";

// Supabase/PostgREST errors are plain objects (not Error instances), so pull the
// real message out of whatever shape we're handed — otherwise the screen just
// says the generic fallback and hides the actual cause.
function errMessage(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (m) return String(m);
  }
  return "Failed to load your studio";
}

/**
 * Once a user is authenticated, loads their studio data from Supabase into the
 * store (running the one-time localStorage import first), and gates rendering
 * until that's done so pages never flash empty.
 */
export function DataGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const hydrated = useStore((s) => s.hydrated);
  const hydrateAll = useStore((s) => s.hydrateAll);
  const resetHydrated = useStore((s) => s.resetHydrated);
  const [error, setError] = useState<string | null>(null);
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      loadedFor.current = null;
      return;
    }
    if (loadedFor.current === user.id) return;
    loadedFor.current = user.id;

    setActiveUserId(user.id);
    resetHydrated();
    setError(null);

    (async () => {
      try {
        await importLocalDataIfNeeded(user.id);
        await migrateLocalTodos(user.id);
        const data = await loadAllForUser(user.id);
        // Merge any writes that never reached the server so nothing looks lost,
        // then retry them in the background.
        overlayOutbox(user.id, data.collections);
        hydrateAll(data);
        void replayOutbox(user.id);
      } catch (e) {
        console.error("[DataGate] hydration failed", e);
        setError(errMessage(e));
        loadedFor.current = null; // allow a retry
      }
    })();
  }, [user, hydrateAll, resetHydrated]);

  // Keep devices in sync automatically: when the member returns to the tab (or
  // refocuses the window) after a short gap, quietly reload their data from the
  // server. This is what makes a change made on a studio desktop appear on a home
  // laptop without any manual refresh. It never blanks the screen (no loading
  // gate), and unsynced local writes are preserved by overlayOutbox.
  useEffect(() => {
    if (!user) return;
    let last = Date.now();
    let running = false;
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      if (running || Date.now() - last < 20000) return; // throttle: at most every 20s
      running = true;
      last = Date.now();
      try {
        const data = await loadAllForUser(user.id);
        overlayOutbox(user.id, data.collections);
        hydrateAll(data);
        void replayOutbox(user.id);
      } catch {
        /* keep showing current data; the next focus retries */
      } finally {
        running = false;
      }
    };
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, hydrateAll]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <div className="eyebrow text-muted-foreground">Couldn't load your studio</div>
        <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
        <Button
          className="rounded-sm"
          onClick={() => {
            loadedFor.current = null;
            setError(null);
            // trigger the effect again
            resetHydrated();
            if (user) {
              setActiveUserId(user.id);
              loadedFor.current = user.id;
              importLocalDataIfNeeded(user.id)
                .then(() => migrateLocalTodos(user.id))
                .then(() => loadAllForUser(user.id))
                .then((data) => {
                  overlayOutbox(user.id, data.collections);
                  hydrateAll(data);
                  void replayOutbox(user.id);
                })
                .catch((e) => setError(errMessage(e)));
            }
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="eyebrow text-muted-foreground animate-pulse">Loading your studio…</div>
      </div>
    );
  }

  return (
    <>
      {children}
      <SyncStatusBanner />
    </>
  );
}
