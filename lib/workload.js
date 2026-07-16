export const TASK_TYPES = {
  deep_work: {
    label: "Deep Work",
    description: "Глубокая работа и концентрация",
    coefficient: 1.2,
    icon: "🧠"
  },
  communication: {
    label: "Коммуникация",
    description: "Встречи, звонки, переговоры",
    coefficient: 1.1,
    icon: "💬"
  },
  creative: {
    label: "Творческая",
    description: "Идеи, тексты, создание нового",
    coefficient: 1.05,
    icon: "✨"
  },
  routine: {
    label: "Рутина",
    description: "Административные и повторяющиеся действия",
    coefficient: 0.75,
    icon: "📋"
  },
  learning: {
    label: "Обучение",
    description: "Чтение, исследование, освоение нового",
    coefficient: 1,
    icon: "📚"
  },
  recovery: {
    label: "Восстановление",
    description: "Отдых, прогулка, спорт, пауза",
    coefficient: -0.6,
    icon: "🌿"
  }
};

export const TASK_TYPE_OPTIONS = Object.entries(TASK_TYPES).map(([value, meta]) => ({
  value,
  ...meta
}));

export const DAILY_LOAD_THRESHOLDS = {
  balanced: 80,
  noticeable: 140,
  high: 210
};

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
    deepwork: "deep_work",
    meetings: "communication",
    meeting: "communication",
    high_energy: "routine",
    highenergy: "routine",
    admin: "routine",
    low_energy: "routine",
    lowenergy: "routine",
    shallow_work: "routine",
    shallowwork: "routine",
    light_tasks: "routine",
    lighttasks: "routine"
  };

  return legacyMap[normalized] || "routine";
}

export function getTaskTypeCoefficient(taskType) {
  return TASK_TYPES[normalizeTaskType(taskType)]?.coefficient ?? TASK_TYPES.routine.coefficient;
}

export function getTaskTypeLabel(taskType) {
  return TASK_TYPES[normalizeTaskType(taskType)]?.label ?? TASK_TYPES.routine.label;
}

export function getTaskTypeIcon(taskType) {
  return TASK_TYPES[normalizeTaskType(taskType)]?.icon ?? TASK_TYPES.routine.icon;
}

export function getTaskTypeDescription(taskType) {
  return TASK_TYPES[normalizeTaskType(taskType)]?.description ?? TASK_TYPES.routine.description;
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
    title: rawTask.title || rawTask.text || "Без названия",
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
    return -1 * ((task.cognitive_load * 4) + (task.emotional_load * 4));
  }

  const baseLoad = (task.cognitive_load * 12) + (task.emotional_load * 10);
  return Math.round(baseLoad * getTaskTypeCoefficient(task.task_type));
}

function calculateTaskIntensityFromLoad(taskLoad) {
  const absoluteLoad = Math.abs(Number(taskLoad || 0));

  if (absoluteLoad <= 25) {
    return { key: "low", label: "Низкая" };
  }
  if (absoluteLoad <= 50) {
    return { key: "medium", label: "Средняя" };
  }
  if (absoluteLoad <= 75) {
    return { key: "high", label: "Высокая" };
  }

  return { key: "very_high", label: "Очень высокая" };
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
    note: `После этой задачи может быть полезна пауза около ${minutes} минут.`
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
  return calculateRecommendedRecoveryFromNormalized(task, calculateTaskIntensityFromLoad(calculateTaskLoadFromNormalized(task)));
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
    + Math.max(0, cognitiveHeavyCount - 2) * 0.1
    + Math.max(0, emotionalHeavyCount - 2) * 0.1;

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
      label: "Сбалансировано",
      note: "Нагрузка дня выглядит управляемой."
    };
  }

  if (total <= DAILY_LOAD_THRESHOLDS.noticeable) {
    return {
      key: "noticeable",
      label: "Заметная нагрузка",
      note: "День уже плотный, лучше не добавлять лишние тяжелые задачи."
    };
  }

  if (total <= DAILY_LOAD_THRESHOLDS.high) {
    return {
      key: "high",
      label: "Высокая нагрузка",
      note: "Стоит внимательно проверить план и оставить только главное."
    };
  }

  return {
    key: "overload",
    label: "Риск перегруза",
    note: "План дня выглядит перегруженным и требует разгрузки."
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
  else if (state.stress <= 7 && state.stress >= 6) score -= 10;
  else if (state.stress >= 8) score -= 20;

  if (loadLevel.key === "high") score -= 10;
  if (loadLevel.key === "overload") score -= 20;

  if (recentHistory?.state === "watch") score -= 5;
  if (["fatigue", "high"].includes(recentHistory?.state)) score -= 15;
  if (recentHistory?.state === "overloaded") score -= 20;

  score = clamp(score, 0, 100);

  let label = "Стабильное состояние";
  let stateLabel = "stable";
  if (score >= 80) {
    label = "Высокая готовность";
    stateLabel = "excellent";
  } else if (score < 40) {
    label = "Лучше снизить нагрузку";
    stateLabel = "risk";
  } else if (score < 60) {
    label = "Тяжелый день";
    stateLabel = "heavy";
  }

  let mode = "Admin";
  if (score >= 80) mode = "Deep Work";
  else if (score >= 60) mode = load.hasCommunicationRisk ? "Admin" : "Deep Work";
  else if (score >= 40) mode = "Light Tasks";
  else mode = "Recovery";

  const explanations = [];
  if (load.hasDeepWorkRisk) explanations.push("сегодня уже много Deep Work");
  if (load.hasCommunicationRisk) explanations.push("есть несколько эмоционально тяжелых коммуникаций");
  if (state.stress >= 7) explanations.push("стресс выше комфортного уровня");
  if (state.energy <= 4) explanations.push("энергии сегодня немного");

  return {
    score,
    label,
    state: stateLabel,
    mode,
    dailyLoad: load,
    dailyLoadLevel: loadLevel,
    note: explanations.length
      ? `На оценку дня влияют: ${explanations.join(", ")}.`
      : "План дня выглядит достаточно реалистично."
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
    const unfinishedHeavy = dayTasks.filter((task) => !task.completed_at && calculateTaskLoad(task) >= 50).length;

    if (stress >= 8) delta += 12;
    else if (stress >= 6) delta += 6;

    if (energy > 0 && energy <= 3) delta += 12;
    else if (energy > 0 && energy <= 5) delta += 6;

    if (focus > 0 && focus <= 3) delta += 8;
    if (loadLevel.key === "high") delta += 8;
    if (loadLevel.key === "overload") delta += 15;
    if (unfinishedHeavy > 0) delta += Math.min(unfinishedHeavy * 4, 12);
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
      label: "Устойчивый ритм",
      state: "healthy",
      note: "Ритм недели пока выглядит устойчивым."
    };
  }

  if (value <= 50) {
    return {
      value,
      label: "Стоит наблюдать",
      state: "watch",
      note: "Нагрузка копится, лучше внимательнее следить за разгрузкой."
    };
  }

  if (value <= 80) {
    return {
      value,
      label: "Накопленная усталость",
      state: "fatigue",
      note: "Последние дни уже выглядят довольно плотными."
    };
  }

  return {
    value,
    label: "Рекомендуется снизить нагрузку",
    state: "overloaded",
    note: "Последние дни ты работаешь в энергетический долг. Лучше снизить нагрузку или добавить восстановление."
  };
}

export function generateRuleBasedRecommendations(checkin, tasks = [], analytics = {}) {
  const readiness = analytics.readiness || calculateReadinessScore(checkin, tasks, analytics.energyDebt);
  const debt = analytics.energyDebt || summarizeEnergyDebt([]);
  const load = readiness.dailyLoad || calculateDailyLoad(tasks);
  const state = currentState(checkin);
  const recommendations = [];

  if (!checkin) {
    recommendations.push("Заполни состояние дня, чтобы рекомендации стали точнее.");
  }

  if (state.stress >= 7 && state.energy <= 4) {
    recommendations.push("Сегодня лучше снизить нагрузку и оставить только самые важные задачи.");
  }

  if (load.deepWorkCount > 2) {
    recommendations.push("День выглядит тяжелым. Лучше ограничиться 1–2 задачами Deep Work.");
  }

  if (load.heavyCommunicationCount > 1) {
    recommendations.push("Сегодня есть несколько эмоционально тяжелых коммуникаций. Оставь между ними паузу.");
  }

  if (debt.value > 50) {
    recommendations.push("Последние дни ты работаешь в энергетический долг. Добавь Recovery или Light Tasks.");
  }

  const unfinished = tasks.filter((task) => !task.completed_at && normalizeTask(task).status !== "done").length;
  if (unfinished >= 5) {
    recommendations.push("План выглядит перегруженным. Попробуй сократить список задач дня.");
  }

  if (state.energy <= 4) {
    recommendations.push("При текущем уровне энергии лучше начать с Routine или Recovery, а Deep Work сократить.");
  }

  if (state.stress >= 7) {
    recommendations.push("Сегодня стоит снизить количество эмоционально сложных коммуникаций.");
  }

  return recommendations.slice(0, 4);
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
