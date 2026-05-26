import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import type { Stream, TtmValueType } from "../types";
import { getDelta, getHealthStatus, getValueByType } from "../utils/calculations";
import { StatusBadge } from "./StatusBadge";

interface StreamCardsProps {
  streams: Stream[];
  selectedStreamId: string;
  valueType: TtmValueType;
  onSelect: (streamId: string) => void;
}

export function StreamCards({ streams, selectedStreamId, valueType, onSelect }: StreamCardsProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="label">Стримы</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">TTM по стримам</h2>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {streams.map((stream) => {
          const value = getValueByType(stream, valueType);
          const delta = getDelta(value, stream.previousTtm);
          const status = getHealthStatus(value, stream.target);
          const selected = selectedStreamId === stream.id;

          return (
            <button
              key={stream.id}
              type="button"
              onClick={() => onSelect(stream.id)}
              className={`card p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-300 ${
                selected ? "border-ink ring-2 ring-ink/10" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-ink">{stream.name}</p>
                </div>
                <StatusBadge status={status} />
              </div>

              <div className="mt-5">
                <div>
                  <p className="label">TTM</p>
                  <p className="mt-1 text-4xl font-semibold text-ink">{value}</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                <span className="flex items-center gap-2 text-sm text-muted">
                  <Activity size={16} />
                  Тренд
                </span>
                <span className={`flex items-center gap-1 text-sm font-semibold ${delta > 0 ? "text-red-700" : "text-emerald-700"}`}>
                  {delta > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {delta > 0 ? "+" : ""}
                  {delta} дней
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
