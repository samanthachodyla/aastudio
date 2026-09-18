-- To-do items become server-backed so a member's list syncs across devices.
-- Previously todos lived only in the browser (local storage), which is why the
-- list differed between, e.g., a home laptop and a studio desktop.
create table if not exists public.todos (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  priority integer,
  due text,
  recurrence text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.todos enable row level security;
drop policy if exists "todos_select_own_or_admin" on public.todos;
create policy "todos_select_own_or_admin" on public.todos
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "todos_insert_own" on public.todos;
create policy "todos_insert_own" on public.todos
  for insert with check (user_id = auth.uid());
drop policy if exists "todos_update_own" on public.todos;
create policy "todos_update_own" on public.todos
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "todos_delete_own" on public.todos;
create policy "todos_delete_own" on public.todos
  for delete using (user_id = auth.uid());
create index if not exists todos_user_id_idx on public.todos (user_id);
