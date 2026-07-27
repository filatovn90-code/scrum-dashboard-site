import { getLocale, t } from "../i18n.js";

export const TASK_TYPES = {
  deep_work: {
    labelKey: "taskTypes.deep_work",
    descriptionKey: "taskTypeDescriptions.deep_work",
    coefficient: 1.2,
    icon: "🧠"
  },
  communication: {
    labelKey: "taskTypes.communication",
    descriptionKey: "taskTypeDescriptions.communication",
    coefficient: 1.1,
    icon: "💬"
  },
  creative: {
    labelKey: "taskTypes.creative",
    descriptionKey: "taskTypeDescriptions.creative",
    coefficient: 1,
    icon: "✨"
  },
  routine: {
    labelKey: "taskTypes.routine",
    descriptionKey: "taskTypeDescriptions.routine",
    coefficient: 0.75,
    icon: "🗂️"
  },
  learning: {
    labelKey: "taskTypes.learning",
    descriptionKey: "taskTypeDescriptions.learning",
    coefficient: 0.9,
    icon: "📚"
  },
  recovery: {
    labelKey: "taskTypes.recovery",
    descriptionKey: "taskTypeDescriptions.recovery",
    coefficient: -0.5,
    icon: "🌿"
  }
};

export const DAILY_LOAD_THRESHOLDS = {
  balanced: 40,
  noticeable: 70,
  high: 95
};

export const DAY_LOAD_COPY = {
  balanced: {
    label: {
      ru: "Сбалансировано",
      en: "Balanced"
    },
    note: {
      ru: "День выглядит управляемым, запас по ёмкости ещё есть.",
      en: "The day still looks manageable and there is capacity left."
    }
  },
  noticeable: {
    label: {
      ru: "Комфортная нагрузка",
      en: "Comfortable workload"
    },
    note: {
      ru: "Это нормальный рабочий ритм. Если нужно, сюда ещё поместится лёгкая задача.",
      en: "This looks like a normal work rhythm. If needed, there is still room for one light task."
    }
  },
  high: {
    label: {
      ru: "Плотный день",
      en: "Dense day"
    },
    note: {
      ru: "День насыщенный, но пока управляемый. Лучше не добавлять ещё одну тяжёлую задачу.",
      en: "The day is dense but still manageable. It is better not to add one more heavy task."
    }
  },
  overload: {
    label: {
      ru: "Риск перегруза",
      en: "Overload risk"
    },
    note: {
      ru: "День уже перенасыщен. Лучше перенести часть тяжёлых задач и оставить пространство для переключения.",
      en: "The day is already oversaturated. It is better to move some heavy tasks and keep room for switching."
    }
  }
};

function translateInline(value) {
  if (value && typeof value === "object") {
    const locale = getLocale();
    return value[locale] || value.ru || value.en || "";
  }

  return value;
}

export function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.min(max, Math.max(min, number));
}

export function toIsoDate(value = new Date()) {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function shiftIsoDate(isoDate, diffDays) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + Number(diffDays || 0));
  return date.toISOString().slice(0, 10);
}

export function listDates(startIso, endIso) {
  const dates = [];
  let current = startIso;

  while (current <= endIso) {
    dates.push(current);
    current = shiftIsoDate(current, 1);
  }

  return dates;
}

export function average(values) {
  const normalized = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!normalized.length) {
    return null;
  }

  return normalized.reduce((sum, value) => sum + value, 0) / normalized.length;
}

export function normalizeTaskType(taskType) {
  const raw = String(taskType || "").trim().toLowerCase();
  if (!raw) {
    return "routine";
  }

  const normalized = raw.replaceAll("-", "_").replaceAll(" ", "_");
  if (TASK_TYPES[normalized]) {
    return normalized;
  }

  const legacyMap = {
    admin: "routine",
    deepwork: "deep_work",
    high_energy: "routine",
    highenergy: "routine",
    light_tasks: "routine",
    lighttasks: "routine",
    low_energy: "routine",
    lowenergy: "routine",
    meeting: "communication",
    meetings: "communication",
    shallow_work: "routine",
    shallowwork: "routine"
  };

  return legacyMap[normalized] || "routine";
}

export function getTaskTypeOptions() {
  return Object.entries(TASK_TYPES).map(([value, meta]) => ({
    value,
    label: t(meta.labelKey),
    description: t(meta.descriptionKey),
    coefficient: meta.coefficient,
    icon: meta.icon
  }));
}

export function getTaskTypeCoefficient(taskType) {
  return TASK_TYPES[normalizeTaskType(taskType)]?.coefficient ?? TASK_TYPES.routine.coefficient;
}

export function getTaskTypeLabel(taskType) {
  const meta = TASK_TYPES[normalizeTaskType(taskType)] ?? TASK_TYPES.routine;
  return t(meta.labelKey);
}

export function getTaskTypeIcon(taskType) {
  return TASK_TYPES[normalizeTaskType(taskType)]?.icon ?? TASK_TYPES.routine.icon;
}

export function getTaskTypeDescription(taskType) {
  const meta = TASK_TYPES[normalizeTaskType(taskType)] ?? TASK_TYPES.routine;
  return t(meta.descriptionKey);
}

function buildNormalizedTask(rawTask = {}) {
  const taskType = normalizeTaskType(rawTask.task_type || rawTask.energy_type);
  const cognitiveLoad = clamp(
    rawTask.cognitive_load ?? rawTask.mental_cost ?? rawTask.energy_required ?? 3,
    1,
    5
  );
  const emotionalLoad = clamp(
    rawTask.emotional_load ?? rawTask.emotional_cost ?? 2,
    1,
    5
  );

  return {
    ...rawTask,
    id: rawTask.id || "",
    title: rawTask.title || rawTask.text || t("workload.untitledTask"),
    details: rawTask.details || rawTask.description || "",
    status: rawTask.status || "todo",
    planned_date: rawTask.planned_date || null,
    task_type: taskType,
    cognitive_load: cognitiveLoad,
    emotional_load: emotionalLoad,
    completed_at: rawTask.completed_at || null,
    archived_at: rawTask.archived_at || null,
    is_focus: Boolean(rawTask.is_focus),
    estimated_minutes: Number(rawTask.estimated_minutes || rawTask.duration || 0) || 0
  };
}

function inferLegacyEnergyRequired(task) {
  if (task.task_type === "recovery") {
    return 1;
  }

  return clamp(Math.round((Number(task.cognitive_load || 3) + Number(task.emotional_load || 2)) / 2), 1, 5);
}

function calculateTaskLoadFromNormalized(task) {
  if (task.task_type === "recovery") {
    return Math.round(-1 * ((task.cognitive_load * 4) + (task.emotional_load * 3)) * 0.5);
  }

  const baseLoad = (task.cognitive_load * 4) + (task.emotional_load * 3);
  return Math.round(baseLoad * getTaskTypeCoefficient(task.task_type));
}

function calculateTaskIntensityFromLoad(taskLoad) {
  const absoluteLoad = Math.abs(Number(taskLoad || 0));

  if (absoluteLoad <= 15) {
    return { key: "low", label: t("workload.intensityLow") };
  }
  if (absoluteLoad <= 28) {
    return { key: "medium", label: t("workload.intensityMedium") };
  }
  if (absoluteLoad <= 40) {
    return { key: "high", label: t("workload.intensityHigh") };
  }

  return { key: "very_high", label: t("workload.intensityVeryHigh") };
}

function calculateRecommendedRecoveryFromNormalized(task, intensity) {
  let minutes = 5;

  if (intensity.key === "medium") {
    minutes = 10;
  } else if (intensity.key === "high") {
    minutes = 20;
  } else if (intensity.key === "very_high") {
    minutes = 30;
  }

  if (task.task_type === "communication" && task.emotional_load >= 4) {
    minutes += 10;
  }

  if (task.task_type === "deep_work" && task.cognitive_load === 5) {
    minutes += 10;
  }

  return {
    minutes,
    note: t("workload.recoveryNote", { minutes })
  };
}

export function normalizeTask(rawTask = {}) {
  const normalized = buildNormalizedTask(rawTask);
  const taskLoad = calculateTaskLoadFromNormalized(normalized);
  const intensity = calculateTaskIntensityFromLoad(taskLoad);
  const recommendedRecovery = calculateRecommendedRecoveryFromNormalized(normalized, intensity);

  return {
    ...normalized,
    mental_cost: normalized.cognitive_load,
    emotional_cost: normalized.emotional_load,
    energy_required: inferLegacyEnergyRequired(normalized),
    task_intensity: intensity.key,
    recovery_minutes: recommendedRecovery.minutes,
    task_load: taskLoad,
    derived_intensity_label: intensity.label,
    derived_recovery_minutes: recommendedRecovery.minutes
  };
}

export function calculateTaskLoad(taskInput) {
  return calculateTaskLoadFromNormalized(buildNormalizedTask(taskInput));
}

export function calculateTaskIntensity(taskInput) {
  return calculateTaskIntensityFromLoad(calculateTaskLoad(taskInput));
}

export function calculateRecommendedRecovery(taskInput) {
  const task = buildNormalizedTask(taskInput);
  return calculateRecommendedRecoveryFromNormalized(
    task,
    calculateTaskIntensityFromLoad(calculateTaskLoadFromNormalized(task))
  );
}

export function calculateDailyLoad(tasks = []) {
  const normalizedTasks = tasks.map(normalizeTask);
  const positiveLoads = normalizedTasks
    .map((task) => Math.max(0, calculateTaskLoadFromNormalized(task)))
    .reduce((sum, value) => sum + value, 0);
  const recoveryLoads = normalizedTasks
    .map((task) => Math.min(0, calculateTaskLoadFromNormalized(task)))
    .reduce((sum, value) => sum + value, 0);

  const recoveryCap = positiveLoads * 0.25;
  const cappedRecovery = Math.max(recoveryLoads, recoveryCap * -1);

  const cognitiveHeavyCount = normalizedTasks.filter((task) => task.cognitive_load >= 4).length;
  const emotionalHeavyCount = normalizedTasks.filter((task) => task.emotional_load >= 4).length;
  const deepWorkCount = normalizedTasks.filter((task) => task.task_type === "deep_work").length;
  const heavyCommunicationCount = normalizedTasks.filter((task) => task.task_type === "communication" && task.emotional_load >= 4).length;

  const multiplier = 1
    + Math.max(0, cognitiveHeavyCount - 2) * 0.05
    + Math.max(0, emotionalHeavyCount - 2) * 0.05;

  const total = Math.max(0, Math.round((positiveLoads * multiplier) + cappedRecovery));

  return {
    total,
    positiveLoads,
    recoveryOffset: cappedRecovery,
    multiplier,
    cognitiveHeavyCount,
    emotionalHeavyCount,
    deepWorkCount,
    heavyCommunicationCount,
    hasDeepWorkRisk: deepWorkCount >= 3,
    hasCommunicationRisk: heavyCommunicationCount >= 3,
    tasks: normalizedTasks
  };
}

export function calculateDailyLoadLevel(tasks = []) {
  const metrics = calculateDailyLoad(tasks);
  const total = metrics.total;

  if (total <= DAILY_LOAD_THRESHOLDS.balanced) {
    return {
      key: "balanced",
      label: translateInline(DAY_LOAD_COPY.balanced.label),
      note: translateInline(DAY_LOAD_COPY.balanced.note)
    };
  }

  if (total <= DAILY_LOAD_THRESHOLDS.noticeable) {
    return {
      key: "noticeable",
      label: translateInline(DAY_LOAD_COPY.noticeable.label),
      note: translateInline(DAY_LOAD_COPY.noticeable.note)
    };
  }

  if (total <= DAILY_LOAD_THRESHOLDS.high) {
    return {
      key: "high",
      label: translateInline(DAY_LOAD_COPY.high.label),
      note: translateInline(DAY_LOAD_COPY.high.note)
    };
  }

  return {
    key: "overload",
    label: translateInline(DAY_LOAD_COPY.overload.label),
    note: translateInline(DAY_LOAD_COPY.overload.note)
  };
}

export function currentState(checkin) {
  return {
    energy: clamp(checkin?.energy_level ?? 6, 1, 10),
    stress: clamp(checkin?.stress_level ?? 4, 1, 10),
    focus: clamp(checkin?.focus_level ?? 6, 1, 10),
    sleep: checkin?.sleep_quality || "",
    mood: checkin?.mood || ""
  };
}

export function calculateReadinessScore(checkin, tasks = [], recentHistory = { value: 0, state: "healthy" }) {
  const state = currentState(checkin);
  const load = calculateDailyLoad(tasks);
  const loadLevel = calculateDailyLoadLevel(tasks);

  let score = 65;

  if (state.energy <= 3) score -= 20;
  else if (state.energy <= 5) score -= 10;
  else if (state.energy >= 8) score += 15;

  if (state.focus <= 3) score -= 15;
  else if (state.focus <= 5) score -= 5;
  else if (state.focus <= 7) score += 5;
  else score += 10;

  if (state.stress <= 3) score += 10;
  else if (state.stress >= 6 && state.stress <= 7) score -= 10;
  else if (state.stress >= 8) score -= 20;

  if (loadLevel.key === "high") score -= 8;
  if (loadLevel.key === "overload") score -= 15;

  if (recentHistory?.state === "watch") score -= 5;
  if (["fatigue", "high"].includes(recentHistory?.state)) score -= 15;
  if (recentHistory?.state === "overloaded") score -= 20;

  score = clamp(score, 0, 100);

  let label = t("workload.readinessStable");
  let stateLabel = "stable";
  if (score >= 80) {
    label = t("workload.readinessHigh");
    stateLabel = "excellent";
  } else if (score < 40) {
    label = t("workload.readinessRisk");
    stateLabel = "risk";
  } else if (score < 60) {
    label = t("workload.readinessHeavy");
    stateLabel = "heavy";
  }

  let mode = t("workload.modeAdmin");
  if (score >= 80) mode = t("workload.modeDeepWork");
  else if (score >= 60) mode = load.hasCommunicationRisk ? t("workload.modeAdmin") : t("workload.modeDeepWork");
  else if (score >= 40) mode = t("workload.modeLightTasks");
  else mode = t("workload.modeRecovery");

  const friendlyExplanations = [];
  if (load.hasDeepWorkRisk) friendlyExplanations.push("Deep Work");
  if (load.hasCommunicationRisk) friendlyExplanations.push(getTaskTypeLabel("communication"));
  if (state.stress >= 7) friendlyExplanations.push(t("pulse.stressTitle").toLowerCase());
  if (state.energy <= 4) friendlyExplanations.push(t("pulse.energyTitle").toLowerCase());

  const readinessNote = friendlyExplanations.length
    ? t("workload.readinessInfluences", { items: friendlyExplanations.join(", ") })
    : t("workload.readinessFallback");

  return {
    score,
    label,
    state: stateLabel,
    mode,
    dailyLoad: load,
    dailyLoadLevel: loadLevel,
    note: readinessNote
  };
}

export function calculateEnergyDebtSeries(checkins = [], tasks = []) {
  const checkinMap = new Map((checkins || []).map((item) => [toIsoDate(item.checkin_date), item]));
  const taskMap = new Map();

  tasks.map(normalizeTask).forEach((task) => {
    if (!task.planned_date) {
      return;
    }

    if (!taskMap.has(task.planned_date)) {
      taskMap.set(task.planned_date, []);
    }

    taskMap.get(task.planned_date).push(task);
  });

  const allDates = [...new Set([...checkinMap.keys(), ...taskMap.keys()])].sort();
  let debt = 0;

  return allDates.map((date) => {
    const dayCheckin = checkinMap.get(date) || null;
    const dayTasks = taskMap.get(date) || [];
    const load = calculateDailyLoad(dayTasks);
    const loadLevel = calculateDailyLoadLevel(dayTasks);

    let delta = 0;
    const energy = Number(dayCheckin?.energy_level || 0);
    const stress = Number(dayCheckin?.stress_level || 0);
    const focus = Number(dayCheckin?.focus_level || 0);
    const hasRecovery = dayTasks.some((task) => normalizeTaskType(task.task_type) === "recovery");
    const unfinishedHeavy = dayTasks.filter((task) => !task.completed_at && calculateTaskLoad(task) >= 30).length;

    if (stress >= 8) delta += 12;
    else if (stress >= 6) delta += 6;

    if (energy > 0 && energy <= 3) delta += 12;
    else if (energy > 0 && energy <= 5) delta += 6;

    if (focus > 0 && focus <= 3) delta += 8;
    if (loadLevel.key === "high") delta += 6;
    if (loadLevel.key === "overload") delta += 15;
    if (unfinishedHeavy > 0) delta += Math.min(unfinishedHeavy * 3, 9);
    if (hasRecovery) delta -= 4;
    if (loadLevel.key === "balanced") delta -= 3;

    debt = Math.max(0, debt + delta);

    return {
      date,
      delta,
      value: debt,
      loadTotal: load.total,
      loadLevel: loadLevel.key,
      checkin: dayCheckin,
      tasks: dayTasks
    };
  });
}

export function summarizeEnergyDebt(series = []) {
  const value = Number(series.at(-1)?.value || 0);

  if (value <= 20) {
    return {
      value,
      label: t("workload.debtHealthy"),
      state: "healthy",
      note: t("workload.debtHealthyNote")
    };
  }

  if (value <= 50) {
    return {
      value,
      label: t("workload.debtWatch"),
      state: "watch",
      note: t("workload.debtWatchNote")
    };
  }

  if (value <= 80) {
    return {
      value,
      label: t("workload.debtFatigue"),
      state: "fatigue",
      note: t("workload.debtFatigueNote")
    };
  }

  return {
    value,
    label: t("workload.debtOverloaded"),
    state: "overloaded",
    note: t("workload.debtOverloadedNote")
  };
}

export function generateRuleBasedRecommendations(checkin, tasks = [], analytics = {}) {
  const readiness = analytics.readiness || calculateReadinessScore(checkin, tasks, analytics.energyDebt);
  const debt = analytics.energyDebt || summarizeEnergyDebt([]);
  const load = readiness.dailyLoad || calculateDailyLoad(tasks);
  const state = currentState(checkin);
  const friendlyRecommendations = [];

  if (!checkin) {
    friendlyRecommendations.push(t("workload.recNoCheckin"));
  }

  if (state.stress >= 7 && state.energy <= 4) {
    friendlyRecommendations.push(t("workload.recLowEnergyStress"));
  }

  if (load.deepWorkCount > 2) {
    friendlyRecommendations.push(t("workload.recTooMuchDeepWork"));
  }

  if (load.heavyCommunicationCount > 1) {
    friendlyRecommendations.push(t("workload.recHeavyCommunication"));
  }

  if (debt.value > 50) {
    friendlyRecommendations.push(t("workload.recEnergyDebt"));
  }

  const unfinishedCount = tasks.filter((task) => !task.completed_at && normalizeTask(task).status !== "done").length;
  if (unfinishedCount >= 5) {
    friendlyRecommendations.push(t("workload.recTooManyOpenTasks"));
  }

  if (state.energy <= 4) {
    friendlyRecommendations.push(t("workload.recLowEnergy"));
  }

  if (state.stress >= 7) {
    friendlyRecommendations.push(t("workload.recHighStress"));
  }

  if (friendlyRecommendations.length) {
    return friendlyRecommendations.slice(0, 4);
  }

  return [t("workload.recBalanced")];
}

export function describeTaskLoad(task) {
  const normalized = normalizeTask(task);
  const intensity = calculateTaskIntensityFromLoad(calculateTaskLoadFromNormalized(normalized));

  return {
    typeLabel: getTaskTypeLabel(normalized.task_type),
    typeIcon: getTaskTypeIcon(normalized.task_type),
    cognitiveLabel: `${normalized.cognitive_load}/5`,
    emotionalLabel: `${normalized.emotional_load}/5`,
    intensityLabel: intensity.label,
    recoveryNote: calculateRecommendedRecoveryFromNormalized(normalized, intensity).note
  };
}
