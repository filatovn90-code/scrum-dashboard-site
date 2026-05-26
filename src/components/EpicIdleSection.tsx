import type { Epic, Stream, Task } from "../types";
import { getEpicIdleStats, getRiskByIdleDays } from "../utils/calculations";
import { MetricCard } from "./MetricCard";
import { StatusBadge } from "./StatusBadge";

interface EpicIdleSectionProps {
  epics: Epic[];
  streams: Stream[];
  tasks: Task[];
}

export function EpicIdleSection({ epics, streams, tasks }: EpicIdleSectionProps) {
  const stats = getEpicIdleStats(epics);
  const streamById = new Map(streams.map((stream) => [stream.id, stream.name]));

  return (
    <section className="card p-5 sm:p-6">
      <div>
        <p className="label">Простои эпиков</p>
        <h2 className="mt-1 text-xl font-semibold text-ink">Простои эпиков в статусе 'В работе'</h2>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <MetricCard label="Эпиков с простоем" value={stats.count} helper="Без активности более 14 дней" tone="yellow" />
        <MetricCard label="Средний простой" value={`${stats.averageIdleDays} дн.`} helper="По эпикам с простоем" />
        <MetricCard label="Максимальный простой" value={`${stats.maxIdleDays} дн.`} helper={stats.top[0]?.key ?? "Нет простоев"} tone="red" />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.08em] text-muted">
              <th className="border-b border-line py-3 pr-4">Эпик</th>
              <th className="border-b border-line px-4">Стрим</th>
              <th className="border-b border-line px-4">Статус</th>
              <th className="border-b border-line px-4 text-right">В работе</th>
              <th className="border-b border-line px-4 text-right">Без активности</th>
              <th className="border-b border-line px-4 text-right">Задач</th>
              <th className="border-b border-line pl-4">Риск</th>
            </tr>
          </thead>
          <tbody>
            {stats.top.map((epic) => {
              const risk = getRiskByIdleDays(epic.daysWithoutActivity);
              const linkedTasks = tasks.filter((task) => epic.linkedTasks.includes(task.id)).length;

              return (
                <tr key={epic.id} className="border-b border-line">
                  <td className="border-b border-line py-3 pr-4">
                    <p className="font-semibold text-ink">{epic.key}</p>
                    <p className="text-muted">{epic.title}</p>
                  </td>
                  <td className="border-b border-line px-4 text-ink">{streamById.get(epic.streamId)}</td>
                  <td className="border-b border-line px-4 text-muted">{epic.status}</td>
                  <td className="border-b border-line px-4 text-right font-medium">{epic.daysInProgress}</td>
                  <td className="border-b border-line px-4 text-right font-semibold text-red-700">{epic.daysWithoutActivity}</td>
                  <td className="border-b border-line px-4 text-right">{linkedTasks}</td>
                  <td className="border-b border-line pl-4">
                    <StatusBadge risk={risk} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
