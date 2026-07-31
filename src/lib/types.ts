export type ArtworkStatus = "in_studio" | "on_consignment" | "sold" | "donated" | "loaned" | "nfs" | "in_transit" | "in_storage" | (string & {});

export interface Artwork {
  id: string;
  title: string;
  year: number;
  medium: string;
  dimensions: string; // free text e.g. "30 x 40 in"
  edition?: string;
  price: number; // in cents to avoid float issues? keep dollars for simplicity
  status: ArtworkStatus;
  location?: string; // gallery/collector/institution
  imageUrl?: string;
  createdAt: string;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface Invoice {
  id: string;
  number: string;
  artworkId: string; // empty string when using customWork
  customWork?: {
    title: string;
    year?: number;
    medium?: string;
    dimensions?: string;
  };
  buyerName: string;
  buyerEmail?: string;
  buyerPhone?: string;
  billingAddress?: string;
  shippingAddress?: string;
  shippingSameAsBilling?: boolean;
  // legacy / fallback
  buyerAddress?: string;
  amount: number;
  paymentTerms?: string;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt?: string;
  paidAt?: string;
}

export type ConsignmentStatus = "draft" | "sent" | "active" | "expired" | "returned" | "sold";
export type ConsignmentPaymentTerms = "immediate" | "net30" | "net60" | "custom";
export type ConsignmentSplitType = "percent" | "flat";

export interface Consignment {
  id: string;
  artworkId: string;
  galleryName: string;
  contactName?: string;
  contactEmail?: string;
  consigneeContactId?: string;          // optional CRM link
  commissionPct: number;                // legacy
  startDate: string;                    // legacy "date out"
  endDate: string;                      // legacy "expected return"
  status: ConsignmentStatus;
  // New (all optional for back-compat with existing seed data):
  dateOut?: string;
  expectedReturn?: string;
  splitType?: ConsignmentSplitType;
  splitValue?: number;                  // 50 = 50% OR a flat dollar amount
  agreedPrice?: number;
  paymentTerms?: ConsignmentPaymentTerms;
  customTerms?: string;
  notes?: string;
  documentUrl?: string;                 // signed PDF (data URL)
  documentName?: string;
  generatedAgreementHtml?: string;      // builder output
  generatedAgreementAt?: string;
}

export type OpportunityType = "open_call" | "residency" | "prize" | "show" | "grant" | "commission" | "delivery" | (string & {});
export type OpportunityStatus = "researching" | "applying" | "submitted" | "accepted" | "declined" | "withdrawn";

/** A file attached to an opportunity (PDF / image / doc), stored as a data URL.
 *  Kept on-device (localStorage) so it never blocks the opportunity's DB write. */
export interface OppAttachment {
  id: string;
  name: string;
  mime: string;
  size: number;      // bytes
  dataUrl: string;   // base64 data URL
  addedAt: string;   // ISO
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  deadline: string;
  type: OpportunityType;
  status: OpportunityStatus;
  notes?: string;
  link?: string;
  fee?: number;
  requirements?: string;
  award?: string;
  /** Id of a Profile Vault document (bio/statement/CV) linked to this opportunity,
   *  so you can pull up the right file and tailor it to the application's specifics. */
  vaultDocId?: string;
}

export type ContactType = "gallery" | "collector" | "consultant" | "subcontractor" | "press" | "curator" | "peer" | "other";
export type ContactStage = "prospect" | "warm" | "active" | "vip" | "dormant";
export type InteractionKind = "visit" | "email" | "call" | "meeting" | "sale" | "exhibition" | "note";

export interface Interaction {
  id: string;
  kind: InteractionKind;
  date: string;          // ISO
  summary: string;
}

export interface Contact {
  id: string;
  name: string;
  type: ContactType;
  stage: ContactStage;
  email?: string;
  phone?: string;
  location?: string;     // city / region
  tags?: string[];
  notes?: string;
  interactions?: Interaction[];
  lastInteractionAt?: string;   // ISO, derived/maintained
  followUpAt?: string;
}

// ============== Sales Leads ==============
export type LeadStatus = "new" | "following_up" | "negotiating" | "won" | "lost";

export interface Lead {
  id: string;
  name: string;             // person or organization
  contactInfo?: string;     // email / phone / handle
  interest?: string;        // artwork title or area of interest
  notes?: string;           // freeform notes
  status: LeadStatus;
  followUpAt?: string;      // ISO date
  createdAt: string;
  updatedAt: string;
}

// ============== Expenses ==============
export type ExpenseCategory =
  | "studio_rent" | "materials" | "framing" | "marketing"
  | "equipment" | "fees_commissions" | "other"
  // legacy values retained for back-compat with older logged expenses
  | "shipping" | "travel";

export type ExpenseFrequency = "monthly" | "quarterly" | "annual";

// Tag only — never store actual card/account numbers.
export type PaymentType = "debit_card" | "credit_card" | "cash" | "check" | "bank_transfer" | "other";

export interface Expense {
  id: string;
  date: string;          // ISO
  category: ExpenseCategory;
  amount: number;        // dollars
  description?: string;  // short label, e.g. "Framing materials"
  vendor?: string;       // legacy: who you paid
  notes?: string;
  recurring?: boolean;
  frequency?: ExpenseFrequency;   // set when recurring
  paymentType?: PaymentType;
  createdAt: string;
}

// ============== Dashboard To-Dos ==============
// Local-only (persisted to localStorage, not server-backed).
export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

// ============== Profile Vault ==============
export type VaultDocKind = "statement" | "bio" | "cv" | "headshot" | "work_image";
export type BioContext = "general" | "gallery" | "grant" | "press" | "social";
export type StatementContext = "general" | "residency" | "grant" | "gallery" | "commission";

export interface WorkImageMeta {
  year?: number;
  medium?: string;
  dimensions?: string;
  location?: string;
  pressHistory?: string;
}

export interface VaultDoc {
  id: string;
  kind: VaultDocKind;
  title: string;
  body?: string;
  fileName?: string;
  fileData?: string;
  notes?: string;
  context?: BioContext | StatementContext | string;
  tags?: string[];
  meta?: WorkImageMeta;
  updatedAt: string;
  createdAt: string;
}

export interface PressItem {
  id: string;
  title: string;
  outlet: string;
  date: string;        // ISO
  link?: string;
  excerpt?: string;
  createdAt: string;
}

// ============== Communications Hub ==============
export type InboxProvider = "gmail" | "outlook" | "instagram";
export type FlagStatus = "needs_reply" | "awaiting_response" | "fyi" | "resolved";

export interface InboxConnection {
  provider: InboxProvider;
  email: string;
  connectedAt: string;
}

export interface FlaggedEmail {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  receivedAt: string;
  status: FlagStatus;
}

// ============== Marketing Assistant ==============
export type SocialPlatform = "instagram" | "newsletter" | "facebook" | "linkedin";
export type IdeaStatus = "idea" | "in_progress" | "scheduled" | "posted";

export interface ContentIdea {
  id: string;
  platform: SocialPlatform;
  description: string;
  status: IdeaStatus;
  createdAt: string;
}

export type CaptionStatus = "draft" | "ready" | "posted";

export interface CaptionDraft {
  id: string;
  platform: SocialPlatform;
  artworkId?: string;
  text: string;
  status: CaptionStatus;
  createdAt: string;
}

export type ScheduleStatus = "scheduled" | "posted";

export interface ScheduledPost {
  id: string;
  date: string;        // ISO
  platform: SocialPlatform;
  content: string;
  hashtags?: string;
  imageBase64?: string;
  captionDraftId?: string;
  status: ScheduleStatus;
}

export type NewsletterStatus = "draft" | "scheduled" | "sent";

export interface Newsletter {
  id: string;
  subject: string;
  bodyHtml: string;
  status: NewsletterStatus;
  date: string;        // created or sent date
  sentAt?: string;
}
