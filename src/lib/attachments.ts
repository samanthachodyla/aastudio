// Opportunity file attachments live in their OWN store, persisted to IndexedDB
// rather than localStorage. Attachments are base64 data URLs (up to a few MB
// each), which would quickly exhaust the ~5MB localStorage quota shared by the
// main prefs store — and a QuotaExceededError there throws synchronously and
// can break unrelated writes. IndexedDB has a far larger quota and, being a
// separate async store, can never interfere with the prefs bucket.
import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { OppAttachment } from "./types";

// ---- tiny promise-based IndexedDB key/value (no dependency) ----
const DB_NAME = "allegory-attachments";
const STORE_NAME = "kv";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve((req.result as string) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null; // degrade gracefully if IndexedDB is unavailable (e.g. private mode)
  }
}

async function idbSet(key: string, value: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* attachments just won't persist; never throw into a store setter */
  }
}

async function idbDel(key: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore */
  }
}

const idbStorage: StateStorage = {
  getItem: (name) => idbGet(name),
  setItem: (name, value) => idbSet(name, value),
  removeItem: (name) => idbDel(name),
};

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

interface AttachmentsState {
  /** attachments keyed by opportunity id */
  byOpportunity: Record<string, OppAttachment[]>;
  addAttachment: (oppId: string, att: Omit<OppAttachment, "id" | "addedAt">) => void;
  removeAttachment: (oppId: string, attId: string) => void;
  clearOpportunity: (oppId: string) => void;
}

export const useAttachments = create<AttachmentsState>()(
  persist(
    (set, get) => ({
      byOpportunity: {},
      addAttachment: (oppId, att) => {
        const item: OppAttachment = { ...att, id: uid(), addedAt: now() };
        const map = get().byOpportunity;
        set({ byOpportunity: { ...map, [oppId]: [...(map[oppId] ?? []), item] } });
      },
      removeAttachment: (oppId, attId) => {
        const map = get().byOpportunity;
        set({ byOpportunity: { ...map, [oppId]: (map[oppId] ?? []).filter(a => a.id !== attId) } });
      },
      clearOpportunity: (oppId) => {
        const { [oppId]: _drop, ...rest } = get().byOpportunity;
        void _drop;
        set({ byOpportunity: rest });
      },
    }),
    { name: "allegory-opportunity-attachments-v1", storage: createJSONStorage(() => idbStorage) },
  ),
);
