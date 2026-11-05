alter table public.tasks
  add column if not exists planned_time time,
  add column if not exists legacy_key text;

alter table public.tasks alter column project_id drop not null;

create unique index if not exists tasks_user_legacy_key_unique
  on public.tasks (user_id, legacy_key);

create index if not exists tasks_user_planned_date_idx
  on public.tasks (user_id, planned_date);

create table if not exists public.daily_focus (
  user_id uuid not null references auth.users(id) on delete cascade,
  focus_date date not null,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, focus_date)
);

alter table public.daily_focus enable row level security;

drop policy if exists daily_focus_select_own on public.daily_focus;
create policy daily_focus_select_own on public.daily_focus
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists daily_focus_insert_own on public.daily_focus;
create policy daily_focus_insert_own on public.daily_focus
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists daily_focus_update_own on public.daily_focus;
create policy daily_focus_update_own on public.daily_focus
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.daily_focus to authenticated;
