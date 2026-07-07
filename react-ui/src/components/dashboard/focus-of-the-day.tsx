import { Clock, Target } from "lucide-react";
import type { TaskRecord } from "@/types/dashboard";

interface FocusOfTheDayProps {
  tasks: TaskRecord[];
}

function pickPrimaryTask(tasks: TaskRecord[]) {
  return (
    tasks.find((task) => task.is_focus) ||
    tasks.find((task) => task.priority === "high") ||
    tasks.find((task) => task.status !== "done") ||
    null
  );
}

export function FocusOfTheDay({ tasks }: FocusOfTheDayProps) {
  const primary = pickPrimaryTask(tasks);
  const supporting = tasks.filter((task) => task.id !== primary?.id).slice(0, 3);

  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Focus of the Day</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your main priority aligned with your energy levels</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
          <Target className="h-6 w-6 text-accent-foreground" />
        </div>
      </div>

      {primary ? (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-sm font-semibold text-primary">Primary Focus</span>
            </div>
            <h3 className="text-xl font-bold text-foreground">{primary.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {primary.task_type || "Deep Work"} • Est. {primary.estimated_minutes || 30} min • {primary.status || "todo"}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {supporting.map((task) => (
              <div key={task.id} className="rounded-xl border border-border bg-secondary/30 p-4">
                <h4 className="text-sm font-medium text-foreground">{task.title}</h4>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {task.estimated_minutes || 30} min
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          Пока нет задач на сегодня. Они появятся здесь автоматически, когда в Supabase будут задачи с сегодняшней датой.
        </div>
      )}
    </div>
  );
}
