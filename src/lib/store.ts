import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Artwork, Invoice, Consignment, Opportunity, Contact, Lead, Interaction, Expense,
  VaultDoc, PressItem, InboxConnection, FlaggedEmail, FlagStatus,
  ContentIdea, CaptionDraft, ScheduledPost, Newsletter,
} from "./types";

interface State {
  artworks: Artwork[];
  invoices: Invoice[];
  consignments: Consignment[];
  opportunities: Opportunity[];
  contacts: Contact[];
  leads: Lead[];
  expenses: Expense[];

  vaultDocs: VaultDoc[];
  pressItems: PressItem[];
  vaultOnboarded: boolean;
  inboxConnection: InboxConnection | null;
  flaggedEmails: FlaggedEmail[];

  contentIdeas: ContentIdea[];
  captionDrafts: CaptionDraft[];
  scheduledPosts: ScheduledPost[];
  newsletters: Newsletter[];

  customStatuses: string[];
  addCustomStatus: (label: string) => void;

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

  seedDemo: () => void;
  resetAll: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString();

const seedArtworks: Artwork[] = [
  { id: "aw1", title: "Field Notes No. 4", year: 2024, medium: "Oil on linen", dimensions: "36 × 48 in", price: 4800, status: "on_consignment", location: "Pace Editions", createdAt: today() },
  { id: "aw2", title: "Quiet Hours", year: 2024, medium: "Graphite on paper", dimensions: "22 × 30 in", price: 1600, status: "in_studio", createdAt: today() },
  { id: "aw3", title: "Margin / Edge", year: 2023, medium: "Mixed media", dimensions: "48 × 60 in", price: 7200, status: "sold", location: "Private collection, NY", createdAt: today() },
  { id: "aw4", title: "Untitled (Cyanotype)", year: 2024, medium: "Cyanotype on cotton", dimensions: "16 × 20 in, edition of 5", edition: "1/5", price: 900, status: "in_studio", createdAt: today() },
  { id: "aw5", title: "Slow Light", year: 2023, medium: "Oil on panel", dimensions: "24 × 24 in", price: 3200, status: "on_consignment", location: "Foundry Gallery", createdAt: today() },
];

const seedInvoices: Invoice[] = [
  { id: "in1", number: "AS-1003", artworkId: "aw3", buyerName: "L. Nakamura", amount: 7200, status: "paid", issuedAt: today(), paidAt: today(), paymentTerms: "Net 14" },
  { id: "in2", number: "AS-1004", artworkId: "aw1", buyerName: "Halsey Foundation", amount: 4800, status: "sent", issuedAt: today(), dueAt: new Date(Date.now() + 7 * 86400000).toISOString(), paymentTerms: "Net 30" },
  { id: "in3", number: "AS-1005", artworkId: "aw5", buyerName: "M. Ortiz", amount: 3200, status: "overdue", issuedAt: new Date(Date.now() - 45 * 86400000).toISOString(), dueAt: new Date(Date.now() - 15 * 86400000).toISOString(), paymentTerms: "Net 30" },
];

const seedConsignments: Consignment[] = [
  { id: "co1", artworkId: "aw1", galleryName: "Pace Editions", contactName: "R. Singh", commissionPct: 50, startDate: new Date(Date.now() - 100 * 86400000).toISOString(), endDate: new Date(Date.now() + 80 * 86400000).toISOString(), status: "active" },
  { id: "co2", artworkId: "aw5", galleryName: "Foundry Gallery", contactName: "J. Park", commissionPct: 40, startDate: new Date(Date.now() - 120 * 86400000).toISOString(), endDate: new Date(Date.now() + 60 * 86400000).toISOString(), status: "active" },
];

const seedOpportunities: Opportunity[] = [
  { id: "op1", title: "MacDowell Fellowship — Fall", organization: "MacDowell", deadline: new Date(Date.now() + 4 * 86400000).toISOString(), type: "residency", status: "applying" },
  { id: "op2", title: "Open Call: New Geographies", organization: "Aperture", deadline: new Date(Date.now() + 12 * 86400000).toISOString(), type: "open_call", status: "researching" },
  { id: "op3", title: "Pollock-Krasner Grant", organization: "Pollock-Krasner Foundation", deadline: new Date(Date.now() + 25 * 86400000).toISOString(), type: "grant", status: "researching" },
  { id: "op4", title: "Storefront Group Show", organization: "Storefront Projects", deadline: new Date(Date.now() - 10 * 86400000).toISOString(), type: "show", status: "submitted" },
];

const seedContacts: Contact[] = [
  {
    id: "ct1", name: "R. Singh", type: "gallery", stage: "active",
    email: "rs@paceeditions.com", phone: "+1 212 555 0142", location: "New York, NY",
    tags: ["primary gallery", "editions"],
    notes: "Director, Pace Editions. Prefers studio visits on Thursdays.",
    lastInteractionAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    followUpAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    interactions: [
      { id: uid(), kind: "email", date: new Date(Date.now() - 6 * 86400000).toISOString(), summary: "Confirmed extension on Field Notes consignment." },
      { id: uid(), kind: "visit", date: new Date(Date.now() - 40 * 86400000).toISOString(), summary: "Studio visit — reviewed new oil works." },
      { id: uid(), kind: "sale", date: new Date(Date.now() - 90 * 86400000).toISOString(), summary: "Placed Slow Light with private collector." },
    ],
  },
  {
    id: "ct2", name: "L. Nakamura", type: "collector", stage: "vip",
    email: "ln@example.com", location: "San Francisco, CA",
    tags: ["acquired 2024", "patron"],
    notes: "Acquired Margin / Edge. Quietly building a collection focused on works on paper.",
    lastInteractionAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    interactions: [
      { id: uid(), kind: "email", date: new Date(Date.now() - 14 * 86400000).toISOString(), summary: "Asked about installation lighting for Margin / Edge." },
      { id: uid(), kind: "sale", date: new Date(Date.now() - 60 * 86400000).toISOString(), summary: "Purchased Margin / Edge — invoice AS-1003." },
    ],
  },
  {
    id: "ct3", name: "J. Park", type: "gallery", stage: "active",
    email: "jp@foundry.gallery", location: "Los Angeles, CA",
    tags: ["west coast"],
    notes: "Foundry Gallery — represents West Coast program.",
    lastInteractionAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    followUpAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    interactions: [
      { id: uid(), kind: "email", date: new Date(Date.now() - 30 * 86400000).toISOString(), summary: "Sent catalog proof for review." },
    ],
  },
  {
    id: "ct4", name: "M. Ortiz", type: "collector", stage: "warm",
    email: "mortiz@example.com", location: "Mexico City",
    tags: ["lead", "follow up"],
    notes: "Met at Foundry opening. Considering Slow Light.",
    lastInteractionAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    followUpAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    interactions: [
      { id: uid(), kind: "meeting", date: new Date(Date.now() - 45 * 86400000).toISOString(), summary: "Studio visit during Foundry opening week." },
    ],
  },
  {
    id: "ct5", name: "Aperture Editors", type: "press", stage: "prospect",
    email: "openings@aperture.org", location: "New York, NY",
    tags: ["editorial"],
    notes: "Submitted for New Geographies. Awaiting committee review.",
    lastInteractionAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

const seedLeads: Lead[] = [
  { id: "ld1", name: "A. Whitfield", contactInfo: "aw@collectorsmail.com", interest: "Quiet Hours", notes: "Saw the work at the open studio. Interested in pricing on the smaller pieces.", status: "following_up", followUpAt: new Date(Date.now() + 3 * 86400000).toISOString(), createdAt: today(), updatedAt: today() },
  { id: "ld2", name: "Halsey Foundation", contactInfo: "acquisitions@halsey.org", interest: "Field Notes series", notes: "Acquisitions committee reviews quarterly. Send updated CV and statement before Sept.", status: "negotiating", followUpAt: new Date(Date.now() + 10 * 86400000).toISOString(), createdAt: today(), updatedAt: today() },
  { id: "ld3", name: "T. Berman", contactInfo: "tb@example.com", interest: "Cyanotype editions", notes: "Asked about availability of a second edition print.", status: "new", createdAt: today(), updatedAt: today() },
];

const seedExpenses: Expense[] = [
  { id: "ex1", date: new Date(Date.now() - 8 * 86400000).toISOString(), category: "materials", amount: 340, description: "Linen, gesso, brushes from Blick", createdAt: today() },
  { id: "ex2", date: new Date(Date.now() - 22 * 86400000).toISOString(), category: "studio_rent", amount: 1850, description: "Studio rent — current month", createdAt: today() },
  { id: "ex3", date: new Date(Date.now() - 40 * 86400000).toISOString(), category: "framing", amount: 480, description: "Framing for Margin / Edge", createdAt: today() },
  { id: "ex4", date: new Date(Date.now() - 60 * 86400000).toISOString(), category: "marketing", amount: 220, description: "Mailchimp annual + studio cards", createdAt: today() },
];


export const useStore = create<State>()(
  persist(
    (set, get) => ({
      artworks: seedArtworks,
      invoices: seedInvoices,
      consignments: seedConsignments,
      opportunities: seedOpportunities,
      contacts: seedContacts,
      leads: seedLeads,
      expenses: seedExpenses,
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
      addCustomStatus: (label) => {
        const v = label.trim();
        if (!v) return;
        if (get().customStatuses.includes(v)) return;
        set({ customStatuses: [...get().customStatuses, v] });
      },

      addArtwork: (a) => {
        const item: Artwork = { ...a, id: uid(), createdAt: today() };
        set({ artworks: [item, ...get().artworks] });
        return item;
      },
      updateArtwork: (id, patch) => set({ artworks: get().artworks.map(a => a.id === id ? { ...a, ...patch } : a) }),
      deleteArtwork: (id) => set({ artworks: get().artworks.filter(a => a.id !== id) }),

      addInvoice: (i) => {
        const number = "AS-" + (1000 + get().invoices.length + 6).toString();
        const item: Invoice = { ...i, id: uid(), number, issuedAt: today() };
        set({ invoices: [item, ...get().invoices] });
        return item;
      },
      updateInvoice: (id, patch) => {
        set({ invoices: get().invoices.map(v => v.id === id ? { ...v, ...patch } : v) });
        // auto-update artwork status when invoice marked paid (skip custom works)
        if (patch.status === "paid") {
          const inv = get().invoices.find(v => v.id === id);
          if (inv && inv.artworkId) get().updateArtwork(inv.artworkId, { status: "sold" });
        }
      },
      deleteInvoice: (id) => set({ invoices: get().invoices.filter(v => v.id !== id) }),

      addConsignment: (c) => {
        const item: Consignment = { ...c, id: uid() };
        set({ consignments: [item, ...get().consignments] });
        if (c.status === "active") get().updateArtwork(c.artworkId, { status: "on_consignment", location: c.galleryName });
        return item;
      },
      updateConsignment: (id, patch) => {
        set({ consignments: get().consignments.map(c => c.id === id ? { ...c, ...patch } : c) });
        if (patch.status === "active") {
          const c = get().consignments.find(x => x.id === id);
          if (c) get().updateArtwork(c.artworkId, { status: "on_consignment", location: c.galleryName });
        }
        if (patch.status === "returned") {
          const c = get().consignments.find(x => x.id === id);
          if (c) get().updateArtwork(c.artworkId, { status: "in_studio", location: undefined });
        }
      },
      deleteConsignment: (id) => set({ consignments: get().consignments.filter(c => c.id !== id) }),

      addOpportunity: (o) => {
        const item: Opportunity = { ...o, id: uid() };
        set({ opportunities: [item, ...get().opportunities] });
        return item;
      },
      updateOpportunity: (id, patch) => set({ opportunities: get().opportunities.map(o => o.id === id ? { ...o, ...patch } : o) }),
      deleteOpportunity: (id) => set({ opportunities: get().opportunities.filter(o => o.id !== id) }),

      addContact: (c) => {
        const item: Contact = { ...c, id: uid() };
        set({ contacts: [item, ...get().contacts] });
        return item;
      },
      updateContact: (id, patch) => set({ contacts: get().contacts.map(c => c.id === id ? { ...c, ...patch } : c) }),
      deleteContact: (id) => set({ contacts: get().contacts.filter(c => c.id !== id) }),
      addInteraction: (contactId, i) => {
        const interaction: Interaction = { ...i, id: uid() };
        set({
          contacts: get().contacts.map(c => c.id === contactId ? {
            ...c,
            interactions: [interaction, ...(c.interactions ?? [])],
            lastInteractionAt: interaction.date > (c.lastInteractionAt ?? "") ? interaction.date : c.lastInteractionAt,
          } : c),
        });
      },
      deleteInteraction: (contactId, interactionId) => {
        set({
          contacts: get().contacts.map(c => {
            if (c.id !== contactId) return c;
            const interactions = (c.interactions ?? []).filter(x => x.id !== interactionId);
            const lastInteractionAt = interactions.length
              ? interactions.reduce((m, x) => x.date > m ? x.date : m, interactions[0].date)
              : undefined;
            return { ...c, interactions, lastInteractionAt };
          }),
        });
      },

      addLead: (l) => {
        const item: Lead = { ...l, id: uid(), createdAt: today(), updatedAt: today() };
        set({ leads: [item, ...get().leads] });
        return item;
      },
      updateLead: (id, patch) =>
        set({ leads: get().leads.map(l => l.id === id ? { ...l, ...patch, updatedAt: today() } : l) }),
      deleteLead: (id) => set({ leads: get().leads.filter(l => l.id !== id) }),

      addExpense: (e) => {
        const item: Expense = { ...e, id: uid(), createdAt: today() };
        set({ expenses: [item, ...get().expenses] });
        return item;
      },
      updateExpense: (id, patch) =>
        set({ expenses: get().expenses.map(e => e.id === id ? { ...e, ...patch } : e) }),
      deleteExpense: (id) => set({ expenses: get().expenses.filter(e => e.id !== id) }),

      addVaultDoc: (d) => {
        const item: VaultDoc = { ...d, id: uid(), createdAt: today(), updatedAt: today() };
        set({ vaultDocs: [item, ...get().vaultDocs] });
        return item;
      },
      updateVaultDoc: (id, patch) =>
        set({ vaultDocs: get().vaultDocs.map(d => d.id === id ? { ...d, ...patch, updatedAt: today() } : d) }),
      deleteVaultDoc: (id) => set({ vaultDocs: get().vaultDocs.filter(d => d.id !== id) }),

      addPressItem: (p) => {
        const item: PressItem = { ...p, id: uid(), createdAt: today() };
        set({ pressItems: [item, ...get().pressItems] });
        return item;
      },
      updatePressItem: (id, patch) =>
        set({ pressItems: get().pressItems.map(p => p.id === id ? { ...p, ...patch } : p) }),
      deletePressItem: (id) => set({ pressItems: get().pressItems.filter(p => p.id !== id) }),

      markVaultOnboarded: () => set({ vaultOnboarded: true }),

      connectInbox: (c) => {
        // seed mock flagged emails on first connect
        const seed: FlaggedEmail[] = get().flaggedEmails.length ? get().flaggedEmails : mockFlaggedEmails();
        set({ inboxConnection: c, flaggedEmails: seed });
      },
      disconnectInbox: () => set({ inboxConnection: null }),
      updateFlaggedEmail: (id, patch) =>
        set({ flaggedEmails: get().flaggedEmails.map(e => e.id === id ? { ...e, ...patch } : e) }),

      addContentIdea: (i) => {
        const item: ContentIdea = { ...i, id: uid(), createdAt: today() };
        set({ contentIdeas: [item, ...get().contentIdeas] });
        return item;
      },
      updateContentIdea: (id, patch) =>
        set({ contentIdeas: get().contentIdeas.map(i => i.id === id ? { ...i, ...patch } : i) }),
      deleteContentIdea: (id) => set({ contentIdeas: get().contentIdeas.filter(i => i.id !== id) }),

      addCaptionDraft: (c) => {
        const item: CaptionDraft = { ...c, id: uid(), createdAt: today() };
        set({ captionDrafts: [item, ...get().captionDrafts] });
        return item;
      },
      updateCaptionDraft: (id, patch) =>
        set({ captionDrafts: get().captionDrafts.map(c => c.id === id ? { ...c, ...patch } : c) }),
      deleteCaptionDraft: (id) => set({ captionDrafts: get().captionDrafts.filter(c => c.id !== id) }),

      addScheduledPost: (p) => {
        const item: ScheduledPost = { ...p, id: uid() };
        set({ scheduledPosts: [item, ...get().scheduledPosts] });
        return item;
      },
      updateScheduledPost: (id, patch) =>
        set({ scheduledPosts: get().scheduledPosts.map(p => p.id === id ? { ...p, ...patch } : p) }),
      deleteScheduledPost: (id) => set({ scheduledPosts: get().scheduledPosts.filter(p => p.id !== id) }),

      addNewsletter: (n) => {
        const item: Newsletter = { ...n, id: uid() };
        set({ newsletters: [item, ...get().newsletters] });
        return item;
      },
      updateNewsletter: (id, patch) =>
        set({ newsletters: get().newsletters.map(n => n.id === id ? { ...n, ...patch } : n) }),
      deleteNewsletter: (id) => set({ newsletters: get().newsletters.filter(n => n.id !== id) }),

      seedDemo: () => set({
        artworks: seedArtworks, invoices: seedInvoices, consignments: seedConsignments,
        opportunities: seedOpportunities, contacts: seedContacts, leads: seedLeads,
        expenses: seedExpenses,
      }),
      resetAll: () => set({
        artworks: [], invoices: [], consignments: [], opportunities: [], contacts: [], leads: [],
        expenses: [],
        vaultDocs: [], inboxConnection: null, flaggedEmails: [],
        contentIdeas: [], captionDrafts: [], scheduledPosts: [], newsletters: [],
      }),
    }),
    { name: "allegory-studio-v1" }
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
