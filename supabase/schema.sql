create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists timezone text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  details text,
  status text not null default 'todo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null default current_date,
  energy_level integer,
  stress_level integer,
  focus_level integer,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.daily_checkins enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() is not null and auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() is not null and auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() is not null and auth.uid() = id)
with check (auth.uid() is not null and auth.uid() = id);

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
on public.projects
for select
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own"
on public.projects
for insert
to authenticated
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own"
on public.projects
for update
to authenticated
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own"
on public.projects
for delete
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own"
on public.tasks
for select
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own"
on public.tasks
for insert
to authenticated
with check (
  auth.uid() is not null
  and auth.uid() = user_id
  and exists (
    select 1
    from public.projects
    where projects.id = tasks.project_id
      and projects.user_id = auth.uid()
  )
);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own"
on public.tasks
for update
to authenticated
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own"
on public.tasks
for delete
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "daily_checkins_select_own" on public.daily_checkins;
create policy "daily_checkins_select_own"
on public.daily_checkins
for select
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "daily_checkins_insert_own" on public.daily_checkins;
create policy "daily_checkins_insert_own"
on public.daily_checkins
for insert
to authenticated
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "daily_checkins_update_own" on public.daily_checkins;
create policy "daily_checkins_update_own"
on public.daily_checkins
for update
to authenticated
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "daily_checkins_delete_own" on public.daily_checkins;
create policy "daily_checkins_delete_own"
on public.daily_checkins
for delete
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);
