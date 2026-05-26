import { Activity, ArrowDownRight, ArrowUpRight, Target, TrendingDown, TrendingUp } from "lucide-react";
import type { Direction, TtmValueType } from "../types";
import { getDelta, getHealthStatus, getValueByType } from "../utils/calculations";
import { StatusBadge } from "./StatusBadge";

interface DirectionSummaryProps {
  direction: Direction;
  valueType: TtmValueType;
  previousSnapshot?: {
    reportDate: string;
    fileName: string;
    direction: Pick<Direction, "ttm" | "p85" | "average">;
  };
}

export function DirectionSummary({ direction, valueType, previousSnapshot }: DirectionSummaryProps) {
  const value = getValueByType(direction, valueType);
  const previousValue = previousSnapshot ? getValueByType(previousSnapshot.direction, valueType) : direction.previousTtm;
  const delta = getDelta(value, previousValue);
  const status = getHealthStatus(value, direction.target);
  const isBetter = delta <= 0;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div>
          <p className="label">Общий TTM Дирекции</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <span className="text-5xl font-semibold leading-none text-ink">{value}</span>
            <span className="pb-1 text-lg font-medium text-muted">дней</span>
            <StatusBadge status={status} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[520px]">
          <div className="rounded-lg border border-line p-4">
            <div className="flex items-center gap-2 text-sm text-muted">
              {isBetter ? <ArrowDownRight className="text-emerald-600" size={18} /> : <ArrowUpRight className="text-red-600" size={18} />}
              Динамика к прошлому отчету
            </div>
            <p className="mt-2 text-sm text-muted">
              Было {previousValue} дней
              {previousSnapshot ? ` на ${previousSnapshot.reportDate}` : ""}
            </p>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-surface px-3 py-2">
              <span className="flex items-center gap-2 text-sm text-muted">
                <Activity size={16} />
                Тренд
              </span>
              <span className={`flex items-center gap-1 text-sm font-semibold ${delta > 0 ? "text-red-700" : "text-emerald-700"}`}>
                {delta > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {delta > 0 ? "Рост" : delta < 0 ? "Снижение" : "Без изменений"}
              </span>
            </div>
            {previousSnapshot ? <p className="mt-1 truncate text-xs text-muted">{previousSnapshot.fileName}</p> : null}
          </div>
          <div className="rounded-lg border border-line p-4">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Target size={18} />
              Целевое значение
            </div>
            <p className="mt-2 text-xl font-semibold text-ink">-</p>
            <p className="mt-1 text-xs text-muted">Пока не определено</p>
          </div>
        </div>
      </div>
    </section>
  );
}
