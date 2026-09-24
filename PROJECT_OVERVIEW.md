# Allegory Art Studio — Project Overview & Working Context

> **Purpose of this file:** a durable brief so a new Claude Code session can get fully up to speed without re-explaining. In a new conversation, say *"read PROJECT_OVERVIEW.md and continue"*.
> Last updated: 2026-09-24.

---

## 1. What this is

**Allegory Art Studio** — a subscription SaaS that is a CRM + inventory + portfolio + studio-management tool for working artists. It helps artists run the business side of their practice: inventory/cataloging, sales & invoices, consignments, exhibitions, collector outreach (CRM), a shareable portfolio, marketing/communications, and reports.

- **Owner / main contact:** Sam (Samantha Chodyla) — `sam@moresilverlinings.com`
- **Founder (brand/business):** Cara Alford (Allegory Art Consulting)
- **Live site:** https://allegoryartstudio.com — **launched** (7-day free trial live as of ~Jul 30 2026)
- Instagram: https://www.instagram.com/allegoryartstudio/

### People who come up
- **Anne** — paid-ads manager (owns the GA4 / Meta / conversion-tracking work).
- **Shelby Hamilton** — user with cross-device/inventory-duplicate/Nylas issues (`shelby@shelby-hamilton.com`).
- **Laura Dargan** — `lauramdargan@gmail.com`, set up as a **free Pro (comp)** account.
- **Cara** — founder; gets ETAs/roadmap updates.
- Melissa Hughes, Margaret, Mary Nelson, Stephanie Checton — users referenced in past support/testimonials.

---

## 2. Tech stack & architecture

- **Frontend:** React + TypeScript + Vite + Tailwind + shadcn/ui. State via **Zustand** stores (`src/lib/store.ts`).
- **Backend:** **Supabase** (Postgres + Auth + RLS). Project ref **`czbzunpabgmwpldkrcex`** (`https://czbzunpabgmwpldkrcex.supabase.co`).
- **Payments:** **Stripe** subscriptions. Hosted Checkout, **guest pay-first flow** (card + trial captured before an account exists; account created on the `/welcome` page where the user sets a password).
- **Hosting:** **Vercel** (Hobby plan — **12 serverless-function cap; currently at 12/12**; 1-hour log retention).
- **Email/inbox:** **Nylas** (Gmail/inbox connection) — `nylas_grants` table, `api/nylas/*`.
- **Fonts/design:** "Gallery White" editorial system — forest green `#11281c` + cream `#f5f3ee`, **Cormorant Garamond** (display) + **Work Sans** (body), 2px radius.

### Key directories/files
- `src/pages/` — routes (Landing, Login, Welcome, Dashboard=`Index.tsx`, Inventory, Sales, Exhibitions, Contacts, StudioManager, ProfileVault, Communications, Marketing, Pricing, Settings, Reports, Contact, Terms/Privacy/Cookies, SharedPortfolio).
- `src/pages/landing.html` — the **entire marketing homepage** as a raw HTML string (imported `?raw`), rendered via `dangerouslySetInnerHTML` in `Landing.tsx`. Behavior (forms, nav, popup) is attached in `Landing.tsx`'s `useEffect`.
- `src/lib/landingLive.ts` — `toLiveLanding()` swaps pre-launch waitlist copy → live "Start your studio / 7-day free trial" copy at runtime + build time.
- `src/lib/sync.ts` — the sync layer. `ENTITY_TABLES` maps store keys → Supabase tables (todos, artworks, invoices, consignments, opportunities, contacts, leads, expenses, vault_docs, press_items, content_ideas, caption_drafts, scheduled_posts, newsletters, flagged_emails). Plus `inbox_connections`. `migrateLocalTodos`, `overlayOutbox`, `replayOutbox`.
- `src/components/DataGate.tsx` — hydrates a user's data after auth; **auto-refreshes on tab focus/visibility** (keeps devices in sync); calls `syncAttributionToProfile`.
- `src/lib/subscription.ts` — access gate. `ACTIVE_STATUSES = active, trialing, comp, past_due`. Pro = active status **and** `plan === 'pro'`.
- `api/` — 12 Vercel functions (see §5).

---

## 3. Repo, branches & deploy flow

- **Repo:** `samanthachodyla/aastudio` (GitHub). Use the **GitHub MCP tools** (`mcp__github__*`) — no `gh` CLI in this environment.
- **Working branch:** `claude/allegory-studio-stripe-0uw3j8` — do all dev here.
- **Production / default branch:** `claude/loving-galileo-Uvg3s` — Vercel deploys from this.
- **Deploy flow:**
  1. Commit + push to the working branch.
  2. `git checkout claude/loving-galileo-Uvg3s && git merge --ff-only claude/allegory-studio-stripe-0uw3j8 && git push`
  3. `git checkout claude/allegory-studio-stripe-0uw3j8`
- **Push retries:** on network errors retry up to 4× with exponential backoff (2/4/8/16s). Always `git push -u origin <branch>`.
- **Do NOT open a PR** unless explicitly asked.
- **Verify deploys** via Vercel MCP (`mcp__Vercel__list_deployments`, project `prj_9fhJPZzvwPWH1Uz3IWQEuXd0L6zA`, team `team_kUHBA61mHBSvzem8vGBuiQag`).

---

## 4. Environment gotchas (important — these bit us)

- **Supabase MCP points at the WRONG project.** `mcp__Supabase__*` and `list_projects` here return a *different* project (`lafkbawmkxgvmmlrblff`, a healthcare/loyalty app). **Allegory's real DB is `czbzunpabgmwpldkrcex`** and is NOT reachable via the Supabase MCP from this environment. → **Give Sam SQL to run in the Allegory Supabase SQL Editor herself.** She runs it and pastes results.
- **Network policy blocks the live site from the container.** Outbound is restricted; the agent proxy returns 403 on `allegoryartstudio.com`, `google-analytics.com`, `facebook.com`, etc. So **no live browser tests of the site from here** (Playwright is installed globally at `/opt/node22`, browsers at `/opt/pw-browsers`, and must be routed through `$HTTPS_PROXY` with `ignoreHTTPSErrors`, but the hosts are still policy-denied). Network edits only take effect on a **new** session, not the running one.
- **Secrets stay out of chat.** GA4 API secret, Stripe keys, passwords — Sam enters these directly in Vercel / Supabase. Never paste secret values into chat or commit them.
- **Env var changes need a redeploy** to take effect (push a tiny commit to trigger it).

---

## 5. API functions (12/12 — at the Hobby cap)

```
api/subscribe.ts          Lead form submit → Mailchimp + Meta CAPI "Lead" (+ honeypot spam block)
api/support.ts            Support/contact form
api/admin/resync.ts       Admin resync / trial backfill
api/stripe/checkout.ts        Logged-in checkout
api/stripe/checkout-guest.ts  Guest pay-first checkout
api/stripe/finish-signup.ts   Creates the account after a paid guest checkout (the /welcome flow)
api/stripe/portal.ts          Stripe billing portal
api/stripe/webhook.ts         Stripe webhook — source of truth for subscription state + server-side conversions
api/nylas/auth.ts, callback.ts, disconnect.ts, sync.ts   Gmail/inbox connection
```
⚠️ **No room for a new API route** without consolidating two existing ones or upgrading the Vercel plan.

---

## 6. Analytics / conversion tracking (Anne's project — DONE & deployed)

Full trial-aware funnel. Every event fires **on completion, not click.**

| Funnel step | Browser (GA4 + Meta Pixel) | Server (CAPI / Measurement Protocol) | Dedup |
|---|---|---|---|
| Lead | `generate_lead` + `Lead` | `Lead` via `/api/subscribe` | shared `event_id` |
| Sign-up | `sign_up` + `CompleteRegistration` | `CompleteRegistration` | shared `signup_<sid>` |
| Trial start | `start_trial` + `StartTrial` | `StartTrial` | shared `trial_<sid>` |
| Purchase (first real payment) | — | `purchase` (GA4 MP) + `Purchase` (Meta CAPI) | server-only |

- **`sign_up` + `start_trial`** fire in the browser at checkout completion (`Welcome.tsx`, `Index.tsx`) — no 7-day wait.
- **`purchase`** fires server-side from the Stripe **`invoice.paid`** webhook (customer isn't on-site when the trial converts). `$0` trial-start invoice is skipped; **renewals excluded** via `subscriptions.first_paid_at`. Carries value/plan/`trial_used`/transaction id/internal customer id + original first-touch attribution.
- **Attribution** (`src/lib/attribution.ts`): captures first-touch (set once) + last-touch (refreshed) into localStorage on every visit — UTMs, `fbclid`, GA client id, landing page, referrer, first-visit date. Written to the customer's `profiles` row after auth (`syncAttributionToProfile` in `DataGate`). Webhook reads it back at purchase time. **No email/name/PII is ever sent to GA4.**
- **IDs (must match browser↔server):** GA4 `G-CSJ5CQZ382`; Meta Pixel `1583309690064748`.
- **Env vars in Vercel:** `GA4_MEASUREMENT_ID`, `GA4_API_SECRET`, `META_PIXEL_ID`, `META_CAPI_TOKEN` (each feature no-ops if unset).
- **GA4 setup done:** key events `generate_lead`, `sign_up`, `start_trial`, `purchase`. `generate_lead` verified firing live. The others self-confirm on first real signup / conversion.
- **DB migration:** `supabase/migrations/20260922000000_marketing_attribution.sql` — adds `first_*`/`last_*` attribution cols + `ga_client_id`/`fbc`/`fbp` to `profiles`, and `first_paid_at` to `subscriptions`. (Sam ran it; "Success, no rows" is correct for `ALTER … ADD COLUMN`.)

---

## 7. Subscriptions & comp accounts

- `subscriptions` columns: `user_id` (unique/PK, `on conflict` key), `stripe_customer_id`, `stripe_subscription_id`, `plan`, `cycle`, `status`, `current_period_end`, `first_paid_at`.
- **Every user table** references `auth.users(id) ON DELETE CASCADE` (profiles + all data tables + subscriptions + todos + inbox). → **Deleting a row from `auth.users` cascade-deletes everything for that user.** That's how account deletion is done (via SQL or the Supabase Auth dashboard).
- **Comp (free) account:** insert/upsert `subscriptions` with `status='comp'`, `plan='pro'`, no Stripe fields. The user's **auth account must already exist first** (create via Supabase dashboard → Authentication → Add user, auto-confirm) or the comp SQL matches 0 rows.
- Deleting an app account does **not** cancel a real Stripe subscription — cancel those separately in Stripe.

---

## 8. What was done recently (context, newest first)

- **Account cleanup:** deleted 9 fluff/test accounts (cascade delete from `auth.users`). Two were `active` pro — flagged for a Stripe check to cancel any lingering subscription.
- **Laura Dargan** set up as free **Pro (comp)** — account existed but had no subscription row; comp inserted.
- **Analytics stack** (Anne) — full build above; deployed; recap email drafted to Anne (in Sam's Gmail drafts).
- Earlier this session/history: version auto-updater (`appVersion.ts` + `UpdateBanner`), Meta Advanced Matching (`fbMatch.ts`), inventory export (2-up `portfolioExport.ts`) / labels (`artworkLabels.ts`) / sort, invoice tax+shipping, Reports business metrics + trial-conversion funnel, Todoist-style + server-backed todos (`todoParse.ts`, `DashboardTodos.tsx`), honeypot spam protection on signup, DataGate auto-refresh on focus, Nylas human-readable error messages, landing tweaks (hero graphic, testimonials, Instagram link).

---

## 9. Open / pending items

1. **Site refresh (color + Resources page)** — a design draft is built as an artifact (rotating brand-color accents, accents-only, + a new Resources page with Guides/Templates/Blog). **Awaiting Sam's approval** (she shared it with the team). If approved: implement for real — add `/resources` route + page, add accent tokens to `landing.html`, add nav/footer link — **without changing any existing button/flow**. Open questions: real vs. "coming soon" for template downloads and blog posts; final copy.
   - **Brand palette (Cara's):** forest `#032419`, blush `#fff5ff`, periwinkle `#7a98d3`, chartreuse/sage `#cfc581`, terracotta `#e27a55`, goldenrod `#e2ad44`, peach `#efd2c4`, chocolate `#522513`. (Site's forest is `#11281c`; brand PDF forest is the darker `#032419`.)
2. **Shelby — Nylas/Gmail connect** — still can't connect; needs a live "Connect Gmail" attempt to read the `?error=` code, or verify `NYLAS_API_KEY` in Vercel.
3. **Shelby — inventory dedupe** — ~214 artworks with many duplicates; title+year dedupe DELETE SQL still to be run (keep images; keep ~9 legit extras).
4. **Stripe cleanup** — cancel any live subscription for the 2 deleted `active` test accounts (`lchodyla@gmail.com`, `lukasztest@gmail.com`).
5. **Backend backup/durability plan** — discussed, deferred.

---

## 10. Conventions & guardrails

- **Never break existing buttons or flows.** Protect: Stripe checkout (guest + logged-in), the `/welcome` password-set flow, signup/lead forms (`data-allegory-signup`), pricing toggle, nav anchors, the `toLiveLanding` copy-swap.
- **No PII to GA4** (email/name). Meta gets hashed email only.
- **Keep secrets out of chat / git.** Sam enters them in Vercel/Supabase.
- **Supabase work = give Sam SQL to run** (MCP can't reach the real project from here). Always give a **read-only preview `SELECT` first**, then the write.
- **GitHub comments** get the Claude Code attribution footer.
- Model identity is withheld here; if asked, use `get_session` (this session's model is configured as Opus 4.8, serving model may differ).
