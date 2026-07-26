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

// ---- write-through helpers (fire-and-forget; callers surface failures) -----
export async function pushInsert(table: string, item: Record<string, any>) {
  const row = { ...rowToDb(item), user_id: activeUserId };
  const { error } = await db.from(table).insert(row);
  if (error) throw error;
}

export async function pushUpdate(table: string, id: string, patch: Record<string, any>) {
  const { error } = await db.from(table).update(rowToDb(patch)).eq("id", id);
  if (error) throw error;
}

export async function pushDelete(table: string, id: string) {
  const { error } = await db.from(table).delete().eq("id", id);
  if (error) throw error;
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
