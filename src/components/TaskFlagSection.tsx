import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Epic, Task, Team } from "../types";
import { getFlagStats } from "../utils/calculations";
import { MetricCard } from "./MetricCard";

interface TaskFlagSectionProps {
  tasks: Task[];
  epics: Epic[];
  teams: Team[];
}

export function TaskFlagSection({ tasks, epics, teams }: TaskFlagSectionProps) {
  const stats = getFlagStats(tasks);
  const epicById = new Map(epics.map((epic) => [epic.id, epic.key]));
  const teamById = new Map(teams.map((team) => [team.id, team.name]));

  return (
    <section className="card p-5 sm:p-6">
      <div>
        <p className="label">Простои задач</p>
        <h2 className="mt-1 text-xl font-semibold text-ink">Простои задач по флагам</h2>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <MetricCard label="Задач с флагами" value={stats.count} helper="Активные блокировки" tone="yellow" />
        <MetricCard label="Суммарно во флагах" value={`${stats.totalFlagDays} дн.`} helper="По всем задачам" />
        <MetricCard label="Средняя блокировка" value={`${stats.averageFlagDays} дн.`} helper="На задачу с флагом" tone="red" />
      </div>

      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.reasonRows} margin={{ left: 8, right: 16, top: 10, bottom: 40 }}>
            <CartesianGrid vertical={false} stroke="#eef1f5" />
            <XAxis dataKey="reason" angle={-16} textAnchor="end" interval={0} height={72} tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value, name) => [value, name === "count" ? "Задач" : "Дней"]} />
            <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.08em] text-muted">
              <th className="border-b border-line py-3 pr-4">Задача</th>
              <th className="border-b border-line px-4">Эпик</th>
              <th className="border-b border-line px-4">Команда</th>
              <th className="border-b border-line px-4">Причина</th>
              <th className="border-b border-line px-4">Дата флага</th>
              <th className="border-b border-line px-4 text-right">Дней</th>
              <th className="border-b border-line pl-4">Статус</th>
            </tr>
          </thead>
          <tbody>
            {stats.flaggedTasks.map((task) => (
              <tr key={task.id}>
                <td className="border-b border-line py-3 pr-4">
                  <p className="font-semibold text-ink">{task.key}</p>
                  <p className="text-muted">{task.title}</p>
                </td>
                <td className="border-b border-line px-4 font-medium text-ink">{epicById.get(task.epicId)}</td>
                <td className="border-b border-line px-4 text-muted">{teamById.get(task.teamId)}</td>
                <td className="border-b border-line px-4 text-ink">{task.flagReason}</td>
                <td className="border-b border-line px-4 text-muted">{task.flagStartedAt}</td>
                <td className="border-b border-line px-4 text-right font-semibold text-red-700">{task.flagDurationDays}</td>
                <td className="border-b border-line pl-4 text-muted">{task.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
