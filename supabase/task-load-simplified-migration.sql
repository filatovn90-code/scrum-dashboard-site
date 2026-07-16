alter table public.tasks
add column if not exists task_type text,
add column if not exists cognitive_load integer,
add column if not exists emotional_load integer;

update public.tasks
set
  cognitive_load = greatest(1, least(5, coalesce(cognitive_load, mental_cost, 3))),
  emotional_load = greatest(1, least(5, coalesce(emotional_load, emotional_cost, 3))),
  task_type = coalesce(
    nullif(task_type, ''),
    'routine'
  );

update public.tasks
set task_type = case lower(replace(coalesce(task_type, 'routine'), '-', '_'))
  when 'deep work' then 'deep_work'
  when 'deep_work' then 'deep_work'
  when 'deepwork' then 'deep_work'
  when 'meeting' then 'communication'
  when 'meetings' then 'communication'
  when 'communication' then 'communication'
  when 'creative' then 'creative'
  when 'learning' then 'learning'
  when 'recovery' then 'recovery'
  when 'admin' then 'routine'
  when 'routine' then 'routine'
  when 'low energy' then 'routine'
  when 'low_energy' then 'routine'
  when 'shallow work' then 'routine'
  when 'shallow_work' then 'routine'
  when 'light tasks' then 'routine'
  when 'light_tasks' then 'routine'
  when 'high energy' then 'routine'
  when 'high_energy' then 'routine'
  else 'routine'
end;

alter table public.tasks
alter column task_type set default 'routine';

alter table public.tasks
alter column cognitive_load set default 3;

alter table public.tasks
alter column emotional_load set default 2;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_cognitive_load_range'
  ) then
    alter table public.tasks
      add constraint tasks_cognitive_load_range
      check (cognitive_load between 1 and 5);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_emotional_load_range'
  ) then
    alter table public.tasks
      add constraint tasks_emotional_load_range
      check (emotional_load between 1 and 5);
  end if;
end $$;

create index if not exists idx_tasks_user_planned_date on public.tasks(user_id, planned_date);
create index if not exists idx_tasks_user_task_type on public.tasks(user_id, task_type);
