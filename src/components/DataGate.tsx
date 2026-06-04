import { ReactNode, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { setActiveUserId, importLocalDataIfNeeded, loadAllForUser } from "@/lib/sync";
import { Button } from "@/components/ui/button";

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
        const data = await loadAllForUser(user.id);
        hydrateAll(data);
      } catch (e) {
        console.error("[DataGate] hydration failed", e);
        setError(e instanceof Error ? e.message : "Failed to load your studio");
        loadedFor.current = null; // allow a retry
      }
    })();
  }, [user, hydrateAll, resetHydrated]);

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
                .then(() => loadAllForUser(user.id))
                .then(hydrateAll)
                .catch((e) => setError(e instanceof Error ? e.message : "Failed to load your studio"));
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

  return <>{children}</>;
}
