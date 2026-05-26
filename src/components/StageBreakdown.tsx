import type { Direction, Stream } from "../types";
import { getStageBreakdown, stageColors } from "../utils/calculations";

interface StageBreakdownProps {
  title: string;
  source: Direction | Stream;
}

export function StageBreakdown({ title, source }: StageBreakdownProps) {
  const stages = getStageBreakdown(source);
  const leadStage = [...stages].sort((a, b) => b.share - a.share)[0];

  return (
    <section className="card p-5 sm:p-6">
      <div>
        <p className="label">{title} / этапы</p>
        <h2 className="mt-1 text-xl font-semibold text-ink">Вклад этапов в TTM Дирекции</h2>
      </div>

      <div className="mt-5 rounded-lg border border-ink/70 bg-slate-50 p-4">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-ink">{title}</p>
            <p className="text-sm text-muted">
              Основной вклад: {leadStage.name}, {leadStage.share}%
            </p>
          </div>
          <p className="text-sm font-semibold text-ink">{source.ttm} дней</p>
        </div>

        <div className="flex h-10 overflow-hidden rounded-md bg-surface">
          {stages.map((stage) => (
            <div
              key={stage.stage}
              className="flex min-w-12 items-center justify-center text-sm font-semibold text-white"
              style={{ width: `${stage.share}%`, backgroundColor: stageColors[stage.stage] }}
              title={`${stage.name}: ${stage.days} дней`}
            >
              {stage.share}%
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {stages.map((stage) => (
            <div key={stage.stage} className="flex items-center justify-between rounded-md bg-white px-3 py-3 text-sm">
              <span className="flex items-center gap-2 text-muted">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stageColors[stage.stage] }} />
                {stage.name}
              </span>
              <span className="font-semibold text-ink">{stage.days} дн.</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
