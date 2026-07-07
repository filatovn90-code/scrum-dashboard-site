import { CheckCircle2, Circle, Clock, AlertCircle, Zap } from "lucide-react";
import type { TaskRecord } from "@/types/dashboard";

interface TasksListProps {
  tasks: TaskRecord[];
}

function priorityLabel(priority?: string | null) {
  if (priority === "high") return "High";
  if (priority === "low") return "Low";
  return "Medium";
}

export function TasksList({ tasks }: TasksListProps) {
  const completedCount = tasks.filter((task) => task.status === "done" || task.completed_at).length;
  const totalCount = tasks.length;

  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Today&apos;s Tasks</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {completedCount} of {totalCount} completed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <span className="text-sm font-bold text-foreground">
              {totalCount ? Math.round((completedCount / totalCount) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      <div className="space-y-3">
        {tasks.length ? (
          tasks.map((task) => {
            const completed = task.status === "done" || Boolean(task.completed_at);
            return (
              <div
                key={task.id}
                className={`rounded-xl border p-4 transition-all ${
                  completed
                    ? "border-border bg-secondary/20"
                    : "border-border bg-card hover:border-accent/50 hover:bg-secondary/20"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0 text-muted-foreground">
                    {completed ? <CheckCircle2 className="h-5 w-5 text-accent" /> : <Circle className="h-5 w-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className={`font-medium ${completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {task.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {task.estimated_minutes || 30} min
                      </div>

                      <div
                        className={`rounded-full px-2 py-1 font-medium ${
                          task.priority === "high"
                            ? "bg-orange-200/70 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200"
                            : task.priority === "medium"
                              ? "bg-emerald-200/70 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {task.priority === "high" ? <AlertCircle className="mr-1 inline h-3 w-3" /> : null}
                        {priorityLabel(task.priority)}
                      </div>

                      <div className="flex items-center gap-1 text-primary">
                        <Zap className="h-3.5 w-3.5" />
                        {task.task_type || "Task"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            На сегодня пока нет задач. Этот список автоматически подключается к таблице tasks в Supabase.
          </div>
        )}
      </div>
    </div>
  );
}
