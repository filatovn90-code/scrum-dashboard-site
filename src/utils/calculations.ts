import type { Direction, Epic, HealthStatus, StageKey, Stream, Task, TtmValueType } from "../types";

export const stageLabels: Record<StageKey, string> = {
  discovery: "Discovery",
  delivery: "Delivery",
  rollout: "Rollout",
};

export const stageColors: Record<StageKey, string> = {
  discovery: "#2563eb",
  delivery: "#f59e0b",
  rollout: "#10b981",
};

export const getValueByType = (
  source: Pick<Direction | Stream, "ttm" | "p85" | "average">,
  type: TtmValueType,
) => {
  if (type === "P85") return source.p85;
  if (type === "Average") return source.average;
  return source.ttm;
};

export const getDelta = (current: number, previous: number) => current - previous;

export const getHealthStatus = (value: number, target: number): HealthStatus => {
  const ratio = value / target;
  if (ratio <= 1) return "ok";
  if (ratio <= 1.15) return "warning";
  return "critical";
};

export const getRiskByIdleDays = (days: number) => {
  if (days >= 21) return "высокий";
  if (days >= 14) return "средний";
  return "низкий";
};

export const getStageBreakdown = (
  source: Pick<Direction | Stream, "ttm" | "discovery" | "delivery" | "rollout">,
) => {
  const stageTotal = source.discovery + source.delivery + source.rollout;
  const denominator = stageTotal > 0 ? stageTotal : source.ttm;

  return (["discovery", "delivery", "rollout"] as StageKey[]).map((stage) => ({
    stage,
    name: stageLabels[stage],
    days: source[stage],
    share: denominator > 0 ? Math.round((source[stage] / denominator) * 100) : 0,
  }));
};

export const getEpicIdleStats = (epics: Epic[], idleThreshold = 14) => {
  const idleEpics = epics
    .filter((epic) => epic.status === "В работе" && epic.daysWithoutActivity >= idleThreshold)
    .sort((a, b) => b.daysWithoutActivity - a.daysWithoutActivity);

  const totalIdleDays = idleEpics.reduce((sum, epic) => sum + epic.daysWithoutActivity, 0);

  return {
    idleEpics,
    count: idleEpics.length,
    averageIdleDays: idleEpics.length ? Math.round(totalIdleDays / idleEpics.length) : 0,
    maxIdleDays: idleEpics[0]?.daysWithoutActivity ?? 0,
    top: idleEpics.slice(0, 5),
  };
};

export const getFlagStats = (tasks: Task[]) => {
  const flaggedTasks = tasks
    .filter((task) => task.hasFlag)
    .sort((a, b) => (b.flagDurationDays ?? 0) - (a.flagDurationDays ?? 0));

  const totalFlagDays = flaggedTasks.reduce((sum, task) => sum + (task.flagDurationDays ?? 0), 0);
  const reasons = flaggedTasks.reduce<Record<string, { reason: string; count: number; days: number }>>(
    (acc, task) => {
      const reason = task.flagReason ?? "Не указано";
      acc[reason] ??= { reason, count: 0, days: 0 };
      acc[reason].count += 1;
      acc[reason].days += task.flagDurationDays ?? 0;
      return acc;
    },
    {},
  );

  const reasonRows = Object.values(reasons).sort((a, b) => b.count - a.count || b.days - a.days);

  return {
    flaggedTasks,
    count: flaggedTasks.length,
    totalFlagDays,
    averageFlagDays: flaggedTasks.length ? Math.round(totalFlagDays / flaggedTasks.length) : 0,
    reasonRows,
    topReason: reasonRows[0]?.reason ?? "Нет активных флагов",
  };
};

export const getInsights = (direction: Direction, epics: Epic[], tasks: Task[]) => {
  const directionStages = getStageBreakdown(direction);
  const mainStage = [...directionStages].sort((a, b) => b.share - a.share)[0];
  const maxP85Stream = [...direction.streams].sort((a, b) => b.p85 - a.p85)[0];
  const idleStats = getEpicIdleStats(epics);
  const flagStats = getFlagStats(tasks);

  return [
    `Основной вклад в TTM Дирекции даёт этап ${mainStage.name} — ${mainStage.share}% общего времени.`,
    `${maxP85Stream.name} имеет самый высокий P85 TTM — ${maxP85Stream.p85} дней.`,
    `${idleStats.count} эпиков находятся в статусе 'В работе' без активности более 14 дней.`,
    `Основная причина простоев задач — ${flagStats.topReason.toLowerCase()}.`,
  ];
};
