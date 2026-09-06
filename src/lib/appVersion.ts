// ============================================================================
// App version watcher — makes sure a shipped fix actually reaches people.
//
// The studio is a single-page app with no service worker, so a browser tab left
// open for days keeps running whatever code it loaded then — even after we ship
// a fix. That's exactly how a member could keep hitting a bug we'd already fixed
// (their tab never reloaded the new bundle).
//
// Each build is stamped with a unique BUILD_ID (baked in at build time) and the
// same id is written to a tiny, never-cached /version.json. This module polls
// that file; when the deployed id differs from the running one, a newer version
// is live and listeners are notified so the UI can refresh to it.
// ============================================================================

// Injected at build time by Vite `define` (see vite.config.ts). "dev" locally.
declare const __BUILD_ID__: string;
export const BUILD_ID: string = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "dev";

type Listener = (remoteBuildId: string) => void;

let started = false;
let listeners: Listener[] = [];
let latestRemote: string | null = null;

/** Subscribe to "a newer version is deployed". Fires immediately if we already
 *  know one is available. Returns an unsubscribe function. */
export function onUpdateAvailable(cb: Listener): () => void {
  listeners.push(cb);
  if (latestRemote && latestRemote !== BUILD_ID) {
    try { cb(latestRemote); } catch { /* ignore */ }
  }
  return () => { listeners = listeners.filter((l) => l !== cb); };
}

async function fetchRemoteBuildId(): Promise<string | null> {
  try {
    // Cache-busting query + no-store so we always see the live deploy's id,
    // never a browser- or CDN-cached copy.
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const id = data && typeof data.buildId === "string" ? data.buildId : null;
    return id || null;
  } catch {
    return null; // offline / blocked — just try again later
  }
}

async function check(): Promise<void> {
  const remote = await fetchRemoteBuildId();
  if (!remote) return;
  latestRemote = remote;
  if (remote !== BUILD_ID) {
    for (const cb of listeners) {
      try { cb(remote); } catch { /* ignore */ }
    }
  }
}

/** Begin watching for new deploys. Idempotent; a no-op in local dev (no
 *  version.json is emitted there). */
export function startVersionWatcher(): void {
  if (started) return;
  started = true;
  if (BUILD_ID === "dev") return;

  window.setTimeout(check, 15_000);            // shortly after first load
  window.setInterval(check, 5 * 60 * 1000);    // then every 5 minutes
  // The moment a long-idle tab is brought back to the foreground — the ideal
  // time to notice a new version.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void check();
  });
  window.addEventListener("focus", () => void check());
}
