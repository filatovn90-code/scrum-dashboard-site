export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

export function toIsoDate(value = new Date()) {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function startOfWeekIso(value = new Date()) {
  const date = new Date(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toIsoDate(date);
}

export function endOfWeekIso(value = new Date()) {
  const start = new Date(startOfWeekIso(value));
  start.setDate(start.getDate() + 6);
  return toIsoDate(start);
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
  const filtered = values.filter((value) => Number.isFinite(Number(value)));
  if (!filtered.length) {
    return null;
  }

  return filtered.reduce((sum, value) => sum + Number(value), 0) / filtered.length;
}

export function isDoneTask(task) {
  return task?.status === "done" || Boolean(task?.completed_at);
}

export function isDeepWorkTask(task) {
  return String(task?.task_type || "").toLowerCase().includes("deep");
}

export function isRecoveryTask(task) {
  const type = String(task?.task_type || "").toLowerCase();
  const intensity = String(task?.task_intensity || "").toLowerCase();
  return type.includes("recovery") || intensity === "low" || Number(task?.recovery_minutes || 0) >= 20;
}

export function normalizeTaskRecord(task) {
  return {
    id: task?.id || "",
    title: task?.title || "Task",
    details: task?.details || "",
    status: task?.status || "todo",
    planned_date: task?.planned_date || null,
    task_type: task?.task_type || "Admin",
    cognitive_load: Number(task?.cognitive_load || 1),
    emotional_load: Number(task?.emotional_load || 1),
    energy_required: Number(task?.energy_required || 1),
    estimated_minutes: Number(task?.estimated_minutes || 30),
    mental_cost: Number(task?.mental_cost || task?.cognitive_load || 1),
    emotional_cost: Number(task?.emotional_cost || task?.emotional_load || 1),
    recovery_minutes: Number(task?.recovery_minutes || 0),
    task_intensity: task?.task_intensity || "medium",
    completed_at: task?.completed_at || null,
    archived_at: task?.archived_at || null,
    is_focus: Boolean(task?.is_focus)
  };
}

export function currentState(checkin) {
  return {
    energy: Number(checkin?.energy_level || 6),
    stress: Number(checkin?.stress_level || 4),
    focus: Number(checkin?.focus_level || 6),
    sleep: checkin?.sleep_quality || "",
    mood: checkin?.mood || ""
  };
}

export function calculateTaskLoad(task) {
  const mental = Number(task?.mental_cost || task?.cognitive_load || 1);
  const emotional = Number(task?.emotional_cost || task?.emotional_load || 1);
  const energy = Number(task?.energy_required || 1);
  const minutes = Number(task?.estimated_minutes || 30);
  return mental * 10 + emotional * 8 + energy * 6 + minutes / 10;
}

export function calculateReadiness(state, tasks = [], totalLoad = 0) {
  const energyBonus = Math.round((clamp(state.energy, 1, 10) / 10) * 20);
  const focusBonus = Math.round((clamp(state.focus, 1, 10) / 10) * 10);
  const stressPenalty = Math.round((clamp(state.stress, 1, 10) / 10) * 25);
  const loadPenalty = Math.min(30, Math.round(Number(totalLoad || 0) / 5));
  const score = clamp(70 + energyBonus + focusBonus - stressPenalty - loadPenalty, 0, 100);
  const status = readinessStatus(score);
  const mode = recommendedMode(score, state, tasks);

  return {
    score,
    state: status.state,
    label: status.label,
    mode,
    note: readinessExplanation(score, mode, totalLoad)
  };
}

export function readinessStatus(score) {
  if (score >= 80) return { label: "Excellent Day", state: "excellent" };
  if (score >= 60) return { label: "Stable", state: "stable" };
  if (score >= 40) return { label: "Heavy", state: "heavy" };
  return { label: "Recovery Needed", state: "risk" };
}

export function recommendedMode(score, state, tasks = []) {
  const deepWorkCount = tasks.filter(isDeepWorkTask).length;
  const heavyMentalCount = tasks.filter((task) => Number(task?.mental_cost || task?.cognitive_load || 1) >= 4).length;

  if (score < 40 || state.stress >= 8) return "Recovery";
  if (score < 55 || state.energy <= 4) return "Light Tasks";
  if (state.focus <= 5 || heavyMentalCount >= 3) return "Admin";
  if (deepWorkCount >= 1 && score >= 75) return "Deep Work";
  return "Admin";
}

export function readinessExplanation(score, mode, totalLoad) {
  if (score >= 80) return `День выглядит сильным. Лучший режим — ${mode}.`;
  if (score >= 60) return `Ритм дня устойчивый. Лучше держать умеренный темп и режим ${mode}.`;
  if (score >= 40) return `День уже плотный, текущая нагрузка около ${Math.round(totalLoad)}. Лучше сместиться в режим ${mode}.`;
  return `Сегодня стоит двигаться бережно. Лучший режим — ${mode}.`;
}

export function calculateEnergyDebtDelta(checkin, taskLoad, hasRecoveryTask) {
  let delta = 0;
  if (Number(checkin?.stress_level || 0) >= 7) delta += 10;
  if (Number(checkin?.energy_level || 10) <= 4) delta += 10;
  if (Number(taskLoad || 0) >= 85) delta += 10;
  if (hasRecoveryTask || Number(taskLoad || 0) <= 50) delta -= 5;
  return delta;
}

export function summarizeEnergyDebt(series) {
  const value = series.length ? Number(series[series.length - 1].value || 0) : 0;
  if (value <= 20) {
    return {
      value,
      label: "Healthy",
      state: "excellent",
      note: "Перегрузка почти не накапливается."
    };
  }
  if (value <= 50) {
    return {
      value,
      label: "Watch",
      state: "heavy",
      note: "Нагрузка накапливается и уже требует внимания."
    };
  }
  return {
    value,
    label: "Overloaded",
    state: "risk",
    note: "Последние дни идут в энергетический долг. Лучше снизить темп."
  };
}

export function calculateOverloadScore(checkin, taskLoad) {
  let score = Number(checkin?.stress_level || 0) * 10 + Number(taskLoad || 0) / 5;
  if (Number(checkin?.energy_level || 10) <= 4) score += 20;
  if (Number(checkin?.focus_level || 10) <= 4) score += 10;
  return Math.round(score);
}

export function overloadState(score) {
  if (score >= 91) return "risk";
  if (score >= 61) return "high";
  return "normal";
}

export function buildAiContext({
  periodStart,
  periodEnd,
  checkins = [],
  tasks = [],
  todayIso = periodEnd
}) {
  const normalizedTasks = (tasks || [])
    .map(normalizeTaskRecord)
    .filter((task) => task.planned_date && task.planned_date >= periodStart && task.planned_date <= periodEnd && !task.archived_at);

  const checkinMap = new Map((checkins || []).map((item) => [toIsoDate(item.checkin_date), item]));
  const taskMap = new Map();

  normalizedTasks.forEach((task) => {
    if (!taskMap.has(task.planned_date)) {
      taskMap.set(task.planned_date, []);
    }
    taskMap.get(task.planned_date).push(task);
  });

  let cumulativeDebt = 0;
  const days = listDates(periodStart, periodEnd).map((date) => {
    const dayCheckin = checkinMap.get(date) || null;
    const dayTasks = taskMap.get(date) || [];
    const taskLoad = dayTasks.reduce((sum, task) => sum + calculateTaskLoad(task), 0);
    const readiness = calculateReadiness(currentState(dayCheckin), dayTasks, taskLoad);
    const overloadScore = calculateOverloadScore(dayCheckin, taskLoad);
    const dayDebtDelta = calculateEnergyDebtDelta(dayCheckin, taskLoad, dayTasks.some(isRecoveryTask));
    cumulativeDebt = Math.max(0, cumulativeDebt + dayDebtDelta);

    return {
      date,
      checkin: dayCheckin,
      tasks: dayTasks,
      taskLoad,
      readiness,
      readinessScore: readiness.score,
      overloadScore,
      overloadState: overloadState(overloadScore),
      deepWorkCount: dayTasks.filter(isDeepWorkTask).length,
      highEmotionalCount: dayTasks.filter((task) => Number(task.emotional_cost || 0) >= 4).length,
      completedCount: dayTasks.filter(isDoneTask).length,
      energyDebtValue: cumulativeDebt
    };
  });

  const today = days.find((day) => day.date === todayIso) || days[days.length - 1] || null;
  const debtSeries = days.map((day) => ({ date: day.date, value: day.energyDebtValue, taskLoad: day.taskLoad, checkin: day.checkin }));
  const energyDebt = summarizeEnergyDebt(debtSeries);
  const topHeavyTasks = [...normalizedTasks]
    .map((task) => ({
      ...task,
      burden: calculateTaskLoad(task) + Number(task.recovery_minutes || 0) / 6
    }))
    .sort((left, right) => right.burden - left.burden)
    .slice(0, 3);

  const averageEnergy = average(checkins.map((item) => item.energy_level));
  const averageStress = average(checkins.map((item) => item.stress_level));
  const averageFocus = average(checkins.map((item) => item.focus_level));
  const averageReadiness = average(days.map((day) => day.readinessScore));

  return {
    periodStart,
    periodEnd,
    todayIso,
    checkins,
    tasks: normalizedTasks,
    days,
    today,
    energyDebt,
    debtSeries,
    summary: {
      avgEnergy: averageEnergy,
      avgStress: averageStress,
      avgFocus: averageFocus,
      avgReadiness: averageReadiness,
      totalTasks: normalizedTasks.length,
      completedTasks: normalizedTasks.filter(isDoneTask).length,
      deepWorkTasks: normalizedTasks.filter(isDeepWorkTask).length,
      highEmotionalTasks: normalizedTasks.filter((task) => Number(task.emotional_cost || 0) >= 4).length,
      totalEstimatedMinutes: normalizedTasks.reduce((sum, task) => sum + Number(task.estimated_minutes || 0), 0)
    },
    lowEnergyDays: days.filter((day) => Number(day.checkin?.energy_level || 0) > 0 && Number(day.checkin?.energy_level || 0) <= 4),
    overloadedDays: days.filter((day) => day.overloadState === "risk" || day.overloadState === "high"),
    topHeavyTasks
  };
}

export function buildCompactAiInput(context) {
  return {
    periodStart: context.periodStart,
    periodEnd: context.periodEnd,
    todayIso: context.todayIso,
    summary: context.summary,
    energyDebt: context.energyDebt,
    today: context.today
      ? {
          date: context.today.date,
          readinessScore: context.today.readinessScore,
          readinessLabel: context.today.readiness.label,
          taskLoad: context.today.taskLoad,
          taskCount: context.today.tasks.length,
          deepWorkCount: context.today.deepWorkCount,
          highEmotionalCount: context.today.highEmotionalCount,
          state: context.today.checkin
            ? {
                energy: Number(context.today.checkin.energy_level || 0),
                stress: Number(context.today.checkin.stress_level || 0),
                focus: Number(context.today.checkin.focus_level || 0),
                sleepQuality: context.today.checkin.sleep_quality || null,
                mood: context.today.checkin.mood || null
              }
            : null
        }
      : null,
    overloadedDays: context.overloadedDays.map((day) => ({
      date: day.date,
      overloadState: day.overloadState,
      taskLoad: day.taskLoad,
      readinessScore: day.readinessScore
    })),
    lowEnergyDays: context.lowEnergyDays.map((day) => ({
      date: day.date,
      energy: Number(day.checkin?.energy_level || 0),
      stress: Number(day.checkin?.stress_level || 0)
    })),
    topHeavyTasks: context.topHeavyTasks.map((task) => ({
      title: task.title,
      taskType: task.task_type,
      burden: Math.round(task.burden),
      mentalCost: Number(task.mental_cost || 0),
      emotionalCost: Number(task.emotional_cost || 0),
      estimatedMinutes: Number(task.estimated_minutes || 0)
    }))
  };
}

export function buildRuleBasedCoachResponse(action, context) {
  const today = context.today;
  const todayTasks = today?.tasks || [];
  const readiness = today?.readiness || calculateReadiness({ energy: 6, stress: 4, focus: 6 }, [], 0);
  const state = today?.checkin ? currentState(today.checkin) : { energy: 6, stress: 4, focus: 6 };

  if (action === "move") {
    const candidates = [...todayTasks]
      .sort((left, right) => calculateTaskLoad(right) - calculateTaskLoad(left))
      .slice(2, 5)
      .map((task) => `Перенести в первую очередь: ${task.title} — нагрузка ${Math.round(calculateTaskLoad(task))}.`);

    return {
      title: "Что лучше перенести?",
      paragraphs: [
        todayTasks.length
          ? "Если день уже плотный, лучше переносить не главные задачи, а все, что идет поверх базового плана."
          : "Сегодня задач немного, поэтому переносить почти нечего.",
        context.energyDebt.value > 20
          ? "Перенос будет полезен: энергетическая нагрузка уже накопилась."
          : "Даже один перенос может сохранить запас энергии к концу дня."
      ],
      points: candidates.length ? candidates : ["Оставь только 1–2 главные задачи и не добавляй новый тяжелый блок без необходимости."]
    };
  }

  if (action === "why-tired") {
    const reasons = [];
    if (state.stress >= 7) reasons.push("стресс держится высоко");
    if (state.energy <= 4) reasons.push("энергии сегодня мало");
    if (today?.taskLoad >= 85) reasons.push("нагрузка дня уже высокая");
    if (context.energyDebt.value > 20) reasons.push("энергетический долг копится несколько дней");

    return {
      title: "Почему я устал?",
      paragraphs: [
        reasons.length
          ? `Похоже, усталость складывается из нескольких факторов: ${reasons.join(", ")}.`
          : "Явного одного источника усталости не видно, но ритм недели уже мог накопить фоновую нагрузку.",
        "Особенно сильно утомляют задачи с высоким Mental Cost, Emotional Cost и длинной оценкой времени."
      ],
      points: [
        "Не ставь несколько emotionally heavy задач подряд.",
        "После сложного блока добавляй Recovery или Light Tasks.",
        "Оценивай задачи не только по срочности, но и по цене для энергии."
      ]
    };
  }

  if (action === "reduce-load") {
    return {
      title: "Как снизить нагрузку сегодня?",
      paragraphs: [
        readiness.state === "risk"
          ? "День уже на границе перегруза. Лучший способ снизить нагрузку — упростить план, а не ускоряться."
          : "Нагрузку лучше снижать заранее, пока день еще можно сделать управляемым.",
        `Readiness Score сейчас ${readiness.score}, Energy Debt — ${context.energyDebt.value}. Разгрузка сегодня повлияет и на остаток недели.`
      ],
      points: [
        "Оставь только 1 главную задачу с высоким Mental Cost.",
        "Замени часть слотов на Admin, Recovery или Light Tasks.",
        "Не добавляй новый Deep Work блок, если их уже больше двух."
      ]
    };
  }

  if (action === "weekly-review") {
    return buildRuleBasedWeeklyReview(context);
  }

  const topTasks = [...todayTasks]
    .sort((left, right) => {
      const focusDelta = Number(right.is_focus) - Number(left.is_focus);
      if (focusDelta !== 0) return focusDelta;
      return calculateTaskLoad(right) - calculateTaskLoad(left);
    })
    .slice(0, 3);

  return {
    title: "Составь план дня",
    paragraphs: [
      todayTasks.length
        ? `На сегодня у тебя ${todayTasks.length} задач. Readiness Score сейчас ${readiness.score}, поэтому день лучше строить в режиме ${readiness.mode}.`
        : "На сегодня задач почти нет. Это хороший момент, чтобы не перегружать день и оставить только действительно важное.",
      readiness.state === "excellent"
        ? "Начни с самого важного сложного блока, а потом переходи к более легким задачам."
        : readiness.state === "stable"
          ? "Держи умеренный темп: один главный блок, затем более легкие задачи."
          : readiness.state === "heavy"
            ? "День уже плотный, поэтому полезно сократить амбицию плана."
            : "Сегодня лучше двигаться бережно: короткие шаги, минимум тяжелых задач и больше пространства на восстановление."
    ],
    points: topTasks.length
      ? topTasks.map((task, index) => `${index + 1}. ${task.title}`)
      : [
          "Выбери 1–2 главные задачи вместо длинного списка.",
          "Не добавляй новый тяжелый блок без необходимости.",
          `Следи за Energy Debt: сейчас зона ${context.energyDebt.label}.`
        ]
  };
}

export function buildRuleBasedWeeklyReview(context) {
  const completed = context.summary.completedTasks;
  const heavyDays = context.overloadedDays.map((day) => day.date);
  const topTask = context.topHeavyTasks[0];

  return {
    title: "Weekly Review",
    paragraphs: [
      completed
        ? `За период получилось закрыть ${completed} задач. Лучший ритм обычно появлялся в дни без плотного слоя тяжелых задач.`
        : "Пока завершенных задач немного, но уже видно, какие паттерны делают неделю тяжелее.",
      heavyDays.length
        ? `Самыми тяжелыми выглядели дни: ${heavyDays.slice(0, 3).join(", ")}. В них росли стресс, задачная нагрузка или оба фактора сразу.`
        : "Явно перегруженных дней почти не видно, и это хороший знак для ритма недели.",
      topTask
        ? `Больше всего энергии забирали задачи вроде "${topTask.title}". Их лучше планировать на более сильные окна.`
        : "Самые энергозатратные задачи проявятся яснее, когда накопится больше данных."
    ],
    points: [
      context.energyDebt.value > 20
        ? "На следующей неделе стоит заранее заложить Recovery после тяжелых дней."
        : "Сохраняй текущий умеренный ритм и не наслаивай сложные задачи подряд.",
      context.summary.deepWorkTasks > 2
        ? "Ограничь Deep Work до 1–2 задач в день."
        : "Держи сложные задачи ближе к сильным по энергии окнам.",
      context.summary.highEmotionalTasks > 0
        ? "После emotionally heavy задач ставь более спокойные блоки."
        : "Продолжай отслеживать эмоциональную нагрузку, чтобы рекомендации стали точнее."
    ]
  };
}
