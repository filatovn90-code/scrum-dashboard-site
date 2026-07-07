alter table public.daily_checkins
add column if not exists sleep_quality text,
add column if not exists mood text;

alter table public.tasks
add column if not exists planned_date date,
add column if not exists is_focus boolean default false,
add column if not exists task_type text default 'deep_work',
add column if not exists cognitive_load int default 1,
add column if not exists emotional_load int default 1,
add column if not exists energy_required int default 1,
add column if not exists estimated_minutes int default 30,
add column if not exists priority text default 'medium',
add column if not exists completed_at timestamptz,
add column if not exists archived_at timestamptz;

create index if not exists idx_tasks_planned_date
on public.tasks(planned_date);

create index if not exists idx_tasks_user_planned_date
on public.tasks(user_id, planned_date);

create index if not exists idx_tasks_user_archived_at
on public.tasks(user_id, archived_at);
