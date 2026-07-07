import { Brain, TrendingUp } from "lucide-react";
import type { DashboardCapacity } from "@/types/dashboard";

interface CognitiveCapacityProps {
  capacity: DashboardCapacity;
}

export function CognitiveCapacity({ capacity }: CognitiveCapacityProps) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Cognitive Load</h2>
          <p className="mt-1 text-xs text-muted-foreground">Today&apos;s capacity</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          <Brain className="h-5 w-5 text-accent-foreground" />
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Remaining</span>
            <span className="text-lg font-bold text-primary">{capacity.percent}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/50 transition-all duration-300"
              style={{ width: `${capacity.percent}%` }}
            />
          </div>
        </div>

        <div className="grid gap-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Deep work possible</span>
            <span className="font-semibold text-foreground">{capacity.deepWorkHours}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Optimal until</span>
            <span className="font-semibold text-foreground">{capacity.optimalUntil}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-foreground">Capacity Usage</h3>

        {[
          { label: "Meetings / deep work", usage: capacity.meetingsUsage, color: "bg-emerald-400" },
          { label: "Admin work", usage: capacity.adminUsage, color: "bg-sky-300" }
        ].map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-foreground">{item.usage}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className={`h-full ${item.color}`} style={{ width: `${item.usage}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-lg bg-primary/10 p-3">
        <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-foreground">{capacity.note}</p>
      </div>
    </div>
  );
}
