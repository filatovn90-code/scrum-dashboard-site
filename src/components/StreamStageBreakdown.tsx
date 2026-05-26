import type { Stream } from "../types";
import { getStageBreakdown, stageColors } from "../utils/calculations";

interface StreamStageBreakdownProps {
  streams: Stream[];
  selectedStreamId: string;
}

export function StreamStageBreakdown({ streams, selectedStreamId }: StreamStageBreakdownProps) {
  return (
    <section className="card p-5 sm:p-6">
      <div>
        <p className="label">Стримы / этапы</p>
        <h2 className="mt-1 text-xl font-semibold text-ink">Вклад этапов в TTM стримов</h2>
      </div>

      <div className="mt-5 space-y-5">
        {streams.map((stream) => {
          const selected = selectedStreamId === stream.id;
          const stages = getStageBreakdown(stream);
          const leadStage = [...stages].sort((a, b) => b.share - a.share)[0];

          return (
            <div key={stream.id} className={`rounded-lg border p-4 ${selected ? "border-ink bg-slate-50" : "border-line"}`}>
              <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold text-ink">{stream.name}</p>
                  <p className="text-sm text-muted">Основной вклад: {leadStage.name}, {leadStage.share}%</p>
                </div>
                <p className="text-sm font-semibold text-ink">{stream.ttm} дней</p>
              </div>
              <div className="flex h-8 overflow-hidden rounded-md bg-surface">
                {stages.map((stage) => (
                  <div
                    key={stage.stage}
                    className="flex min-w-10 items-center justify-center text-xs font-semibold text-white"
                    style={{ width: `${stage.share}%`, backgroundColor: stageColors[stage.stage] }}
                    title={`${stage.name}: ${stage.days} дней`}
                  >
                    {stage.share}%
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {stages.map((stage) => (
                  <div key={stage.stage} className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 text-muted">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stageColors[stage.stage] }} />
                      {stage.name}
                    </span>
                    <span className="font-semibold text-ink">{stage.days} дн.</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
