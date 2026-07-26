# Gmail integration (Nylas) — setup runbook

Live Gmail for the Communications hub, via Nylas Hosted Auth. Artists click
**Connect Gmail**, authorize through Google (brokered by Nylas), and the app
syncs recent inbox messages into `flagged_emails`. All Nylas secrets stay
server-side in these `/api/nylas/*` Vercel Functions.

**Flow:** `auth.ts` (start) → Google → `callback.ts` (exchange code → grant,
store it) → `sync.ts` (fetch messages → flag replies).

---

## 1. Database — run once (Supabase → SQL Editor)

The Nylas *grant* is a secret (it can read the mailbox), so it lives in a
server-only table the browser never reads.

```sql
create table if not exists public.nylas_grants (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  grant_id   text not null,
  email      text,
  provider   text default 'google',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.nylas_grants enable row level security;
-- No policies on purpose: only the service role (our server functions) can
-- touch this table. Clients get no access.
```

## 2. Vercel — Environment Variables (Project → Settings → Environment Variables)

| Name | Value |
|---|---|
| `NYLAS_API_KEY` | your **fresh** Nylas API key (rotate the one shared in chat) |
| `NYLAS_CLIENT_ID` | `7754da07-6633-498e-abce-e0f2bfb404af` |
| `NYLAS_API_URI` | `https://api.us.nylas.com` |
| `NYLAS_STATE_SECRET` | any long random string (32+ chars) — signs the OAuth `state` |
| `SUPABASE_URL` | `https://czbzunpabgmwpldkrcex.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → **service_role** secret |
| `APP_URL` | `https://allegoryartstudio.com` |

After adding these, **redeploy** (or just push again) so the functions pick them up.

## 3. Nylas dashboard

1. **Redirect URI** — add `https://allegoryartstudio.com/api/nylas/callback`
   to your Nylas application's allowed callback URIs.
2. **Google connector** — make sure a Google connector is configured for email,
   and that you're using Nylas **hosted authentication** so connections ride
   Nylas's Google-verified app (this is what lets you skip your own CASA audit —
   confirm with Nylas support/docs).

## 4. Test

1. Deploy, set the env vars, run the SQL, add the redirect URI.
2. Sign in → **Communications → Connect Gmail** → approve in Google.
3. You return to `/communications?connected=1`; it auto-syncs and the flagged
   emails appear.

## Notes / gotchas
- The existing SPA rewrite in `vercel.json` (`/(.*) → /index.html`) does **not**
  capture `/api/*` — Vercel serves functions before applying rewrites. If the
  callback ever 404s to the app, add an explicit `"/api/(.*)"` passthrough.
- `sync.ts` currently pulls the 30 most recent INBOX messages and flags unread,
  not-from-you messages as "needs reply." Tune the heuristic anytime.
- To add a manual "Refresh inbox" button later, call `POST /api/nylas/sync`
  with the user's `Authorization: Bearer <supabase access_token>`.
