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

  await Promise.all(
    Object.entries(ENTITY_TABLES).map(async ([storeKey, table]) => {
      const { data, error } = await db.from(table).select("*").eq("user_id", userId);
      if (error) throw error;
      collections[storeKey] = (data ?? []).map(rowFromDb);
    })
  );

  const { data: inboxRows, error: inboxErr } = await db
    .from("inbox_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (inboxErr) throw inboxErr;

  return {
    collections,
    inboxConnection: inboxRows ? rowFromDb(inboxRows) : null,
  };
}

// ---- one-time localStorage import ----------------------------------------
const OLD_PERSIST_KEY = "allegory-studio-v1";
const migratedFlag = (userId: string) => `allegory.migrated.${userId}`;

/** On first login, push any data already sitting in this browser's localStorage
 *  into Supabase, then mark this user migrated so we never re-import. */
export async function importLocalDataIfNeeded(userId: string): Promise<boolean> {
  if (localStorage.getItem(migratedFlag(userId))) return false;

  let parsed: any = null;
  try {
    const raw = localStorage.getItem(OLD_PERSIST_KEY);
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }
  const state = parsed?.state ?? parsed;

  if (state && typeof state === "object") {
    for (const [storeKey, table] of Object.entries(ENTITY_TABLES)) {
      const items: any[] = Array.isArray(state[storeKey]) ? state[storeKey] : [];
      if (!items.length) continue;
      const rows = items.map((it) => ({ ...rowToDb(it), user_id: userId }));
      // Upsert so a re-run can't create duplicates (ids are client-supplied).
      const { error } = await db.from(table).upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }
    if (state.inboxConnection) {
      await pushInboxConnection(state.inboxConnection);
    }
  }

  // Clear the legacy blob so a different account signing in on this same browser
  // can never re-import (and thereby absorb) the first user's leftover data.
  localStorage.removeItem(OLD_PERSIST_KEY);
  localStorage.setItem(migratedFlag(userId), new Date().toISOString());
  return true;
}
