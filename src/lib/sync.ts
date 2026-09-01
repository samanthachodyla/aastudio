// ============================================================================
// Supabase sync layer for the studio store.
//
// Strategy: the Zustand store stays the in-memory read model the pages already
// use. This module handles persistence — hydrating the store from Supabase on
// login, writing every mutation through to Supabase, and a one-time import of
// any pre-existing localStorage data.
//
// The generated Database type only knows `studio_messages`, so we use a loosely
// typed client here and map rows ourselves (camelCase <-> snake_case).
// ============================================================================
import { supabase } from "@/integrations/supabase/client";
import { readOutbox, recordInsert, recordUpdate, recordDelete, resolve, pendingCount, dropPendingDeletes } from "@/lib/outbox";

// Loosely-typed handle so we can hit the new tables without regenerated types.
const db = supabase as unknown as {
  from: (table: string) => any;
};

// Store collection key -> Postgres table name.
export const ENTITY_TABLES: Record<string, string> = {
  artworks: "artworks",
  invoices: "invoices",
  consignments: "consignments",
  opportunities: "opportunities",
  contacts: "contacts",
  leads: "leads",
  expenses: "expenses",
  vaultDocs: "vault_docs",
  pressItems: "press_items",
  contentIdeas: "content_ideas",
  captionDrafts: "caption_drafts",
  scheduledPosts: "scheduled_posts",
  newsletters: "newsletters",
  flaggedEmails: "flagged_emails",
};

// ---- key case conversion (top-level only; values pass through to jsonb) ----
const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_m, c) => c.toUpperCase());

function rowToDb(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of Object.keys(obj)) {
    if (obj[k] === undefined) continue;
    out[toSnake(k)] = obj[k];
  }
  return out;
}

function rowFromDb(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of Object.keys(obj)) {
    if (k === "user_id") continue; // not part of the client-side types
    out[toCamel(k)] = obj[k];
  }
  return out;
}

// The active user id is captured once at hydration time and stamped on inserts.
let activeUserId: string | null = null;
export function setActiveUserId(id: string | null) {
  activeUserId = id;
}
export function getActiveUserId() {
  return activeUserId;
}

// Table name -> store collection key, for merging unsynced rows back on hydrate.
const TABLE_TO_STORE_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(ENTITY_TABLES).map(([storeKey, table]) => [table, storeKey]),
);

// Broadcast the pending-write count so the sync-status banner can react. Fired
// after every enqueue/resolve; the banner listens for "allegory:pending".
function emitPending() {
  try {
    window.dispatchEvent(new CustomEvent("allegory:pending", { detail: pendingCount(activeUserId) }));
  } catch { /* no window (SSR) — ignore */ }
}

// ---- write-through helpers -------------------------------------------------
// Every write is recorded in the persistent outbox FIRST, attempted against
// Supabase, then cleared from the outbox only once the server confirms it. A
// write that fails stays in the outbox (surviving reloads) and is retried on the
// next hydrate — so a failed write is never silently lost. Callers still get the
// thrown error to surface a toast.
export async function pushInsert(table: string, item: Record<string, any>) {
  const uid = activeUserId;
  const storeKey = TABLE_TO_STORE_KEY[table] ?? table;
  const opId = uid ? recordInsert(uid, table, storeKey, String(item.id), item) : "";
  emitPending();
  const row = { ...rowToDb(item), user_id: uid };
  const { error } = await db.from(table).insert(row);
  if (error) throw error;
  if (uid) { resolve(uid, opId); emitPending(); }
}

export async function pushUpdate(table: string, id: string, patch: Record<string, any>) {
  const uid = activeUserId;
  const storeKey = TABLE_TO_STORE_KEY[table] ?? table;
  const opId = uid ? recordUpdate(uid, table, storeKey, String(id), patch) : "";
  emitPending();
  const { error } = await db.from(table).update(rowToDb(patch)).eq("id", id);
  if (error) throw error;
  if (uid) { resolve(uid, opId); emitPending(); }
}

export async function pushDelete(table: string, id: string) {
  const uid = activeUserId;
  const storeKey = TABLE_TO_STORE_KEY[table] ?? table;
  const opId = uid ? recordDelete(uid, table, storeKey, String(id)) : "";
  emitPending();
  const { error } = await db.from(table).delete().eq("id", id);
  if (error) throw error;
  if (uid) { resolve(uid, opId); emitPending(); }
}

// Merge any unsynced outbox rows into freshly-hydrated collections so a member
// still sees work that hasn't reached the server yet. Mutates `collections`.
//
// Stale/failed DELETE ops are dropped first and never applied: a delete only
// survives to hydrate if it failed to reach the server, so the row still exists
// in the database — re-applying it here is exactly what made a member's saved
// inventory "disappear" from view while it sat safe on the server (and a later
// retry could have wiped it). Dropping them keeps the data and clears the stuck
// queue. Only unsynced inserts/updates (which carry real data) are merged.
export function overlayOutbox(userId: string, collections: Record<string, any[]>) {
  dropPendingDeletes(userId);
  for (const op of readOutbox(userId)) {
    const list = (collections[op.storeKey] ||= []);
    const idx = list.findIndex((r) => r.id === op.rowId);
    if (op.kind === "insert") {
      if (idx < 0) list.unshift(op.data); // client-shaped already (camelCase)
      else list[idx] = { ...list[idx], ...op.data };
    } else if (op.kind === "update") {
      if (idx >= 0) list[idx] = { ...list[idx], ...op.data };
    }
  }
  return collections;
}

// Retry every queued write against Supabase (fire-and-forget after hydrate).
// Inserts use upsert so a partially-synced row can't collide on its primary key.
export async function replayOutbox(userId: string) {
  for (const op of readOutbox(userId)) {
    try {
      if (op.kind === "insert") {
        const row = { ...rowToDb(op.data || {}), user_id: userId };
        const { error } = await db.from(op.table).upsert(row, { onConflict: "id" });
        if (error) throw error;
      } else if (op.kind === "update") {
        const { error } = await db.from(op.table).update(rowToDb(op.data || {})).eq("id", op.rowId);
        if (error) throw error;
      } else {
        const { error } = await db.from(op.table).delete().eq("id", op.rowId);
        if (error) throw error;
      }
      resolve(userId, op.opId);
      emitPending();
    } catch (e) {
      // Still failing (e.g. the schema fix isn't applied yet) — keep it queued
      // and try again on the next hydrate.
      console.warn(`[sync] replay still failing for ${op.table}/${op.rowId}`, e);
    }
  }
}

// Single-row inbox connection (keyed by user_id).
export async function pushInboxConnection(conn: Record<string, any> | null) {
  if (!conn) {
    const { error } = await db.from("inbox_connections").delete().eq("user_id", activeUserId);
    if (error) throw error;
    return;
  }
  const row = { ...rowToDb(conn), user_id: activeUserId };
  const { error } = await db.from("inbox_connections").upsert(row, { onConflict: "user_id" });
  if (error) throw error;
}

// ---- hydration ------------------------------------------------------------
export interface HydratedData {
  collections: Record<string, any[]>;
  inboxConnection: Record<string, any> | null;
}

/** Load every entity for a single user (scoped explicitly so admins still only
 *  load their OWN studio here — cross-user reads happen in the Reports page). */
export async function loadAllForUser(userId: string): Promise<HydratedData> {
  const collections: Record<string, any[]> = {};
  const entries = Object.entries(ENTITY_TABLES);
  const failures: { table: string; error: any }[] = [];

  await Promise.all(
    entries.map(async ([storeKey, table]) => {
      try {
        const { data, error } = await db.from(table).select("*").eq("user_id", userId);
        if (error) throw error;
        collections[storeKey] = (data ?? []).map(rowFromDb);
      } catch (e) {
        // One failing table shouldn't blank the whole studio — load what we can.
        console.error(`[sync] failed to load ${table}`, e);
        collections[storeKey] = [];
        failures.push({ table, error: e });
      }
    })
  );

  // If EVERY table failed, this is systemic (auth/network/RLS) — surface it so
  // the user sees a real error instead of a silently empty studio.
  if (failures.length === entries.length) {
    throw failures[0].error;
  }

  let inboxConnection: Record<string, any> | null = null;
  try {
    const { data: inboxRows, error: inboxErr } = await db
      .from("inbox_connections")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (inboxErr) throw inboxErr;
    inboxConnection = inboxRows ? rowFromDb(inboxRows) : null;
  } catch (e) {
    console.error("[sync] failed to load inbox_connections", e);
  }

  return { collections, inboxConnection };
}

// ---- one-time localStorage import ----------------------------------------
const OLD_PERSIST_KEY = "allegory-studio-v1";
const migratedFlag = (userId: string) => `allegory.migrated.${userId}`;

/** On first login, push any data already sitting in this browser's localStorage
 *  into Supabase, then mark this user migrated so we never re-import. */
export async function importLocalDataIfNeeded(userId: string): Promise<boolean> {
  if (localStorage.getItem(migratedFlag(userId))) return false;

  let raw: string | null = null;
  try {
    raw = localStorage.getItem(OLD_PERSIST_KEY);
  } catch {
    raw = null;
  }

  // Nothing legacy in this browser — mark migrated so we don't recheck each login.
  if (!raw) {
    try {
      localStorage.setItem(migratedFlag(userId), new Date().toISOString());
    } catch { /* ignore */ }
    return false;
  }

  let parsed: any = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }
  const state = parsed?.state ?? parsed;

  // Best-effort, one-time migration of legacy browser data. It must NEVER block
  // hydration (every failure is caught), and — critically — it must NEVER delete
  // the local backup unless every row reached the server. Otherwise a failed
  // sync would destroy data that never made it to the database.
  let hadError = false;
  if (state && typeof state === "object") {
    for (const [storeKey, table] of Object.entries(ENTITY_TABLES)) {
      const items: any[] = Array.isArray(state[storeKey]) ? state[storeKey] : [];
      if (!items.length) continue;
      const rows = items.map((it) => ({ ...rowToDb(it), user_id: userId }));
      try {
        // Upsert so a re-run can't create duplicates (ids are client-supplied).
        const { error } = await db.from(table).upsert(rows, { onConflict: "id" });
        if (error) throw error;
      } catch (e) {
        console.error(`[sync] legacy import for ${table} failed`, e);
        hadError = true;
      }
    }
    if (state.inboxConnection) {
      try {
        await pushInboxConnection(state.inboxConnection);
      } catch (e) {
        console.error("[sync] legacy inbox import failed", e);
        hadError = true;
      }
    }
  }

  if (hadError) {
    // Something didn't sync — KEEP the local backup and do NOT mark migrated, so
    // no data is lost and the import retries on the next login. Hydration still
    // proceeds normally (this function never throws).
    console.warn("[sync] legacy import had errors — preserving local backup for retry");
    return false;
  }

  // Clean success only: now it's safe to clear the local blob and mark migrated.
  try {
    localStorage.removeItem(OLD_PERSIST_KEY);
    localStorage.setItem(migratedFlag(userId), new Date().toISOString());
  } catch { /* ignore */ }
  return true;
}
