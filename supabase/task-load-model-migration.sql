alter table public.tasks
add column if not exists mental_cost int default 1,
add column if not exists emotional_cost int default 1,
add column if not exists recovery_minutes int default 0,
add column if not exists task_intensity text default 'medium';

update public.tasks
set
  mental_cost = coalesce(mental_cost, greatest(1, least(5, coalesce(cognitive_load, 1)))),
  emotional_cost = coalesce(emotional_cost, greatest(1, least(5, coalesce(emotional_load, 1)))),
  recovery_minutes = coalesce(
    recovery_minutes,
    case
      when coalesce(energy_required, 1) >= 4 then 30
      when coalesce(energy_required, 1) = 3 then 15
      else 0
    end
  ),
  task_intensity = coalesce(
    task_intensity,
    case
      when coalesce(energy_required, 1) >= 4 then 'high'
      when coalesce(energy_required, 1) <= 2 then 'low'
      else 'medium'
    end
  );

create index if not exists idx_tasks_user_planned_date on public.tasks(user_id, planned_date);
create index if not exists idx_tasks_user_task_intensity on public.tasks(user_id, task_intensity);
