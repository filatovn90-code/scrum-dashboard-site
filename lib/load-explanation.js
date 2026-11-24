import { calculateDailyLoad, normalizeTask } from "./workload.js";

export function explainReadiness(checkin, tasks = [], readiness = null) {
  if (!checkin) return { summary: "missing", factors: [], action: "checkin" };

  const normalized = tasks.map(normalizeTask);
  const metrics = calculateDailyLoad(normalized);
  const stress = Number(checkin.stress_level || 0);
  const energy = Number(checkin.energy_level || 0);
  const focus = Number(checkin.focus_level || 0);
  const loadKey = readiness?.dailyLoadLevel?.key || "unknown";
  const factors = [];

  if (stress >= 7) factors.push("stress");
  if (energy > 0 && energy <= 4) factors.push("energy");
  if (focus > 0 && focus <= 4) factors.push("focus");
  if (["high", "overload"].includes(loadKey)) factors.push("dense");
  if (normalized.filter((task) => task.cognitive_load >= 4).length >= 2) factors.push("cognitive");
  if (normalized.filter((task) => task.emotional_load >= 4).length >= 2) factors.push("emotional");
  if (metrics.unratedCount > 0) factors.push("unrated");

  const summary = stress >= 7
    ? "stress"
    : loadKey === "overload" || readiness?.state === "risk"
      ? "overloaded"
      : energy > 0 && energy <= 4
        ? "energy"
        : focus > 0 && focus <= 4
          ? "focus"
          : ["high", "overload"].includes(loadKey)
            ? "dense"
            : "balanced";

  const action = stress >= 7 || (energy > 0 && energy <= 4)
    ? "lighten"
    : loadKey === "overload" || readiness?.state === "risk"
      ? "reschedule"
      : loadKey === "high"
        ? "protect"
        : "steady";

  return { summary, factors, action };
}
