-- QuickBooks Online integration: per-member OAuth connection.
--
-- Mirrors the Nylas pattern: the secret tokens live in a server-only table
-- (quickbooks_grants) that the client can never read — RLS is enabled with NO
-- policies, so only the service role (our serverless functions) can touch it.
-- A separate, non-secret record (quickbooks_connections) is readable by the
-- owning member to drive the "Connected to QuickBooks" UI in Settings.

-- ---- Secret token store (server-only) ----
create table if not exists public.quickbooks_grants (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  realm_id           text not null,                 -- the QuickBooks company id
  access_token       text not null,                 -- ~1h lifetime
  refresh_token      text not null,                 -- rotates on every refresh
  token_expires_at   timestamptz not null,
  refresh_expires_at timestamptz,
  updated_at         timestamptz not null default now()
);
alter table public.quickbooks_grants enable row level security;
-- Intentionally no policies: clients get nothing; the service role bypasses RLS.

-- ---- Non-secret connection record (client-readable) ----
create table if not exists public.quickbooks_connections (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  realm_id     text,
  company_name text,
  connected_at timestamptz not null default now()
);
alter table public.quickbooks_connections enable row level security;

drop policy if exists "quickbooks_connections owner select" on public.quickbooks_connections;
create policy "quickbooks_connections owner select"
  on public.quickbooks_connections for select
  using (auth.uid() = user_id);
