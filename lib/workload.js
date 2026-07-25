export const TASK_TYPES = {
  deep_work: {
    label: "Deep Work",
    description: "Р“Р»СѓР±РѕРєР°СЏ СЂР°Р±РѕС‚Р° Рё РєРѕРЅС†РµРЅС‚СЂР°С†РёСЏ",
    coefficient: 1.2,
    icon: "рџ§ "
  },
  communication: {
    label: "РљРѕРјРјСѓРЅРёРєР°С†РёСЏ",
    description: "Р’СЃС‚СЂРµС‡Рё, Р·РІРѕРЅРєРё, РїРµСЂРµРіРѕРІРѕСЂС‹",
    coefficient: 1.1,
    icon: "рџ’¬"
  },
  creative: {
    label: "РўРІРѕСЂС‡РµСЃРєР°СЏ",
    description: "РРґРµРё, С‚РµРєСЃС‚С‹, СЃРѕР·РґР°РЅРёРµ РЅРѕРІРѕРіРѕ",
    coefficient: 1.05,
    icon: "вњЁ"
  },
  routine: {
    label: "Р СѓС‚РёРЅР°",
    description: "РђРґРјРёРЅРёСЃС‚СЂР°С‚РёРІРЅС‹Рµ Рё РїРѕРІС‚РѕСЂСЏСЋС‰РёРµСЃСЏ РґРµР№СЃС‚РІРёСЏ",
    coefficient: 0.75,
    icon: "рџ“‹"
  },
  learning: {
    label: "РћР±СѓС‡РµРЅРёРµ",
    description: "Р§С‚РµРЅРёРµ, РёСЃСЃР»РµРґРѕРІР°РЅРёРµ, РѕСЃРІРѕРµРЅРёРµ РЅРѕРІРѕРіРѕ",
    coefficient: 1,
    icon: "рџ“љ"
  },
  recovery: {
    label: "Р’РѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ",
    description: "РћС‚РґС‹С…, РїСЂРѕРіСѓР»РєР°, СЃРїРѕСЂС‚, РїР°СѓР·Р°",
    coefficient: -0.6,
    icon: "рџЊї"
  }
};

export const TASK_TYPE_OPTIONS = Object.entries(TASK_TYPES).map(([value, meta]) => ({
  value,
  ...meta
}));

export const DAILY_LOAD_THRESHOLDS = {
  balanced: 40,
  noticeable: 70,
  high: 95
};

export const DAY_LOAD_COPY = {
  balanced: {
    label: "РЎР±Р°Р»Р°РЅСЃРёСЂРѕРІР°РЅРѕ",
    note: "Р”РµРЅСЊ РІС‹РіР»СЏРґРёС‚ СѓРїСЂР°РІР»СЏРµРјС‹Рј, Р·Р°РїР°СЃ РїРѕ РµРјРєРѕСЃС‚Рё РµС‰Рµ РµСЃС‚СЊ."
  },
  noticeable: {
    label: "РљРѕРјС„РѕСЂС‚РЅР°СЏ РЅР°РіСЂСѓР·РєР°",
    note: "Р­С‚Рѕ РЅРѕСЂРјР°Р»СЊРЅС‹Р№ СЂР°Р±РѕС‡РёР№ СЂРёС‚Рј. Р•СЃР»Рё РЅСѓР¶РЅРѕ, СЃСЋРґР° РµС‰Рµ РїРѕРјРµСЃС‚РёС‚СЃСЏ Р»РµРіРєР°СЏ Р·Р°РґР°С‡Р°."
  },
  high: {
    label: "РџР»РѕС‚РЅС‹Р№ РґРµРЅСЊ",
    note: "Р”РµРЅСЊ РЅР°СЃС‹С‰РµРЅРЅС‹Р№, РЅРѕ РїРѕРєР° СѓРїСЂР°РІР»СЏРµРјС‹Р№. Р›СѓС‡С€Рµ РЅРµ РґРѕР±Р°РІР»СЏС‚СЊ РµС‰Рµ РѕРґРЅСѓ С‚СЏР¶РµР»СѓСЋ Р·Р°РґР°С‡Сѓ."
  },
  overload: {
    label: "Р РёСЃРє РїРµСЂРµРіСЂСѓР·Р°",
    note: "Р”РµРЅСЊ СѓР¶Рµ РїРµСЂРµРЅР°СЃС‹С‰РµРЅ. Р›СѓС‡С€Рµ РїРµСЂРµРЅРµСЃС‚Рё С‡Р°СЃС‚СЊ С‚СЏР¶РµР»С‹С… Р·Р°РґР°С‡ Рё РѕСЃС‚Р°РІРёС‚СЊ РїСЂРѕСЃС‚СЂР°РЅСЃС‚РІРѕ РґР»СЏ РїРµСЂРµРєР»СЋС‡РµРЅРёСЏ."
  }
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
    title: rawTask.title || rawTask.text || "Р‘РµР· РЅР°Р·РІР°РЅРёСЏ",
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
    return { key: "low", label: "РќРёР·РєР°СЏ" };
  }
  if (absoluteLoad <= 28) {
    return { key: "medium", label: "РЎСЂРµРґРЅСЏСЏ" };
  }
  if (absoluteLoad <= 40) {
    return { key: "high", label: "Р’С‹СЃРѕРєР°СЏ" };
  }

  return { key: "very_high", label: "РћС‡РµРЅСЊ РІС‹СЃРѕРєР°СЏ" };
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
    note: `РџРѕСЃР»Рµ СЌС‚РѕР№ Р·Р°РґР°С‡Рё РјРѕР¶РµС‚ Р±С‹С‚СЊ РїРѕР»РµР·РЅР° РїР°СѓР·Р° РѕРєРѕР»Рѕ ${minutes} РјРёРЅСѓС‚.`
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
      ...DAY_LOAD_COPY.balanced
    };
  }

  if (total <= DAILY_LOAD_THRESHOLDS.noticeable) {
    return {
      key: "noticeable",
      ...DAY_LOAD_COPY.noticeable
    };
  }

  if (total <= DAILY_LOAD_THRESHOLDS.high) {
    return {
      key: "high",
      ...DAY_LOAD_COPY.high
    };
  }

  return {
    key: "overload",
    ...DAY_LOAD_COPY.overload
  };

  if (total <= DAILY_LOAD_THRESHOLDS.balanced) {
    return {
      key: "balanced",
      label: "РЎР±Р°Р»Р°РЅСЃРёСЂРѕРІР°РЅРѕ",
      note: "РќР°РіСЂСѓР·РєР° РґРЅСЏ РІС‹РіР»СЏРґРёС‚ СѓРїСЂР°РІР»СЏРµРјРѕР№."
    };
  }

  if (total <= DAILY_LOAD_THRESHOLDS.noticeable) {
    return {
      key: "noticeable",
      label: "Р—Р°РјРµС‚РЅР°СЏ РЅР°РіСЂСѓР·РєР°",
      note: "Р”РµРЅСЊ СѓР¶Рµ РїР»РѕС‚РЅС‹Р№, Р»СѓС‡С€Рµ РЅРµ РґРѕР±Р°РІР»СЏС‚СЊ Р»РёС€РЅРёРµ С‚СЏР¶РµР»С‹Рµ Р·Р°РґР°С‡Рё."
    };
  }

  if (total <= DAILY_LOAD_THRESHOLDS.high) {
    return {
      key: "high",
      label: "Р’С‹СЃРѕРєР°СЏ РЅР°РіСЂСѓР·РєР°",
      note: "РЎС‚РѕРёС‚ РІРЅРёРјР°С‚РµР»СЊРЅРѕ РїСЂРѕРІРµСЂРёС‚СЊ РїР»Р°РЅ Рё РѕСЃС‚Р°РІРёС‚СЊ С‚РѕР»СЊРєРѕ РіР»Р°РІРЅРѕРµ."
    };
  }

  return {
    key: "overload",
    label: "Р РёСЃРє РїРµСЂРµРіСЂСѓР·Р°",
    note: "РџР»Р°РЅ РґРЅСЏ РІС‹РіР»СЏРґРёС‚ РїРµСЂРµРіСЂСѓР¶РµРЅРЅС‹Рј Рё С‚СЂРµР±СѓРµС‚ СЂР°Р·РіСЂСѓР·РєРё."
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

  if (loadLevel.key === "high") score -= 8;
  if (loadLevel.key === "overload") score -= 15;

  if (recentHistory?.state === "watch") score -= 5;
  if (["fatigue", "high"].includes(recentHistory?.state)) score -= 15;
  if (recentHistory?.state === "overloaded") score -= 20;

  score = clamp(score, 0, 100);

  let label = "РЎС‚Р°Р±РёР»СЊРЅРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ";
  let stateLabel = "stable";
  if (score >= 80) {
    label = "Р’С‹СЃРѕРєР°СЏ РіРѕС‚РѕРІРЅРѕСЃС‚СЊ";
    stateLabel = "excellent";
  } else if (score < 40) {
    label = "Р›СѓС‡С€Рµ СЃРЅРёР·РёС‚СЊ РЅР°РіСЂСѓР·РєСѓ";
    stateLabel = "risk";
  } else if (score < 60) {
    label = "РўСЏР¶РµР»С‹Р№ РґРµРЅСЊ";
    stateLabel = "heavy";
  }

  let mode = "Admin";
  if (score >= 80) mode = "Deep Work";
  else if (score >= 60) mode = load.hasCommunicationRisk ? "Admin" : "Deep Work";
  else if (score >= 40) mode = "Light Tasks";
  else mode = "Recovery";

  const explanations = [];
  const friendlyExplanations = [];
  if (load.hasDeepWorkRisk) friendlyExplanations.push("РІ РїР»Р°РЅРµ СѓР¶Рµ РЅРµСЃРєРѕР»СЊРєРѕ Р·Р°РґР°С‡ Deep Work");
  if (load.hasCommunicationRisk) friendlyExplanations.push("РµСЃС‚СЊ РЅРµСЃРєРѕР»СЊРєРѕ СЌРјРѕС†РёРѕРЅР°Р»СЊРЅРѕ С‚СЏР¶С‘Р»С‹С… РєРѕРјРјСѓРЅРёРєР°С†РёР№");
  if (state.stress >= 7) friendlyExplanations.push("СЃС‚СЂРµСЃСЃ СЃРµР№С‡Р°СЃ РІС‹С€Рµ РєРѕРјС„РѕСЂС‚РЅРѕРіРѕ СѓСЂРѕРІРЅСЏ");
  if (state.energy <= 4) friendlyExplanations.push("СЌРЅРµСЂРіРёРё СЃРµРіРѕРґРЅСЏ РЅРµРјРЅРѕРіРѕ");
  const readinessNote = friendlyExplanations.length
    ? `РЎРµР№С‡Р°СЃ РЅР° РѕС†РµРЅРєСѓ РґРЅСЏ Р±РѕР»СЊС€Рµ РІСЃРµРіРѕ РІР»РёСЏСЋС‚: ${friendlyExplanations.join(", ")}.`
    : "РџРѕРєР° РїР»Р°РЅ РґРЅСЏ РІС‹РіР»СЏРґРёС‚ РґРѕСЃС‚Р°С‚РѕС‡РЅРѕ СЂРµР°Р»РёСЃС‚РёС‡РЅРѕ.";
  if (load.hasDeepWorkRisk) explanations.push("СЃРµРіРѕРґРЅСЏ СѓР¶Рµ РјРЅРѕРіРѕ Deep Work");
  if (load.hasCommunicationRisk) explanations.push("РµСЃС‚СЊ РЅРµСЃРєРѕР»СЊРєРѕ СЌРјРѕС†РёРѕРЅР°Р»СЊРЅРѕ С‚СЏР¶РµР»С‹С… РєРѕРјРјСѓРЅРёРєР°С†РёР№");
  if (state.stress >= 7) explanations.push("СЃС‚СЂРµСЃСЃ РІС‹С€Рµ РєРѕРјС„РѕСЂС‚РЅРѕРіРѕ СѓСЂРѕРІРЅСЏ");
  if (state.energy <= 4) explanations.push("СЌРЅРµСЂРіРёРё СЃРµРіРѕРґРЅСЏ РЅРµРјРЅРѕРіРѕ");

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
      label: "РЈСЃС‚РѕР№С‡РёРІС‹Р№ СЂРёС‚Рј",
      state: "healthy",
      note: "Р РёС‚Рј РЅРµРґРµР»Рё РїРѕРєР° РІС‹РіР»СЏРґРёС‚ СѓСЃС‚РѕР№С‡РёРІС‹Рј."
    };
  }

  if (value <= 50) {
    return {
      value,
      label: "РЎС‚РѕРёС‚ РЅР°Р±Р»СЋРґР°С‚СЊ",
      state: "watch",
      note: "РќР°РіСЂСѓР·РєР° РєРѕРїРёС‚СЃСЏ, Р»СѓС‡С€Рµ РІРЅРёРјР°С‚РµР»СЊРЅРµРµ СЃР»РµРґРёС‚СЊ Р·Р° СЂР°Р·РіСЂСѓР·РєРѕР№."
    };
  }

  if (value <= 80) {
    return {
      value,
      label: "РќР°РєРѕРїР»РµРЅРЅР°СЏ СѓСЃС‚Р°Р»РѕСЃС‚СЊ",
      state: "fatigue",
      note: "РџРѕСЃР»РµРґРЅРёРµ РґРЅРё СѓР¶Рµ РІС‹РіР»СЏРґСЏС‚ РґРѕРІРѕР»СЊРЅРѕ РїР»РѕС‚РЅС‹РјРё."
    };
  }

  return {
    value,
    label: "Р РµРєРѕРјРµРЅРґСѓРµС‚СЃСЏ СЃРЅРёР·РёС‚СЊ РЅР°РіСЂСѓР·РєСѓ",
    state: "overloaded",
    note: "РџРѕСЃР»РµРґРЅРёРµ РґРЅРё С‚С‹ СЂР°Р±РѕС‚Р°РµС€СЊ РІ СЌРЅРµСЂРіРµС‚РёС‡РµСЃРєРёР№ РґРѕР»Рі. Р›СѓС‡С€Рµ СЃРЅРёР·РёС‚СЊ РЅР°РіСЂСѓР·РєСѓ РёР»Рё РґРѕР±Р°РІРёС‚СЊ РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ."
  };
}

export function generateRuleBasedRecommendations(checkin, tasks = [], analytics = {}) {
  const readiness = analytics.readiness || calculateReadinessScore(checkin, tasks, analytics.energyDebt);
  const debt = analytics.energyDebt || summarizeEnergyDebt([]);
  const load = readiness.dailyLoad || calculateDailyLoad(tasks);
  const state = currentState(checkin);
  const recommendations = [];
  const friendlyRecommendations = [];

  if (!checkin) {
    friendlyRecommendations.push("Заполни состояние дня, чтобы рекомендации стали точнее.");
  }

  if (state.stress >= 7 && state.energy <= 4) {
    friendlyRecommendations.push("Сегодня лучше снизить нагрузку и оставить только самые важные задачи.");
  }

  if (load.deepWorkCount > 2) {
    friendlyRecommendations.push("День становится плотнее. Лучше ограничиться 1–2 задачами Deep Work.");
  }

  if (load.heavyCommunicationCount > 1) {
    friendlyRecommendations.push("Сегодня есть несколько эмоционально тяжёлых коммуникаций. Лучше оставить между ними время на переключение.");
  }

  if (debt.value > 50) {
    friendlyRecommendations.push("Последние дни ты работаешь в энергетический долг. Добавь Recovery или Light Tasks.");
  }

  const unfinishedCount = tasks.filter((task) => !task.completed_at && normalizeTask(task).status !== "done").length;
  if (unfinishedCount >= 5) {
    friendlyRecommendations.push("План дня уже плотный. Возможно, лучше сократить список задач и оставить пространство для переключения.");
  }

  if (state.energy <= 4) {
    friendlyRecommendations.push("При текущем уровне энергии лучше начать с Routine или Recovery, а Deep Work сократить.");
  }

  if (state.stress >= 7) {
    friendlyRecommendations.push("Сегодня стоит снизить количество эмоционально сложных коммуникаций.");
  }

  if (!checkin) {
    recommendations.push("Р—Р°РїРѕР»РЅРё СЃРѕСЃС‚РѕСЏРЅРёРµ РґРЅСЏ, С‡С‚РѕР±С‹ СЂРµРєРѕРјРµРЅРґР°С†РёРё СЃС‚Р°Р»Рё С‚РѕС‡РЅРµРµ.");
  }

  if (state.stress >= 7 && state.energy <= 4) {
    recommendations.push("РЎРµРіРѕРґРЅСЏ Р»СѓС‡С€Рµ СЃРЅРёР·РёС‚СЊ РЅР°РіСЂСѓР·РєСѓ Рё РѕСЃС‚Р°РІРёС‚СЊ С‚РѕР»СЊРєРѕ СЃР°РјС‹Рµ РІР°Р¶РЅС‹Рµ Р·Р°РґР°С‡Рё.");
  }

  if (load.deepWorkCount > 2) {
    recommendations.push("Р”РµРЅСЊ РІС‹РіР»СЏРґРёС‚ С‚СЏР¶РµР»С‹Рј. Р›СѓС‡С€Рµ РѕРіСЂР°РЅРёС‡РёС‚СЊСЃСЏ 1вЂ“2 Р·Р°РґР°С‡Р°РјРё Deep Work.");
  }

  if (load.heavyCommunicationCount > 1) {
    recommendations.push("РЎРµРіРѕРґРЅСЏ РµСЃС‚СЊ РЅРµСЃРєРѕР»СЊРєРѕ СЌРјРѕС†РёРѕРЅР°Р»СЊРЅРѕ С‚СЏР¶РµР»С‹С… РєРѕРјРјСѓРЅРёРєР°С†РёР№. РћСЃС‚Р°РІСЊ РјРµР¶РґСѓ РЅРёРјРё РїР°СѓР·Сѓ.");
  }

  if (debt.value > 50) {
    recommendations.push("РџРѕСЃР»РµРґРЅРёРµ РґРЅРё С‚С‹ СЂР°Р±РѕС‚Р°РµС€СЊ РІ СЌРЅРµСЂРіРµС‚РёС‡РµСЃРєРёР№ РґРѕР»Рі. Р”РѕР±Р°РІСЊ Recovery РёР»Рё Light Tasks.");
  }

  const unfinished = tasks.filter((task) => !task.completed_at && normalizeTask(task).status !== "done").length;
  if (unfinished >= 5) {
    recommendations.push("РџР»Р°РЅ РІС‹РіР»СЏРґРёС‚ РїРµСЂРµРіСЂСѓР¶РµРЅРЅС‹Рј. РџРѕРїСЂРѕР±СѓР№ СЃРѕРєСЂР°С‚РёС‚СЊ СЃРїРёСЃРѕРє Р·Р°РґР°С‡ РґРЅСЏ.");
  }

  if (state.energy <= 4) {
    recommendations.push("РџСЂРё С‚РµРєСѓС‰РµРј СѓСЂРѕРІРЅРµ СЌРЅРµСЂРіРёРё Р»СѓС‡С€Рµ РЅР°С‡Р°С‚СЊ СЃ Routine РёР»Рё Recovery, Р° Deep Work СЃРѕРєСЂР°С‚РёС‚СЊ.");
  }

  if (state.stress >= 7) {
    recommendations.push("РЎРµРіРѕРґРЅСЏ СЃС‚РѕРёС‚ СЃРЅРёР·РёС‚СЊ РєРѕР»РёС‡РµСЃС‚РІРѕ СЌРјРѕС†РёРѕРЅР°Р»СЊРЅРѕ СЃР»РѕР¶РЅС‹С… РєРѕРјРјСѓРЅРёРєР°С†РёР№.");
  }

  if (friendlyRecommendations.length) {
    return friendlyRecommendations.slice(0, 4);
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



