create extension if not exists pgcrypto;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user_id
  on public.subscriptions(user_id);

create unique index if not exists idx_subscriptions_user_plan_active
  on public.subscriptions(user_id, plan, status);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can view own subscriptions" on public.subscriptions;
create policy "Users can view own subscriptions"
on public.subscriptions
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own subscriptions" on public.subscriptions;
create policy "Users can insert own subscriptions"
on public.subscriptions
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own subscriptions" on public.subscriptions;
create policy "Users can update own subscriptions"
on public.subscriptions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  provider text,
  tokens_input int not null default 0,
  tokens_output int not null default 0,
  estimated_cost numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_events_user_created
  on public.ai_usage_events(user_id, created_at desc);

alter table public.ai_usage_events enable row level security;

drop policy if exists "Users can view own ai usage" on public.ai_usage_events;
create policy "Users can view own ai usage"
on public.ai_usage_events
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own ai usage" on public.ai_usage_events;
create policy "Users can insert own ai usage"
on public.ai_usage_events
for insert
with check (auth.uid() = user_id);

create table if not exists public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null,
  period_start date,
  period_end date,
  input_hash text,
  content text not null,
  source text not null default 'rule_based',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, report_type, period_start, period_end, input_hash)
);

create index if not exists idx_ai_reports_user_type_period
  on public.ai_reports(user_id, report_type, period_start, period_end);

alter table public.ai_reports enable row level security;

drop policy if exists "Users can manage own ai reports" on public.ai_reports;
create policy "Users can manage own ai reports"
on public.ai_reports
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
