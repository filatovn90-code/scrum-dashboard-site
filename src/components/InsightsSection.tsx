import { Lightbulb } from "lucide-react";

interface InsightsSectionProps {
  insights: string[];
}

export function InsightsSection({ insights }: InsightsSectionProps) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <Lightbulb size={19} />
        </div>
        <div>
          <p className="label">Автоматические выводы</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">Ключевые наблюдения</h2>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {insights.map((insight) => (
          <div key={insight} className="rounded-lg border border-line bg-surface px-4 py-3 text-sm font-medium text-ink">
            {insight}
          </div>
        ))}
      </div>
    </section>
  );
}
