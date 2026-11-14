import { calculateTaskLoad, normalizeTask } from "./workload.js";

export function explainLoad(tasks = []) {
  const normalized = tasks.map(normalizeTask);
  const contributors = normalized.map((task) => ({ ...task, contribution: calculateTaskLoad(task) }))
    .filter((task) => task.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);
  return { count: normalized.length, contributors, hasRecovery: normalized.some((task) => task.task_type === "recovery") };
}
