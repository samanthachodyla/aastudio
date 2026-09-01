// ============================================================================
// Persistent write outbox — the studio's safety net against silent data loss.
//
// The store writes are optimistic + fire-and-forget: the UI updates instantly
// and the Supabase write happens in the background. If that write ever fails
// (a schema drift, an RLS hiccup, a dropped connection), the row used to exist
// ONLY in memory and vanished on the next reload.
//
// This module keeps every pending write in localStorage (per user) until it is
// confirmed saved. On failure it survives a reload and is retried; on the login
// after that, unsynced rows are merged back into what the user sees. Nothing is
// lost just because a write didn't land the first time.
//
// The queue is collapsed to at most ONE pending op per (table,row): a later
// edit merges into a still-unsynced insert, and deleting a never-synced row
// simply drops it. That keeps the queue tiny and the replay order trivial.
// ============================================================================

export type OpKind = "insert" | "update" | "delete";

export interface PendingOp {
  opId: string;
  kind: OpKind;
  table: string;
  storeKey: string; // store collection key, so we can merge back on hydrate
  rowId: string;
  data?: Record<string, unknown>; // full client row (insert) or patch (update)
  ts: string;
}

const KEY = (userId: string) => `allegory.outbox.${userId}`;

const newId = () => {
  try {
    const c = crypto as { randomUUID?: () => string };
    if (c.randomUUID) return c.randomUUID();
  } catch { /* fall through */ }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export function readOutbox(userId: string): PendingOp[] {
  try {
    const raw = localStorage.getItem(KEY(userId));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(userId: string, ops: PendingOp[]) {
  try {
    if (ops.length) localStorage.setItem(KEY(userId), JSON.stringify(ops));
    else localStorage.removeItem(KEY(userId));
  } catch {
    /* quota exceeded or storage disabled — best-effort, never throw */
  }
}

export function pendingCount(userId: string | null | undefined): number {
  if (!userId) return 0;
  return readOutbox(userId).length;
}

const sameRow = (o: PendingOp, table: string, rowId: string) => o.table === table && o.rowId === rowId;

/** Queue an insert. Returns the opId to resolve() once the server confirms it. */
export function recordInsert(
  userId: string,
  table: string,
  storeKey: string,
  rowId: string,
  data: Record<string, unknown>,
): string {
  const ops = readOutbox(userId).filter((o) => !sameRow(o, table, rowId));
  const op: PendingOp = { opId: newId(), kind: "insert", table, storeKey, rowId, data, ts: new Date().toISOString() };
  write(userId, [...ops, op]);
  return op.opId;
}

/**
 * Queue an update. If the row still has an unsynced INSERT queued, the patch is
 * merged into that insert (so the eventual write carries the latest fields) and
 * "" is returned — there is no separate op for the caller to resolve, and the
 * immediate server UPDATE (which would no-op on a not-yet-inserted row) is
 * harmless. Otherwise a normal update op is queued and its id returned.
 */
export function recordUpdate(
  userId: string,
  table: string,
  storeKey: string,
  rowId: string,
  patch: Record<string, unknown>,
): string {
  const ops = readOutbox(userId);
  const insertIdx = ops.findIndex((o) => sameRow(o, table, rowId) && o.kind === "insert");
  if (insertIdx >= 0) {
    ops[insertIdx] = { ...ops[insertIdx], data: { ...(ops[insertIdx].data || {}), ...patch } };
    write(userId, ops);
    return "";
  }
  // Merge onto a prior pending update; otherwise add a fresh one.
  const updIdx = ops.findIndex((o) => sameRow(o, table, rowId) && o.kind === "update");
  if (updIdx >= 0) {
    ops[updIdx] = { ...ops[updIdx], data: { ...(ops[updIdx].data || {}), ...patch }, ts: new Date().toISOString() };
    write(userId, ops);
    return ops[updIdx].opId;
  }
  const op: PendingOp = { opId: newId(), kind: "update", table, storeKey, rowId, data: patch, ts: new Date().toISOString() };
  write(userId, [...ops, op]);
  return op.opId;
}

/**
 * Queue a delete. If the row was never synced (an insert is still pending), all
 * queued ops for it are dropped and "" is returned — there is nothing on the
 * server to delete. Otherwise a delete op is queued and its id returned.
 */
export function recordDelete(userId: string, table: string, storeKey: string, rowId: string): string {
  const ops = readOutbox(userId);
  const hadInsert = ops.some((o) => sameRow(o, table, rowId) && o.kind === "insert");
  const rest = ops.filter((o) => !sameRow(o, table, rowId));
  if (hadInsert) {
    write(userId, rest);
    return "";
  }
  const op: PendingOp = { opId: newId(), kind: "delete", table, storeKey, rowId, ts: new Date().toISOString() };
  write(userId, [...rest, op]);
  return op.opId;
}

/** Remove a confirmed op. No-op for the "" sentinel returned by merged writes. */
export function resolve(userId: string, opId: string): void {
  if (!opId) return;
  const ops = readOutbox(userId).filter((o) => o.opId !== opId);
  write(userId, ops);
}

/**
 * Drop every pending DELETE op for a user and report how many were removed.
 *
 * Used on hydrate. A delete only stays queued if it FAILED to reach the server,
 * which means the row still exists in the database. Re-applying that delete on
 * load hid the row from the member while their data sat safely on the server —
 * and a later successful retry could actually wipe it. Dropping stuck deletes on
 * load keeps the data (the safe direction) and clears the stuck queue. Inserts
 * and updates carry unsynced DATA, so they are never touched here.
 */
export function dropPendingDeletes(userId: string): number {
  const ops = readOutbox(userId);
  const kept = ops.filter((o) => o.kind !== "delete");
  if (kept.length !== ops.length) write(userId, kept);
  return ops.length - kept.length;
}
