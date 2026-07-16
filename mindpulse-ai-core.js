import {
  average,
  calculateDailyLoad,
  calculateDailyLoadLevel,
  calculateEnergyDebtSeries,
  calculateReadinessScore,
  calculateTaskLoad,
  clamp,
  currentState,
  describeTaskLoad,
  generateRuleBasedRecommendations,
  getTaskTypeLabel,
  listDates,
  normalizeTask,
  summarizeEnergyDebt,
  shiftIsoDate,
  toIsoDate
} from "./lib/workload.js";

export { clamp, toIsoDate, shiftIsoDate };

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

export function normalizeTaskRecord(task) {
  return normalizeTask(task);
}

export {
  currentState,
  calculateTaskLoad
};

function isDoneTask(task) {
  return task?.status === "done" || Boolean(task?.completed_at);
}

export function buildAiContext({
  periodStart,
  periodEnd,
  checkins = [],
  tasks = [],
  todayIso = periodEnd
}) {
  const normalizedTasks = (tasks || [])
    .map(normalizeTask)
    .filter((task) => task.planned_date && task.planned_date >= periodStart && task.planned_date <= periodEnd && !task.archived_at);

  const checkinMap = new Map((checkins || []).map((item) => [toIsoDate(item.checkin_date), item]));
  const taskMap = new Map();

  normalizedTasks.forEach((task) => {
    if (!taskMap.has(task.planned_date)) {
      taskMap.set(task.planned_date, []);
    }
    taskMap.get(task.planned_date).push(task);
  });

  const debtSeries = calculateEnergyDebtSeries(checkins, normalizedTasks);
  const debtMap = new Map(debtSeries.map((item) => [item.date, item]));

  const days = listDates(periodStart, periodEnd).map((date) => {
    const dayCheckin = checkinMap.get(date) || null;
    const dayTasks = taskMap.get(date) || [];
    const debtSnapshot = debtMap.get(date) || { value: 0, delta: 0 };
    const energyDebt = summarizeEnergyDebt(
      debtSeries.filter((item) => item.date <= date)
    );
    const readiness = calculateReadinessScore(dayCheckin, dayTasks, energyDebt);
    const dailyLoad = readiness.dailyLoad || calculateDailyLoad(dayTasks);
    const dailyLoadLevel = readiness.dailyLoadLevel || calculateDailyLoadLevel(dayTasks);

    return {
      date,
      checkin: dayCheckin,
      tasks: dayTasks,
      taskLoad: dailyLoad.total,
      dailyLoad,
      dailyLoadLevel,
      readiness,
      readinessScore: readiness.score,
      overloadState: dailyLoadLevel.key,
      deepWorkCount: dailyLoad.deepWorkCount,
      highEmotionalCount: dailyLoad.emotionalHeavyCount,
      completedCount: dayTasks.filter(isDoneTask).length,
      energyDebtValue: debtSnapshot.value,
      energyDebtDelta: debtSnapshot.delta
    };
  });

  const today = days.find((day) => day.date === todayIso) || days[days.length - 1] || null;
  const energyDebt = summarizeEnergyDebt(debtSeries);
  const topHeavyTasks = [...normalizedTasks]
    .map((task) => ({
      ...task,
      burden: calculateTaskLoad(task)
    }))
    .sort((left, right) => right.burden - left.burden)
    .slice(0, 3);

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
      avgEnergy: average(checkins.map((item) => item.energy_level)),
      avgStress: average(checkins.map((item) => item.stress_level)),
      avgFocus: average(checkins.map((item) => item.focus_level)),
      avgReadiness: average(days.map((day) => day.readinessScore)),
      totalTasks: normalizedTasks.length,
      completedTasks: normalizedTasks.filter(isDoneTask).length,
      deepWorkTasks: normalizedTasks.filter((task) => task.task_type === "deep_work").length,
      highEmotionalTasks: normalizedTasks.filter((task) => Number(task.emotional_load || 0) >= 4).length
    },
    lowEnergyDays: days.filter((day) => Number(day.checkin?.energy_level || 0) > 0 && Number(day.checkin?.energy_level || 0) <= 4),
    overloadedDays: days.filter((day) => ["high", "overload"].includes(day.dailyLoadLevel.key)),
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
          deepWorkCount: context.today.dailyLoad.deepWorkCount,
          highEmotionalCount: context.today.dailyLoad.emotionalHeavyCount,
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
      overloadState: day.dailyLoadLevel.key,
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
      cognitiveLoad: Number(task.cognitive_load || 0),
      emotionalLoad: Number(task.emotional_load || 0)
    }))
  };
}

export function buildRuleBasedCoachResponse(action, context) {
  const today = context.today;
  const todayTasks = today?.tasks || [];
  const readiness = today?.readiness || calculateReadinessScore(null, [], context.energyDebt);
  const checkin = today?.checkin || null;
  const state = currentState(checkin);
  const recommendations = generateRuleBasedRecommendations(checkin, todayTasks, {
    readiness,
    energyDebt: context.energyDebt
  });

  if (action === "move") {
    const candidates = [...todayTasks]
      .sort((left, right) => calculateTaskLoad(right) - calculateTaskLoad(left))
      .slice(0, 3)
      .map((task) => {
        const meta = describeTaskLoad(task);
        return `В первую очередь можно перенести: ${task.title} — ${meta.typeLabel}, нагрузка ${meta.intensityLabel.toLowerCase()}.`;
      });

    return {
      title: "Что лучше перенести?",
      paragraphs: [
        todayTasks.length
          ? "Если день уже плотный, лучше переносить не всё подряд, а самые дорогие по вниманию и эмоциям задачи."
          : "Сегодня задач немного, поэтому переносить почти нечего.",
        context.energyDebt.value > 20
          ? "Перенос особенно полезен сейчас: энергетическая нагрузка уже успела накопиться."
          : "Даже один перенос может сохранить больше запаса энергии к концу дня."
      ],
      points: candidates.length ? candidates : ["Оставь только 1–2 действительно главные задачи и не добавляй новый тяжёлый блок без необходимости."]
    };
  }

  if (action === "why-tired") {
    const reasons = [];
    if (state.stress >= 7) reasons.push("стресс держится выше комфортного уровня");
    if (state.energy <= 4) reasons.push("энергии сегодня немного");
    if ((today?.taskLoad || 0) > DAILY_LOAD_LIMITS.noticeable) reasons.push("план дня уже довольно плотный");
    if (context.energyDebt.value > 20) reasons.push("последние дни уже копят энергетический долг");

    return {
      title: "Почему я устал?",
      paragraphs: [
        reasons.length
          ? `Похоже, усталость складывается из нескольких факторов: ${reasons.join(", ")}.`
          : "Одного очевидного источника усталости не видно, но ритм недели уже мог накопить фоновую нагрузку.",
        "Сильнее всего обычно утомляют задачи с высокой когнитивной и эмоциональной нагрузкой, особенно если они идут подряд."
      ],
      points: [
        "Не ставь несколько эмоционально тяжёлых задач подряд.",
        "После сложного блока оставляй более спокойную задачу или паузу.",
        "Смотри на задачу не только по срочности, но и по цене для энергии."
      ]
    };
  }

  if (action === "reduce-load") {
    return {
      title: "Как снизить нагрузку сегодня?",
      paragraphs: [
        readiness.state === "risk"
          ? "День уже близок к перегрузу. Лучший способ разгрузить его — упростить план, а не ускоряться."
          : "Нагрузку лучше снижать заранее, пока день ещё можно сделать управляемым.",
        `Readiness Score сейчас ${readiness.score}, Energy Debt — ${context.energyDebt.value}.`
      ],
      points: [
        "Оставь только одну главную задачу с высокой когнитивной нагрузкой.",
        "Сдвинь часть общения или рутины на другой день, если план уже плотный.",
        "Не добавляй ещё один блок Deep Work, если их уже две или больше."
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
      recommendations[0] || "План дня выглядит реалистично, если оставить фокус на главном."
    ],
    points: topTasks.length
      ? topTasks.map((task, index) => `${index + 1}. ${task.title}`)
      : [
          "Выбери 1–2 главные задачи вместо длинного списка.",
          "Не добавляй новый тяжёлый блок без необходимости.",
          `Следи за Energy Debt: сейчас зона «${context.energyDebt.label}».`
        ]
  };
}

const DAILY_LOAD_LIMITS = {
  noticeable: 140
};

export function buildRuleBasedWeeklyReview(context) {
  const completed = context.summary.completedTasks;
  const heavyDays = context.overloadedDays.map((day) => day.date);
  const topTask = context.topHeavyTasks[0];

  return {
    title: "Weekly Review",
    paragraphs: [
      completed
        ? `За период получилось закрыть ${completed} задач. Лучший ритм обычно появлялся в дни без плотного слоя тяжёлых задач.`
        : "Завершённых задач пока немного, но уже видно, какие паттерны делают неделю тяжелее.",
      heavyDays.length
        ? `Самыми тяжёлыми выглядели дни: ${heavyDays.slice(0, 3).join(", ")}.`
        : "Явно перегруженных дней почти не видно, и это хороший знак для ритма недели.",
      topTask
        ? `Больше всего энергии забирали задачи вроде «${topTask.title}». Их лучше планировать на более сильные окна.`
        : "Самые энергозатратные задачи проявятся яснее, когда накопится больше данных."
    ],
    points: [
      context.energyDebt.value > 20
        ? "На следующей неделе стоит заранее заложить восстановление после тяжёлых дней."
        : "Сохраняй текущий умеренный ритм и не наслаивай сложные задачи подряд.",
      context.summary.deepWorkTasks > 2
        ? "Ограничь Deep Work до 1–2 задач в день."
        : "Ставь самые сложные задачи в лучшие по энергии окна.",
      context.summary.highEmotionalTasks > 0
        ? "После эмоционально тяжёлых задач оставляй более спокойные блоки."
        : "Продолжай отслеживать эмоциональную нагрузку, чтобы рекомендации стали точнее."
    ]
  };
}
