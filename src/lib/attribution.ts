// ============================================================================
// Marketing attribution.
//
// On every visit we record where the visitor came from — UTMs, click IDs,
// referrer, landing page, date — into localStorage, keeping BOTH the FIRST-touch
// (original source, set once and never overwritten) and the LAST-touch (most
// recent source). Once the visitor becomes a customer we write this to their
// profile, so their original + latest acquisition source stays connected to the
// account across every marketing channel.
//
// No PII (email/name) is captured or sent here — only campaign tags and the
// click/measurement IDs ad platforms use for matching. Capture of ad IDs and the
// GA client ID respects the site's analytics/ads opt-out flags.
// ============================================================================
import { supabase } from "@/integrations/supabase/client";

const FIRST_KEY = "allegory.attr.first.v1";
const LAST_KEY = "allegory.attr.last.v1";

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  referrer?: string;
  landing_page?: string;
  at?: string; // ISO timestamp of this touch
}

function cookie(name: string): string {
  try {
    const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
    return m ? decodeURIComponent(m[1]) : "";
  } catch {
    return "";
  }
}

/** GA4 client id from the _ga cookie ("GA1.1.<id>.<ts>" -> "<id>.<ts>"). */
export function gaClientId(): string {
  const c = cookie("_ga");
  return c ? c.split(".").slice(-2).join(".") : "";
}

function denyAnalytics(): boolean {
  try { return !!(window as unknown as { __allegoryDenyAnalytics?: boolean }).__allegoryDenyAnalytics; } catch { return false; }
}
function denyAds(): boolean {
  try { return !!(window as unknown as { __allegoryDenyAds?: boolean }).__allegoryDenyAds; } catch { return false; }
}

function read(key: string): Attribution | null {
  try { const r = localStorage.getItem(key); return r ? (JSON.parse(r) as Attribution) : null; } catch { return null; }
}
function write(key: string, v: Attribution) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
}

function fromUrl(): Attribution {
  const qs = new URLSearchParams(window.location.search);
  const a: Attribution = {};
  const put = (k: keyof Attribution, v: string | null) => { if (v) (a as Record<string, string>)[k] = v; };
  put("utm_source", qs.get("utm_source"));
  put("utm_medium", qs.get("utm_medium"));
  put("utm_campaign", qs.get("utm_campaign"));
  put("utm_content", qs.get("utm_content"));
  put("utm_term", qs.get("utm_term"));
  if (!denyAds()) put("fbclid", qs.get("fbclid"));
  put("gclid", qs.get("gclid"));
  return a;
}

function hasSignal(a: Attribution): boolean {
  return !!(a.utm_source || a.utm_medium || a.utm_campaign || a.fbclid || a.gclid);
}

/** Capture attribution for this visit. First-touch is set once; last-touch is
 *  refreshed whenever the visit carries a real campaign/referrer signal. Safe to
 *  call on every page load. */
export function captureAttribution(): void {
  try {
    const url = fromUrl();
    let ref = "";
    try { const r = document.referrer || ""; ref = r && !r.includes(location.host) ? r : ""; } catch { /* ignore */ }
    const touch: Attribution = { ...url, landing_page: location.pathname + location.search, at: new Date().toISOString() };
    if (ref) touch.referrer = ref;

    // First-touch: set once, on the very first visit (even if direct), so we
    // always keep the original landing page + date.
    if (!read(FIRST_KEY)) write(FIRST_KEY, touch);

    // Last-touch: overwrite when this visit carries a real acquisition signal, so
    // a later campaign click becomes the "most recent" source.
    if (hasSignal(url) || ref || !read(LAST_KEY)) write(LAST_KEY, touch);
  } catch { /* best-effort */ }
}

export function getFirstTouch(): Attribution | null { return read(FIRST_KEY); }
export function getLastTouch(): Attribution | null { return read(LAST_KEY); }

/** Persist attribution to the signed-in member's profile: last-touch refreshes
 *  each time; first-touch is written only once (never overwrites the original);
 *  the GA client id + Meta fbp/fbc are kept current for server-side matching.
 *  Best-effort — tolerates the columns not existing yet, and respects opt-out. */
export async function syncAttributionToProfile(userId: string): Promise<void> {
  try {
    if (denyAnalytics()) return;
    const first = getFirstTouch();
    const last = getLastTouch();
    const gcid = gaClientId();
    const fbc = cookie("_fbc");
    const fbp = cookie("_fbp");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: prof } = await db.from("profiles").select("first_visit_at").eq("id", userId).maybeSingle();

    const patch: Record<string, string | null> = {};
    if (last) {
      patch.last_utm_source = last.utm_source ?? null;
      patch.last_utm_medium = last.utm_medium ?? null;
      patch.last_utm_campaign = last.utm_campaign ?? null;
      patch.last_utm_content = last.utm_content ?? null;
      patch.last_utm_term = last.utm_term ?? null;
      patch.last_fbclid = last.fbclid ?? null;
      patch.last_referrer = last.referrer ?? null;
      patch.last_landing_page = last.landing_page ?? null;
      patch.last_visit_at = last.at ?? null;
    }
    if (first && !prof?.first_visit_at) {
      patch.first_utm_source = first.utm_source ?? null;
      patch.first_utm_medium = first.utm_medium ?? null;
      patch.first_utm_campaign = first.utm_campaign ?? null;
      patch.first_utm_content = first.utm_content ?? null;
      patch.first_utm_term = first.utm_term ?? null;
      patch.first_fbclid = first.fbclid ?? null;
      patch.first_referrer = first.referrer ?? null;
      patch.first_landing_page = first.landing_page ?? null;
      patch.first_visit_at = first.at ?? new Date().toISOString();
    }
    if (gcid) patch.ga_client_id = gcid;
    if (fbc) patch.fbc = fbc;
    if (fbp) patch.fbp = fbp;

    if (Object.keys(patch).length) {
      await db.from("profiles").upsert({ id: userId, ...patch }, { onConflict: "id" });
    }
  } catch {
    /* best-effort; columns may not exist until the migration runs */
  }
}
