import { useEffect, useState } from "react";
import { CloudOff, Loader2 } from "lucide-react";
import { getActiveUserId, replayOutbox } from "@/lib/sync";
import { pendingCount } from "@/lib/outbox";

/**
 * A persistent, non-dismissable indicator that some studio changes haven't
 * reached the server yet. Unlike a toast, it stays put until every queued write
 * is confirmed saved — so a stuck write is never invisible. The data itself is
 * held safely in the outbox (localStorage) and retried automatically; this just
 * makes the state legible and offers a manual retry.
 */
export function SyncStatusBanner() {
  const [count, setCount] = useState(0);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    setCount(pendingCount(getActiveUserId()));
    const onPending = (e: Event) => {
      const n = (e as CustomEvent<number>).detail;
      setCount(typeof n === "number" ? n : pendingCount(getActiveUserId()));
    };
    window.addEventListener("allegory:pending", onPending);
    return () => window.removeEventListener("allegory:pending", onPending);
  }, []);

  if (count <= 0) return null;

  const retry = async () => {
    const uid = getActiveUserId();
    if (!uid || retrying) return;
    setRetrying(true);
    try {
      await replayOutbox(uid);
    } finally {
      setCount(pendingCount(getActiveUserId()));
      setRetrying(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[92vw]">
      <div className="flex items-center gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 shadow-lg">
        <CloudOff className="h-4 w-4 shrink-0" />
        <span>
          {count} {count === 1 ? "change is" : "changes are"} still saving. They're kept safe on this device and we're
          retrying — please keep this tab open.
        </span>
        <button
          onClick={retry}
          disabled={retrying}
          className="ml-1 inline-flex items-center gap-1 rounded-sm border border-amber-400 px-2 py-1 text-xs font-medium hover:bg-amber-100 disabled:opacity-60"
        >
          {retrying && <Loader2 className="h-3 w-3 animate-spin" />}
          {retrying ? "Retrying…" : "Retry now"}
        </button>
      </div>
    </div>
  );
}
