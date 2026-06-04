-- ============================================================================
-- Allegory Studio — full backend foundation
--
-- Moves all studio entities from browser localStorage into Postgres with
-- per-user ownership and Row Level Security:
--   * Each row is owned by a user (user_id -> auth.users).
--   * Owners get full CRUD on their own rows.
--   * Admins (profiles.is_admin = true) get READ-ONLY visibility into every
--     user's rows — this is what powers the admin Reports section.
--
-- IDs are TEXT and supplied by the client (the app already generates its own
-- ids and cross-references them, e.g. invoice.artwork_id), so existing data
-- migrates 1:1 and all references keep working.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Admin check. SECURITY DEFINER so it can read profiles without tripping the
-- profiles RLS policy (avoids recursion).
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

-- ---------------------------------------------------------------------------
-- Profiles: one row per auth user. Holds identity + account-level prefs that
-- used to live in localStorage (tier, vault onboarding, custom statuses).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  full_name       text,
  is_admin        boolean not null default false,
  tier            text not null default 'starter',
  vault_onboarded boolean not null default false,
  custom_statuses jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  last_seen_at    timestamptz
);

alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Usage events: page views + heartbeats, for the admin engagement reports.
-- ---------------------------------------------------------------------------
create table if not exists public.usage_events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_type  text not null,              -- 'page_view' | 'heartbeat' | 'login'
  path        text,
  session_id  text,
  occurred_at timestamptz not null default now(),
  metadata    jsonb
);

alter table public.usage_events enable row level security;

create policy "usage_insert_own" on public.usage_events
  for insert with check (user_id = auth.uid());
create policy "usage_select_own_or_admin" on public.usage_events
  for select using (user_id = auth.uid() or public.is_admin());

create index if not exists usage_events_user_time_idx
  on public.usage_events (user_id, occurred_at desc);

-- ============================================================================
-- Studio entity tables. Scalars are typed columns (queryable for reports);
-- nested/optional structures are jsonb to mirror the existing TS shapes.
-- ============================================================================

create table if not exists public.artworks (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  year integer,
  medium text,
  dimensions text,
  edition text,
  price numeric,
  status text,
  location text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  number text,
  artwork_id text,
  custom_work jsonb,
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  billing_address text,
  shipping_address text,
  shipping_same_as_billing boolean,
  buyer_address text,
  amount numeric,
  payment_terms text,
  status text,
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz
);

create table if not exists public.consignments (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  artwork_id text,
  gallery_name text,
  contact_name text,
  contact_email text,
  consignee_contact_id text,
  commission_pct numeric,
  start_date timestamptz,
  end_date timestamptz,
  status text,
  date_out timestamptz,
  expected_return timestamptz,
  split_type text,
  split_value numeric,
  agreed_price numeric,
  payment_terms text,
  custom_terms text,
  notes text,
  document_url text,
  document_name text,
  generated_agreement_html text,
  generated_agreement_at timestamptz
);

create table if not exists public.opportunities (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  organization text,
  deadline timestamptz,
  type text,
  status text,
  notes text,
  link text,
  fee numeric,
  requirements text,
  award text
);

create table if not exists public.contacts (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  type text,
  stage text,
  email text,
  phone text,
  location text,
  tags jsonb,
  notes text,
  interactions jsonb,
  last_interaction_at timestamptz,
  follow_up_at timestamptz
);

create table if not exists public.leads (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  contact_info text,
  interest text,
  notes text,
  status text,
  follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date timestamptz,
  category text,
  amount numeric,
  description text,
  vendor text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.vault_docs (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text,
  title text,
  body text,
  file_name text,
  file_data text,
  notes text,
  context text,
  tags jsonb,
  meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.press_items (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text,
  outlet text,
  date timestamptz,
  link text,
  excerpt text,
  created_at timestamptz not null default now()
);

create table if not exists public.content_ideas (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  platform text,
  description text,
  status text,
  created_at timestamptz not null default now()
);

create table if not exists public.caption_drafts (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  platform text,
  artwork_id text,
  text text,
  status text,
  created_at timestamptz not null default now()
);

create table if not exists public.scheduled_posts (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date timestamptz,
  platform text,
  content text,
  hashtags text,
  image_base64 text,
  caption_draft_id text,
  status text
);

create table if not exists public.newsletters (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject text,
  body_html text,
  status text,
  date timestamptz,
  sent_at timestamptz
);

create table if not exists public.flagged_emails (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  sender text,
  sender_email text,
  subject text,
  preview text,
  received_at timestamptz,
  status text
);

create table if not exists public.inbox_connections (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  provider text,
  email text,
  connected_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Enable RLS + standard owner/admin policies + a user_id index on every
-- studio table in one pass.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'artworks','invoices','consignments','opportunities','contacts','leads',
    'expenses','vault_docs','press_items','content_ideas','caption_drafts',
    'scheduled_posts','newsletters','flagged_emails','inbox_connections'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);

    execute format(
      'create policy %I on public.%I for select using (user_id = auth.uid() or public.is_admin());',
      t||'_select_own_or_admin', t);
    execute format(
      'create policy %I on public.%I for insert with check (user_id = auth.uid());',
      t||'_insert_own', t);
    execute format(
      'create policy %I on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid());',
      t||'_update_own', t);
    execute format(
      'create policy %I on public.%I for delete using (user_id = auth.uid());',
      t||'_delete_own', t);

    execute format('create index if not exists %I on public.%I (user_id);', t||'_user_id_idx', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Backfill: create profile rows for any users that already existed before the
-- signup trigger was installed (e.g. the first admin accounts), then grant
-- admin to the studio owners.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, email, full_name)
select id, email, coalesce(raw_user_meta_data ->> 'full_name', '')
from auth.users
on conflict (id) do nothing;

update public.profiles set is_admin = true
where lower(email) in ('sam@moresilverlinings.com', 'cara@allegoryartconsulting.com');

