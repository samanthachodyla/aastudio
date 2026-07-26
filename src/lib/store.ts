import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import type {
  Artwork, Invoice, Consignment, Opportunity, Contact, Lead, Interaction, Expense,
  VaultDoc, PressItem, InboxConnection, FlaggedEmail,
  ContentIdea, CaptionDraft, ScheduledPost, Newsletter, Todo,
} from "./types";
import {
  pushInsert, pushUpdate, pushDelete, pushInboxConnection, type HydratedData,
} from "./sync";

interface State {
  // Loaded from Supabase on login.
  hydrated: boolean;

  artworks: Artwork[];
  invoices: Invoice[];
  consignments: Consignment[];
  opportunities: Opportunity[];
  contacts: Contact[];
  leads: Lead[];
  expenses: Expense[];

  vaultDocs: VaultDoc[];
  pressItems: PressItem[];
  vaultOnboarded: boolean;          // UI pref — persisted locally
  inboxConnection: InboxConnection | null;
  flaggedEmails: FlaggedEmail[];

  contentIdeas: ContentIdea[];
  captionDrafts: CaptionDraft[];
  scheduledPosts: ScheduledPost[];
  newsletters: Newsletter[];

  customStatuses: string[];          // UI pref — persisted locally
  addCustomStatus: (label: string) => void;

  customOpportunityTypes: string[];  // UI pref — persisted locally
  addCustomOpportunityType: (label: string) => void;

  todos: Todo[];                     // dashboard to-dos — persisted locally, not server-backed
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  clearCompletedTodos: () => void;

  // Replace all server-backed collections at once (called after hydration).
  hydrateAll: (data: HydratedData) => void;
  resetHydrated: () => void;

  addArtwork: (a: Omit<Artwork, "id" | "createdAt">) => Artwork;
  updateArtwork: (id: string, patch: Partial<Artwork>) => void;
  deleteArtwork: (id: string) => void;

  addInvoice: (i: Omit<Invoice, "id" | "number" | "issuedAt">) => Invoice;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  addConsignment: (c: Omit<Consignment, "id">) => Consignment;
  updateConsignment: (id: string, patch: Partial<Consignment>) => void;
  deleteConsignment: (id: string) => void;

  addOpportunity: (o: Omit<Opportunity, "id">) => Opportunity;
  updateOpportunity: (id: string, patch: Partial<Opportunity>) => void;
  deleteOpportunity: (id: string) => void;

  addContact: (c: Omit<Contact, "id">) => Contact;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  addInteraction: (contactId: string, i: Omit<Interaction, "id">) => void;
  deleteInteraction: (contactId: string, interactionId: string) => void;

  addLead: (l: Omit<Lead, "id" | "createdAt" | "updatedAt">) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  deleteLead: (id: string) => void;

  addExpense: (e: Omit<Expense, "id" | "createdAt">) => Expense;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addVaultDoc: (d: Omit<VaultDoc, "id" | "createdAt" | "updatedAt">) => VaultDoc;
  updateVaultDoc: (id: string, patch: Partial<VaultDoc>) => void;
  deleteVaultDoc: (id: string) => void;

  addPressItem: (p: Omit<PressItem, "id" | "createdAt">) => PressItem;
  updatePressItem: (id: string, patch: Partial<PressItem>) => void;
  deletePressItem: (id: string) => void;

  markVaultOnboarded: () => void;

  connectInbox: (c: InboxConnection) => void;
  disconnectInbox: () => void;
  updateFlaggedEmail: (id: string, patch: Partial<FlaggedEmail>) => void;

  addContentIdea: (i: Omit<ContentIdea, "id" | "createdAt">) => ContentIdea;
  updateContentIdea: (id: string, patch: Partial<ContentIdea>) => void;
  deleteContentIdea: (id: string) => void;

  addCaptionDraft: (c: Omit<CaptionDraft, "id" | "createdAt">) => CaptionDraft;
  updateCaptionDraft: (id: string, patch: Partial<CaptionDraft>) => void;
  deleteCaptionDraft: (id: string) => void;

  addScheduledPost: (p: Omit<ScheduledPost, "id">) => ScheduledPost;
  updateScheduledPost: (id: string, patch: Partial<ScheduledPost>) => void;
  deleteScheduledPost: (id: string) => void;

  addNewsletter: (n: Omit<Newsletter, "id">) => Newsletter;
  updateNewsletter: (id: string, patch: Partial<Newsletter>) => void;
  deleteNewsletter: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString();

/** Fire-and-forget write-through: keep the UI snappy, surface failures softly. */
function track(p: Promise<unknown>) {
  p.catch((e) => {
    console.error("[sync] write failed", e);
    toast.error("That change didn't save — check your connection and reload before closing this tab.", {
      duration: 12000,
    });
  });
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,

      artworks: [],
      invoices: [],
      consignments: [],
      opportunities: [],
      contacts: [],
      leads: [],
      expenses: [],
      vaultDocs: [],
      pressItems: [],
      vaultOnboarded: false,
      inboxConnection: null,
      flaggedEmails: [],
      contentIdeas: [],
      captionDrafts: [],
      scheduledPosts: [],
      newsletters: [],
      customStatuses: [],
      customOpportunityTypes: [],
      todos: [],

      hydrateAll: (data) =>
        set({
          ...(data.collections as Partial<State>),
          inboxConnection: (data.inboxConnection as InboxConnection | null) ?? null,
          hydrated: true,
        }),
      resetHydrated: () => set({ hydrated: false }),

      addCustomStatus: (label) => {
        const v = label.trim();
        if (!v) return;
        if (get().customStatuses.includes(v)) return;
        set({ customStatuses: [...get().customStatuses, v] });
      },

      addCustomOpportunityType: (label) => {
        const v = label.trim();
        if (!v) return;
        if (get().customOpportunityTypes.includes(v)) return;
        set({ customOpportunityTypes: [...get().customOpportunityTypes, v] });
      },

      // To-dos are local-only (localStorage) — no write-through to Supabase.
      addTodo: (text) => {
        const v = text.trim();
        if (!v) return;
        const item: Todo = { id: uid(), text: v, done: false, createdAt: today() };
        set({ todos: [...get().todos, item] });
      },
      toggleTodo: (id) => {
        set({ todos: get().todos.map(t => t.id === id ? { ...t, done: !t.done } : t) });
      },
      deleteTodo: (id) => {
        set({ todos: get().todos.filter(t => t.id !== id) });
      },
      clearCompletedTodos: () => {
        set({ todos: get().todos.filter(t => !t.done) });
      },

      addArtwork: (a) => {
        const item: Artwork = { ...a, id: uid(), createdAt: today() };
        set({ artworks: [item, ...get().artworks] });
        track(pushInsert("artworks", item));
        return item;
      },
      updateArtwork: (id, patch) => {
        set({ artworks: get().artworks.map(a => a.id === id ? { ...a, ...patch } : a) });
        track(pushUpdate("artworks", id, patch));
      },
      deleteArtwork: (id) => {
        set({ artworks: get().artworks.filter(a => a.id !== id) });
        track(pushDelete("artworks", id));
      },

      addInvoice: (i) => {
        const number = "AS-" + (1000 + get().invoices.length + 6).toString();
        const item: Invoice = { ...i, id: uid(), number, issuedAt: today() };
        set({ invoices: [item, ...get().invoices] });
        track(pushInsert("invoices", item));
        return item;
      },
      updateInvoice: (id, patch) => {
        set({ invoices: get().invoices.map(v => v.id === id ? { ...v, ...patch } : v) });
        track(pushUpdate("invoices", id, patch));
        // auto-update artwork status when invoice marked paid (skip custom works)
        if (patch.status === "paid") {
          const inv = get().invoices.find(v => v.id === id);
          if (inv && inv.artworkId) get().updateArtwork(inv.artworkId, { status: "sold" });
        }
      },
      deleteInvoice: (id) => {
        set({ invoices: get().invoices.filter(v => v.id !== id) });
        track(pushDelete("invoices", id));
      },

      addConsignment: (c) => {
        const item: Consignment = { ...c, id: uid() };
        set({ consignments: [item, ...get().consignments] });
        track(pushInsert("consignments", item));
        if (c.status === "active") get().updateArtwork(c.artworkId, { status: "on_consignment", location: c.galleryName });
        return item;
      },
      updateConsignment: (id, patch) => {
        set({ consignments: get().consignments.map(c => c.id === id ? { ...c, ...patch } : c) });
        track(pushUpdate("consignments", id, patch));
        if (patch.status === "active") {
          const c = get().consignments.find(x => x.id === id);
          if (c) get().updateArtwork(c.artworkId, { status: "on_consignment", location: c.galleryName });
        }
        if (patch.status === "returned") {
          const c = get().consignments.find(x => x.id === id);
          if (c) get().updateArtwork(c.artworkId, { status: "in_studio", location: undefined });
        }
      },
      deleteConsignment: (id) => {
        set({ consignments: get().consignments.filter(c => c.id !== id) });
        track(pushDelete("consignments", id));
      },

      addOpportunity: (o) => {
        const item: Opportunity = { ...o, id: uid() };
        set({ opportunities: [item, ...get().opportunities] });
        track(pushInsert("opportunities", item));
        return item;
      },
      updateOpportunity: (id, patch) => {
        set({ opportunities: get().opportunities.map(o => o.id === id ? { ...o, ...patch } : o) });
        track(pushUpdate("opportunities", id, patch));
      },
      deleteOpportunity: (id) => {
        set({ opportunities: get().opportunities.filter(o => o.id !== id) });
        track(pushDelete("opportunities", id));
      },

      addContact: (c) => {
        const item: Contact = { ...c, id: uid() };
        set({ contacts: [item, ...get().contacts] });
        track(pushInsert("contacts", item));
        return item;
      },
      updateContact: (id, patch) => {
        set({ contacts: get().contacts.map(c => c.id === id ? { ...c, ...patch } : c) });
        track(pushUpdate("contacts", id, patch));
      },
      deleteContact: (id) => {
        set({ contacts: get().contacts.filter(c => c.id !== id) });
        track(pushDelete("contacts", id));
      },
      addInteraction: (contactId, i) => {
        const interaction: Interaction = { ...i, id: uid() };
        let updated: Contact | undefined;
        set({
          contacts: get().contacts.map(c => {
            if (c.id !== contactId) return c;
            updated = {
              ...c,
              interactions: [interaction, ...(c.interactions ?? [])],
              lastInteractionAt: interaction.date > (c.lastInteractionAt ?? "") ? interaction.date : c.lastInteractionAt,
            };
            return updated;
          }),
        });
        if (updated) track(pushUpdate("contacts", contactId, {
          interactions: updated.interactions, lastInteractionAt: updated.lastInteractionAt,
        }));
      },
      deleteInteraction: (contactId, interactionId) => {
        let updated: Contact | undefined;
        set({
          contacts: get().contacts.map(c => {
            if (c.id !== contactId) return c;
            const interactions = (c.interactions ?? []).filter(x => x.id !== interactionId);
            const lastInteractionAt = interactions.length
              ? interactions.reduce((m, x) => x.date > m ? x.date : m, interactions[0].date)
              : undefined;
            updated = { ...c, interactions, lastInteractionAt };
            return updated;
          }),
        });
        if (updated) track(pushUpdate("contacts", contactId, {
          interactions: updated.interactions, lastInteractionAt: updated.lastInteractionAt,
        }));
      },

      addLead: (l) => {
        const item: Lead = { ...l, id: uid(), createdAt: today(), updatedAt: today() };
        set({ leads: [item, ...get().leads] });
        track(pushInsert("leads", item));
        return item;
      },
      updateLead: (id, patch) => {
        const next = { ...patch, updatedAt: today() };
        set({ leads: get().leads.map(l => l.id === id ? { ...l, ...next } : l) });
        track(pushUpdate("leads", id, next));
      },
      deleteLead: (id) => {
        set({ leads: get().leads.filter(l => l.id !== id) });
        track(pushDelete("leads", id));
      },

      addExpense: (e) => {
        const item: Expense = { ...e, id: uid(), createdAt: today() };
        set({ expenses: [item, ...get().expenses] });
        track(pushInsert("expenses", item));
        return item;
      },
      updateExpense: (id, patch) => {
        set({ expenses: get().expenses.map(e => e.id === id ? { ...e, ...patch } : e) });
        track(pushUpdate("expenses", id, patch));
      },
      deleteExpense: (id) => {
        set({ expenses: get().expenses.filter(e => e.id !== id) });
        track(pushDelete("expenses", id));
      },

      addVaultDoc: (d) => {
        const item: VaultDoc = { ...d, id: uid(), createdAt: today(), updatedAt: today() };
        set({ vaultDocs: [item, ...get().vaultDocs] });
        track(pushInsert("vault_docs", item));
        return item;
      },
      updateVaultDoc: (id, patch) => {
        const next = { ...patch, updatedAt: today() };
        set({ vaultDocs: get().vaultDocs.map(d => d.id === id ? { ...d, ...next } : d) });
        track(pushUpdate("vault_docs", id, next));
      },
      deleteVaultDoc: (id) => {
        set({ vaultDocs: get().vaultDocs.filter(d => d.id !== id) });
        track(pushDelete("vault_docs", id));
      },

      addPressItem: (p) => {
        const item: PressItem = { ...p, id: uid(), createdAt: today() };
        set({ pressItems: [item, ...get().pressItems] });
        track(pushInsert("press_items", item));
        return item;
      },
      updatePressItem: (id, patch) => {
        set({ pressItems: get().pressItems.map(p => p.id === id ? { ...p, ...patch } : p) });
        track(pushUpdate("press_items", id, patch));
      },
      deletePressItem: (id) => {
        set({ pressItems: get().pressItems.filter(p => p.id !== id) });
        track(pushDelete("press_items", id));
      },

      markVaultOnboarded: () => set({ vaultOnboarded: true }),

      connectInbox: (c) => {
        const seed: FlaggedEmail[] = get().flaggedEmails.length ? get().flaggedEmails : mockFlaggedEmails();
        const isNewSeed = !get().flaggedEmails.length;
        set({ inboxConnection: c, flaggedEmails: seed });
        track(pushInboxConnection(c));
        if (isNewSeed) seed.forEach(e => track(pushInsert("flagged_emails", e)));
      },
      disconnectInbox: () => {
        set({ inboxConnection: null });
        track(pushInboxConnection(null));
      },
      updateFlaggedEmail: (id, patch) => {
        set({ flaggedEmails: get().flaggedEmails.map(e => e.id === id ? { ...e, ...patch } : e) });
        track(pushUpdate("flagged_emails", id, patch));
      },

      addContentIdea: (i) => {
        const item: ContentIdea = { ...i, id: uid(), createdAt: today() };
        set({ contentIdeas: [item, ...get().contentIdeas] });
        track(pushInsert("content_ideas", item));
        return item;
      },
      updateContentIdea: (id, patch) => {
        set({ contentIdeas: get().contentIdeas.map(i => i.id === id ? { ...i, ...patch } : i) });
        track(pushUpdate("content_ideas", id, patch));
      },
      deleteContentIdea: (id) => {
        set({ contentIdeas: get().contentIdeas.filter(i => i.id !== id) });
        track(pushDelete("content_ideas", id));
      },

      addCaptionDraft: (c) => {
        const item: CaptionDraft = { ...c, id: uid(), createdAt: today() };
        set({ captionDrafts: [item, ...get().captionDrafts] });
        track(pushInsert("caption_drafts", item));
        return item;
      },
      updateCaptionDraft: (id, patch) => {
        set({ captionDrafts: get().captionDrafts.map(c => c.id === id ? { ...c, ...patch } : c) });
        track(pushUpdate("caption_drafts", id, patch));
      },
      deleteCaptionDraft: (id) => {
        set({ captionDrafts: get().captionDrafts.filter(c => c.id !== id) });
        track(pushDelete("caption_drafts", id));
      },

      addScheduledPost: (p) => {
        const item: ScheduledPost = { ...p, id: uid() };
        set({ scheduledPosts: [item, ...get().scheduledPosts] });
        track(pushInsert("scheduled_posts", item));
        return item;
      },
      updateScheduledPost: (id, patch) => {
        set({ scheduledPosts: get().scheduledPosts.map(p => p.id === id ? { ...p, ...patch } : p) });
        track(pushUpdate("scheduled_posts", id, patch));
      },
      deleteScheduledPost: (id) => {
        set({ scheduledPosts: get().scheduledPosts.filter(p => p.id !== id) });
        track(pushDelete("scheduled_posts", id));
      },

      addNewsletter: (n) => {
        const item: Newsletter = { ...n, id: uid() };
        set({ newsletters: [item, ...get().newsletters] });
        track(pushInsert("newsletters", item));
        return item;
      },
      updateNewsletter: (id, patch) => {
        set({ newsletters: get().newsletters.map(n => n.id === id ? { ...n, ...patch } : n) });
        track(pushUpdate("newsletters", id, patch));
      },
      deleteNewsletter: (id) => {
        set({ newsletters: get().newsletters.filter(n => n.id !== id) });
        track(pushDelete("newsletters", id));
      },
    }),
    {
      // Only UI preferences live in localStorage now; studio data is server-backed.
      name: "allegory.studio.prefs.v1",
      partialize: (s) => ({ customStatuses: s.customStatuses, customOpportunityTypes: s.customOpportunityTypes, vaultOnboarded: s.vaultOnboarded, todos: s.todos }),
    }
  )
);

export function mockFlaggedEmails(): FlaggedEmail[] {
  const t = Date.now();
  return [
    { id: uid(), sender: "M. Caldwell", senderEmail: "mcaldwell@private.com", subject: "Inquiry — Field Notes No. 4", preview: "I saw your piece at Foundry last month and haven't stopped thinking about it. Is it still available, and could you share pricing and dimensions?…", receivedAt: new Date(t - 2 * 3600000).toISOString(), status: "needs_reply" },
    { id: uid(), sender: "J. Park, Foundry Gallery", senderEmail: "jp@foundry.gallery", subject: "Studio visit + group show in spring", preview: "We're curating a group exhibition opening in March and your recent work feels like a strong fit. Could we schedule a studio visit in the next few weeks?…", receivedAt: new Date(t - 26 * 3600000).toISOString(), status: "needs_reply" },
    { id: uid(), sender: "Aperture Editors", senderEmail: "openings@aperture.org", subject: "Re: Submission received — New Geographies", preview: "Following up on our last note — wanted to confirm you received the editorial committee's questions from two weeks ago…", receivedAt: new Date(t - 9 * 86400000).toISOString(), status: "awaiting_response" },
    { id: uid(), sender: "Creative Capital Digest", senderEmail: "newsletter@creative-capital.org", subject: "This week: MacDowell residency open call closes Jan 15", preview: "…also in this issue: new grant from the Pollock-Krasner Foundation (deadline Feb 1), and the Rauschenberg Residency is accepting applications through March…", receivedAt: new Date(t - 12 * 3600000).toISOString(), status: "fyi" },
    { id: uid(), sender: "S. Okafor", senderEmail: "sokafor@artconsultancy.co", subject: "Following up — collector placement", preview: "Circling back on my note from three weeks ago. I have a client actively looking for a work in the scale we discussed and would love to revisit…", receivedAt: new Date(t - 21 * 86400000).toISOString(), status: "needs_reply" },
  ];
}

// derived selectors
export const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
export const daysSince = (iso: string) => Math.ceil((Date.now() - new Date(iso).getTime()) / 86400000);
