import { Lightbulb, Send } from "lucide-react";
import type { DashboardCapacity, TaskRecord } from "@/types/dashboard";

interface AICoachProps {
  capacity: DashboardCapacity;
  tasks: TaskRecord[];
}

function buildRecommendations(capacity: DashboardCapacity, tasks: TaskRecord[]) {
  const recommendations: Array<{ title: string; desc: string; icon: string }> = [];
  const deepWork = tasks.filter((task) => (task.task_type || "") === "Deep Work").length;
  const highPriority = tasks.filter((task) => task.priority === "high").length;

  if (capacity.state === "risk") {
    recommendations.push({
      icon: "⏰",
      title: "Reduce load",
      desc: "Оставь только 1–2 приоритетные задачи и сократи эмоционально тяжелые активности."
    });
  }

  if (deepWork >= 2) {
    recommendations.push({
      icon: "🎯",
      title: "Focus Strategy",
      desc: "Собери Deep Work в один блок утром, а после обеда оставь более легкие задачи."
    });
  }

  if (highPriority >= 3) {
    recommendations.push({
      icon: "☕",
      title: "Energy Management",
      desc: "После первой сложной задачи заложи короткий буфер, чтобы не копить напряжение."
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      icon: "✨",
      title: "Stable Day",
      desc: "Нагрузка выглядит управляемой. Сохраняй ритм и не перегружай вторую половину дня."
    });
  }

  return recommendations.slice(0, 3);
}

export function AICoach({ capacity, tasks }: AICoachProps) {
  const recommendations = buildRecommendations(capacity, tasks);

  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">AI Coach</h2>
          <p className="mt-1 text-xs text-muted-foreground">Personalized recommendations</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          <Lightbulb className="h-5 w-5 text-accent-foreground" />
        </div>
      </div>

      <div className="mb-6 space-y-3">
        {recommendations.map((rec, index) => (
          <div key={`${rec.title}-${index}`} className="flex gap-3 rounded-lg border border-border bg-secondary/30 p-3">
            <span className="flex-shrink-0 text-lg">{rec.icon}</span>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold text-foreground">{rec.title}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{rec.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <p className="text-xs text-muted-foreground">Ask for personalized advice</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="How can I optimize..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <button className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:bg-accent/90">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
