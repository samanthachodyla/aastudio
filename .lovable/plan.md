# Profile Vault Tiering + Consignment Agreements

A large, multi-module change. Plan below is grouped so it can be reviewed end-to-end before any code is written.

## Part 1 — Profile Vault tiering

**Make Profile Vault accessible to Starter (Lite) instead of fully locked.**

- Remove `/profile-vault` from `PRO_MODULES` in `src/lib/tier.ts` so `TierGate` lets Starter through.
- Add a small `useTier()`-driven `isPro` flag inside `ProfileVault.tsx`.
- Lite caps (enforced client-side against the existing zustand store):
  - 1 bio, 1 statement, 1 CV, 1 headshot, ≤10 work images.
  - When a Starter user hits a cap or opens a Pro-only surface, render an inline `UpgradeCard` (new small component) with the warm copy from the brief and a CTA `<Link to="/pricing">`.
- Pro-only surfaces inside the module (rendered as locked cards for Starter):
  - Bio variants library (gallery / grant / press / social tags).
  - Statement library + "Tailor to opportunity" generator (button stub — calls existing `marketing-intelligence` style edge function only on Pro; on Lite shows upgrade card).
  - Press & Publications log.
  - Headshot library (multiple).
  - Work image metadata fields beyond title/year/medium.
- Onboarding moment for Starter first-open: if the vault is empty, show a single full-width "Upload your CV, bio, or statement" panel that runs the existing parse flow and then reveals the populated fields with the line *"Here's your professional profile, organized and ready to use."* Persist a `vaultOnboarded` flag in the store so it only fires once.

No backend schema changes — Profile Vault data already lives in `vaultDocs`. New optional fields (`tags`, `context`, `metadata`) are added to `VaultDoc` and a new `pressItems: PressItem[]` array to the store (persisted via existing `persist` middleware).

## Part 2 — Consignment Agreements inside Inventory

Consignments already exist in the store as `Consignment[]`. We expand the shape and surface them as a tab inside Inventory.

### Data model (in `src/lib/types.ts`)
Extend `Consignment` with:
```
consigneeContactId?: string
dateOut: string
expectedReturn?: string
splitType: "percent" | "flat"
splitValue: number          // 50 = 50%  OR  flat amount
agreedPrice: number
paymentTerms: "net30" | "net60" | "immediate" | "custom"
customTerms?: string
status: "active" | "returned" | "sold"
notes?: string
documentUrl?: string        // signed agreement upload
generatedAgreementUrl?: string
```
Extend `Artwork.status` options to include `in_transit` and `in_storage` (already has `in_studio`, `on_consignment`, `sold`, `loaned`).

### Inventory UI (`src/pages/Inventory.tsx`)
Wrap existing content in `Tabs`:
- **Tab 1 — Inventory** (current grid, unchanged).
- **Tab 2 — Consignments** (new view): table of artworks whose status is `on_consignment`, joined to their `Consignment` record. Columns: thumb, title/year/medium, consignee (link to Contact), date out / expected return, days remaining, agreed price, split, status pill, quick actions (Mark Sold, Mark Returned, Extend, View Agreement). Sort dropdown: consignee / date out / days remaining / retail value.

When an artwork's status is changed to "On Consignment" (in the existing add/edit dialog), reveal a Consignment Agreement sub-form that creates the linked `Consignment` record. Consignee picker pulls from `contacts`, with "+ New contact" inline.

### Cross-module flow
- **Mark Sold** → opens Sales & Finance new-invoice dialog (existing route + dialog) pre-filled: artwork, sale price = `agreedPrice`, split auto-applied, buyer contact picker. On save, sets artwork to `sold`, sets consignment to `sold`, and creates an Opportunity-style payment reminder based on `paymentTerms` (Net 30 → due in 30 days) by inserting into `opportunities` with kind `payment_due`.
- **Mark Returned** → artwork back to `in_studio`, consignment to `returned` (kept in history, hidden from default list by status filter).

### Tier-gated extras (Pro only)
Two buttons in the Consignments tab header, with `Pro` badge for Starter:
1. **Generate consignment statement (PDF)** — for a selected consignee, renders a branded PDF listing every active artwork + terms + totals. Implemented client-side with `jspdf` (already common in similar Lovable projects; will `bun add jspdf` if not present). Uses artist info from Profile Vault.
2. **Agreement Builder** — multi-step dialog (parties → artworks → terms → review) producing a clean PDF using the same `jspdf` pipeline. Saves the PDF as a data URL into `consignment.generatedAgreementUrl`. Includes the footer note *"This document is a starting point. We recommend reviewing with a qualified advisor before signing."*

For Starter, both buttons open an `UpgradeCard` dialog with the brief's copy.

## Part 3 — Pricing page (`src/pages/Pricing.tsx`)

- Move `Profile Vault` out of the Pro-only `PRO_MODULES` list into a shared row with the "Lite vs Full" distinction.
- Add the brief's comparison rows to `COMPARE_ROWS`:
  - Profile Vault sub-rows: artist bio, statement, CV, work images, headshot, press log.
  - Consignments sub-rows: tracking, document storage, reminders, sale flow, statement generator, agreement builder.
- Support a new row shape `{ label, starter: string | boolean, pro: string | boolean }` so we can render "1 version" vs "Unlimited variants" instead of just ✓/✗. Render strings in the cell when present, otherwise the existing check/dash icons.
- Add to Pro benefit list: *"Build a profile library that adapts to every opportunity — and generate professional consignment agreements and statements in seconds, all pulled from your existing inventory."*
- Add tooltips (via existing `Tooltip` primitives) on the Profile Vault and Agreement Builder rows with the brief's hover copy.

## Part 4 — Navigation & gating

- Sidebar: Profile Vault no longer shows a Pro lock (it's now Starter-accessible). Communications, Marketing, Studio Manager keep their existing lock icons.
- Inside Profile Vault and Consignments, locked sub-features render inline upgrade cards rather than blocking the route.
- All upgrade CTAs link to `/pricing`.

## Files touched

- `src/lib/tier.ts` — remove `/profile-vault` from PRO_MODULES.
- `src/lib/types.ts` — extend `Consignment`, `VaultDoc`, add `PressItem`, extend `ArtworkStatus`.
- `src/lib/store.ts` — add press items, `vaultOnboarded` flag, helpers for consignment status changes.
- `src/pages/ProfileVault.tsx` — Lite/Full split, onboarding panel, upgrade cards, press log, bio variants, statement library.
- `src/pages/Inventory.tsx` — Tabs wrapper + new Consignments view + agreement sub-form.
- `src/pages/Sales.tsx` — accept query-param pre-fill (`?fromConsignment=<id>`) for sale flow.
- `src/pages/Pricing.tsx` — updated rows, sub-rows, string cell support, tooltips, Pro copy.
- `src/components/UpgradeCard.tsx` *(new)* — reusable inline upgrade nudge.
- `src/components/ConsignmentAgreementForm.tsx` *(new)* — sub-form rendered inside the artwork dialog.
- `src/components/ConsignmentStatementPdf.ts` *(new)* — `jspdf` generator for statements.
- `src/components/ConsignmentAgreementBuilder.tsx` *(new)* — Pro-only dialog + PDF builder.

## Out of scope (call out)

- No real e-signature integration; signed-agreement upload is just a file URL slot.
- PDF generation is client-side (`jspdf`); no edge function needed.
- No new Supabase tables — all data stays in the existing local zustand store, matching the rest of the app.

## Technical notes

- `jspdf` is the chosen PDF lib for consistency with how artist-facing exports are typically handled in this codebase; will install if missing.
- New optional fields on `Consignment` and `VaultDoc` are additive — existing persisted store data continues to load without migration.
- Pre-fill of Sales form via query params keeps modules decoupled (no new shared dialog state).

Estimated scope: ~10 files, mostly additive. No DB or auth changes.
