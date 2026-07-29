create extension if not exists pgcrypto;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  type text not null,
  message text not null,
  contact_email text null,
  can_contact boolean not null default false,
  locale text not null,
  page_url text null,
  page_title text null,
  app_version text null,
  browser_info text null,
  status text not null default 'new',
  email_delivery_status text null,
  created_at timestamptz not null default now(),
  constraint feedback_type_check check (
    type in ('suggestion', 'bug', 'feature_request', 'question', 'other')
  ),
  constraint feedback_status_check check (
    status in ('new', 'reviewed', 'planned', 'resolved', 'closed')
  )
);

alter table public.feedback enable row level security;

drop policy if exists "Authenticated users can insert own feedback" on public.feedback;
create policy "Authenticated users can insert own feedback"
on public.feedback
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Guests can insert feedback" on public.feedback;
create policy "Guests can insert feedback"
on public.feedback
for insert
to anon
with check (user_id is null);

drop policy if exists "Users can read own feedback" on public.feedback;
create policy "Users can read own feedback"
on public.feedback
for select
to authenticated
using (auth.uid() = user_id);

create index if not exists idx_feedback_user_created_at on public.feedback(user_id, created_at desc);
create index if not exists idx_feedback_status_created_at on public.feedback(status, created_at desc);
