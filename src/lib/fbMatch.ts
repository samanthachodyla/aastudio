// ============================================================================
// Meta Pixel Advanced Matching.
//
// Event Match Quality is driven by the customer-information parameters attached
// to each event. IP, user-agent and fbp are collected automatically (100%), but
// EMAIL is only present when we explicitly hand it to the Pixel. Without Advanced
// Matching, only Lead/Purchase events (where we happen to know the email) carry
// it — which caps match quality and, crucially, leaves PageView (the bulk of
// events) with no email at all.
//
// This module remembers the best identity we know for the visitor (logged-in
// member, or a returning lead/newsletter signup) and hands it to the Pixel as
// Advanced Matching, so email rides along on EVERY browser event, PageView
// included. Values are passed UNHASHED — the Pixel normalizes and SHA-256-hashes
// them client-side (never send plaintext to Meta ourselves).
//
// The identity is also persisted to localStorage and re-applied at Pixel init in
// index.html, so the very first PageView of a return visit already matches.
// Nothing is stored or sent if the visitor has opted out of ads.
// ============================================================================

const KEY = "allegory.am";
const PIXEL_ID = "1583309690064748";

export interface FbMatch {
  em?: string;          // email
  fn?: string;          // first name
  ln?: string;          // last name
  external_id?: string; // stable app user id — a strong, privacy-safe match key
}

function adsDenied(): boolean {
  try {
    return !!(window as unknown as { __allegoryDenyAds?: boolean }).__allegoryDenyAds;
  } catch {
    return false;
  }
}

export function readFbMatch(): FbMatch | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FbMatch) : null;
  } catch {
    return null;
  }
}

// Meta's normalization: trim + lowercase for email/name (the Pixel does this too,
// but normalizing before we store keeps the value stable across merges).
function norm(v: string | undefined): string | undefined {
  const s = (v || "").trim().toLowerCase();
  return s || undefined;
}

/**
 * Merge newly-known identity into the stored Advanced Matching set and push it to
 * the live Pixel so this session's subsequent events match immediately. No-op if
 * the visitor has opted out of ads.
 */
export function saveFbMatch(data: FbMatch): void {
  if (adsDenied()) return;

  const clean: FbMatch = {};
  const em = norm(data.em); if (em) clean.em = em;
  const fn = norm(data.fn); if (fn) clean.fn = fn;
  const ln = norm(data.ln); if (ln) clean.ln = ln;
  if (data.external_id) clean.external_id = String(data.external_id);
  if (!Object.keys(clean).length) return;

  const prev = readFbMatch() || {};
  const merged: FbMatch = { ...prev, ...clean };
  if (JSON.stringify(prev) === JSON.stringify(merged)) return; // nothing new

  try {
    localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    /* storage unavailable — still push to the live Pixel below */
  }
  try {
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
    // Re-initializing with the same Pixel id updates its Advanced Matching data.
    if (fbq) fbq("init", PIXEL_ID, merged);
  } catch {
    /* Pixel not ready yet — index.html re-reads localStorage on the next load */
  }
}

/** Forget stored identity (sign-out, or an ads opt-out). */
export function clearFbMatch(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
