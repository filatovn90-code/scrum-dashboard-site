import { requireAuth, signOutCurrentUser } from "./auth-helpers.js";
import { getSupabase } from "./supabase-client.js";
import { landingPath, loginPath, todayPath } from "./route-paths.js";

const logoutButton = document.getElementById("logoutButton");
const periodSelect = document.getElementById("analyticsPeriodSelect");
const statusBox = document.getElementById("analyticsStatus");
const topCards = document.getElementById("analyticsTopCards");
const stateChart = document.getElementById("analyticsStateChart");
const stateInsight = document.getElementById("analyticsStateInsight");
const loadChart = document.getElementById("analyticsLoadChart");
const loadInsight = document.getElementById("analyticsLoadInsight");
const insightsBox = document.getElementById("analyticsInsights");
const taskTypesBox = document.getElementById("analyticsTaskTypes");
const taskTypesInsight = document.getElementById("analyticsTaskTypesInsight");
const overloadTrendBox = document.getElementById("analyticsOverloadTrend");
const recommendationsBox = document.getElementById("analyticsRecommendations");

let supabase;
let currentUser;

const PERIOD_OPTIONS = {
  this_week: "Эта неделя",
  last_week: "Прошлая неделя",
  last_14_days: "Последние 14 дней",
  last_30_days: "Последние 30 дней"
};

bootstrap();

logoutButton?.addEventListener("click", async () => {
  await signOutCurrentUser().catch(() => null);
  window.location.replace(landingPath());
});

periodSelect?.addEventListener("change", () => {
  renderAnalytics().catch((error) => {
    setStatus(error.message || "Не удалось обновить аналитику.", true);
  });
});

async function bootstrap() {
  currentUser = await requireAuth({ redirectTo: loginPath() });
  if (!currentUser) {
    return;
  }

  supabase = await getSupabase();
  await renderAnalytics();
}

async function renderAnalytics() {
  setStatus("Загружаю аналитику...");

  const periodKey = periodSelect?.value || "this_week";
  const range = getPeriodRange(periodKey);

  const [checkins, tasks] = await Promise.all([
    fetchCheckins(range),
    fetchTasks(range)
  ]);

  const dataset = buildDataset(range, checkins, tasks);

  renderTopCards(dataset);
  renderStateChart(dataset);
  renderLoadChart(dataset);
  renderInsights(dataset);
  renderTaskTypes(dataset);
  renderOverloadTrend(dataset);
  renderRecommendations(dataset);
  setStatus(`${PERIOD_OPTIONS[periodKey]} • ${formatDate(range.start)} - ${formatDate(range.end)}`);
}

async function fetchCheckins(range) {
  const { data, error } = await supabase
    .from("daily_checkins")
    .select("checkin_date, energy_level, stress_level, focus_level, sleep_quality, mood")
    .eq("user_id", currentUser.id)
    .gte("checkin_date", range.start)
    .lte("checkin_date", range.end)
    .order("checkin_date", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

async function fetchTasks(range) {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, planned_date, status, task_type, cognitive_load, emotional_load, energy_required, estimated_minutes, is_focus, completed_at, archived_at")
    .eq("user_id", currentUser.id)
    .gte("planned_date", range.start)
    .lte("planned_date", range.end)
    .is("archived_at", null)
    .order("planned_date", { ascending: true });

  if (error) {
    throw error;
  }

  const appTasks = data || [];
  const backlogTasks = loadBacklogTasks(range);

  return mergeTaskSources(appTasks, backlogTasks);
}

function loadBacklogTasks(range) {
  const activeUser = window.appStorage?.getItem("scrum-dashboard-auth-user");
  if (!activeUser) {
    return [];
  }

  const storageKeys = [
    `scrum-master-backlog-data:${activeUser}`,
    "scrum-master-backlog-data"
  ];

  for (const key of storageKeys) {
    const raw = window.appStorage?.getItem(key);
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw);
      return normalizeBacklogTasks(parsed, range);
    } catch (error) {
      console.warn("Не удалось прочитать задачи бэклога для аналитики.", error);
    }
  }

  return [];
}

function normalizeBacklogTasks(backlogData, range) {
  if (!backlogData || typeof backlogData !== "object") {
    return [];
  }

  const tasks = [];

  Object.entries(backlogData).forEach(([weekLabel, week]) => {
    const days = Array.isArray(week?.days) ? week.days : [];

    days.forEach((day, dayIndex) => {
      const plannedDate = backlogDateToIso(day?.date);
      if (!plannedDate || plannedDate < range.start || plannedDate > range.end) {
        return;
      }

      const items = Array.isArray(day?.items) ? day.items : [];
      items.forEach((item, itemIndex) => {
        tasks.push(mapBacklogItemToTask(item, plannedDate, weekLabel, dayIndex, itemIndex));
      });
    });
  });

  return tasks;
}

function mapBacklogItemToTask(item, plannedDate, weekLabel, dayIndex, itemIndex) {
  const energyCost = item?.energyCost || "M";
  const taskType = item?.taskType || "Low Energy";
  const status = mapBacklogStatus(item?.status);
  const estimatedMinutes = mapEnergyCostToMinutes(energyCost);
  const cognitiveLoad = mapTaskTypeToCognitiveLoad(taskType, energyCost);
  const emotionalLoad = mapStressToLoad(item?.stress);
  const energyRequired = mapTaskTypeToEnergyRequired(taskType, energyCost);

  return {
    id: item?.id || `backlog-${weekLabel}-${dayIndex}-${itemIndex}`,
    planned_date: plannedDate,
    status,
    task_type: taskType,
    cognitive_load: cognitiveLoad,
    emotional_load: emotionalLoad,
    energy_required: energyRequired,
    estimated_minutes: estimatedMinutes,
    is_focus: false,
    completed_at: status === "done" ? `${plannedDate}T18:00:00.000Z` : null,
    archived_at: null,
    source: "backlog",
    title: item?.text || "",
    time: item?.time || ""
  };
}

function backlogDateToIso(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const [day, month] = value.split(".");
  if (!day || !month) {
    return null;
  }

  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function mapBacklogStatus(status) {
  if (status === "Сделано") {
    return "done";
  }
  if (status === "В работе") {
    return "in_progress";
  }
  return "todo";
}

function mapStressToLoad(stress) {
  if (stress === "Высокий") {
    return 5;
  }
  if (stress === "Средний") {
    return 3;
  }
  if (stress === "Низкий") {
    return 2;
  }
  return 1;
}

function mapEnergyCostToMinutes(cost) {
  if (cost === "L") {
    return 90;
  }
  if (cost === "S") {
    return 30;
  }
  return 60;
}

function mapTaskTypeToCognitiveLoad(taskType, energyCost) {
  const level = energyCost === "L" ? 2 : energyCost === "S" ? 0 : 1;

  if (taskType === "Deep Work") {
    return 3 + level;
  }
  if (taskType === "High Energy") {
    return 2 + level;
  }
  return 1 + level;
}

function mapTaskTypeToEnergyRequired(taskType, energyCost) {
  const level = energyCost === "L" ? 2 : energyCost === "S" ? 0 : 1;

  if (taskType === "High Energy") {
    return 3 + level;
  }
  if (taskType === "Deep Work") {
    return 2 + level;
  }
  return 1 + level;
}

function mergeTaskSources(appTasks, backlogTasks) {
  const merged = new Map();

  [...backlogTasks, ...appTasks].forEach((task) => {
    const key = [task.id, task.planned_date, task.status, task.title || ""].join("::");
    merged.set(key, task);
  });

  return Array.from(merged.values()).sort((left, right) => {
    return String(left.planned_date || "").localeCompare(String(right.planned_date || ""));
  });
}

function buildDataset(range, checkins, tasks) {
  const dayMap = new Map();
  const taskTypes = new Map();
  const checkinMap = new Map(checkins.map((item) => [item.checkin_date, item]));

  for (const date of listDates(range.start, range.end)) {
    dayMap.set(date, {
      date,
      label: formatShortDate(date),
      weekday: weekdayLabel(date),
      checkin: checkinMap.get(date) || null,
      tasks: [],
      taskLoad: 0,
      deepWorkCount: 0,
      totalCognitive: 0,
      overloadScore: 0,
      overloadState: "normal"
    });
  }

  tasks.forEach((task) => {
    if (!task.planned_date || !dayMap.has(task.planned_date)) {
      return;
    }

    const day = dayMap.get(task.planned_date);
    day.tasks.push(task);

    const cognitive = Number(task.cognitive_load || 0);
    const emotional = Number(task.emotional_load || 0);
    const energyRequired = Number(task.energy_required || 0);
    const minutes = Number(task.estimated_minutes || 0);
    const load = cognitive * 10 + emotional * 8 + energyRequired * 6 + minutes / 10;

    day.taskLoad += load;
    day.totalCognitive += cognitive;
    if ((task.task_type || "") === "Deep Work") {
      day.deepWorkCount += 1;
    }

    const type = task.task_type || "Без типа";
    if (!taskTypes.has(type)) {
      taskTypes.set(type, {
        label: type,
        count: 0,
        cognitiveTotal: 0,
        emotionalTotal: 0,
        minutesTotal: 0
      });
    }

    const entry = taskTypes.get(type);
    entry.count += 1;
    entry.cognitiveTotal += cognitive;
    entry.emotionalTotal += emotional;
    entry.minutesTotal += minutes;
  });

  const days = Array.from(dayMap.values());
  days.forEach((day) => {
    const stress = Number(day.checkin?.stress_level || 0);
    const energy = Number(day.checkin?.energy_level || 0);
    const focus = Number(day.checkin?.focus_level || 0);

    let score = stress * 10 + day.taskLoad / 5;
    if (energy > 0 && energy <= 4) {
      score += 20;
    }
    if (focus > 0 && focus <= 4) {
      score += 10;
    }

    day.overloadScore = Math.round(score);
    day.overloadState = overloadState(day.overloadScore);
  });

  return {
    range,
    days,
    checkins,
    tasks,
    taskTypes: Array.from(taskTypes.values()).sort((a, b) => b.count - a.count),
    summary: buildSummary(days)
  };
}

function buildSummary(days) {
  const checkinDays = days.filter((day) => day.checkin);
  const avgEnergy = average(checkinDays.map((day) => Number(day.checkin.energy_level || 0)));
  const avgStress = average(checkinDays.map((day) => Number(day.checkin.stress_level || 0)));
  const avgFocus = average(checkinDays.map((day) => Number(day.checkin.focus_level || 0)));
  const overloadRisk = overloadRiskLabel(avgEnergy, avgStress, checkinDays.length);
  const highLoadDays = days.filter((day) => day.overloadState === "high").length;
  const riskDays = days.filter((day) => day.overloadState === "risk").length;

  return {
    avgEnergy,
    avgStress,
    avgFocus,
    overloadRisk,
    highLoadDays,
    riskDays
  };
}

function renderTopCards(dataset) {
  const cards = [
    {
      label: "Средняя энергия",
      value: dataset.summary.avgEnergy ? dataset.summary.avgEnergy.toFixed(1) : "—",
      note: dataset.checkins.length ? "По Daily Check-in" : "Нет данных состояния"
    },
    {
      label: "Средний стресс",
      value: dataset.summary.avgStress ? dataset.summary.avgStress.toFixed(1) : "—",
      note: dataset.checkins.length ? "По Daily Check-in" : "Нет данных состояния"
    },
    {
      label: "Средний фокус",
      value: dataset.summary.avgFocus ? dataset.summary.avgFocus.toFixed(1) : "—",
      note: dataset.checkins.length ? "По Daily Check-in" : "Нет данных состояния"
    },
    {
      label: "Риск перегруза",
      value: dataset.summary.overloadRisk.label,
      note: dataset.summary.overloadRisk.note,
      state: dataset.summary.overloadRisk.state
    }
  ];

  topCards.innerHTML = cards.map((card) => `
    <article class="analytics-card analytics-card-state ${card.state ? `is-${card.state}` : ""}">
      <p class="analytics-card-label">${card.label}</p>
      <strong class="analytics-card-value">${card.value}</strong>
      <span class="analytics-card-note">${card.note}</span>
    </article>
  `).join("");

  if (!dataset.checkins.length) {
    topCards.querySelectorAll(".analytics-card-note").forEach((note) => {
      note.textContent = "Данные появятся после заполнения состояния дня на странице «Сегодня».";
    });
  }
}

function renderStateChart(dataset) {
  if (!dataset.checkins.length) {
    stateChart.innerHTML = emptyState("Пока нет данных о состоянии.", "Перейти в Сегодня", todayPath());
    stateInsight.textContent = "Недостаточно данных для вывода. Заполняй check-in несколько дней подряд.";
    return;
  }

  const series = [
    { key: "energy_level", label: "Энергия", color: "#5d8f60" },
    { key: "stress_level", label: "Стресс", color: "#d67b5c" },
    { key: "focus_level", label: "Фокус", color: "#7a95c9" }
  ];

  stateChart.innerHTML = buildLineChart(dataset.days, series);

  const firstHalf = average(dataset.days.slice(0, Math.ceil(dataset.days.length / 2)).map((day) => Number(day.checkin?.energy_level || 0)));
  const secondHalf = average(dataset.days.slice(Math.ceil(dataset.days.length / 2)).map((day) => Number(day.checkin?.energy_level || 0)));
  const avgStress = dataset.summary.avgStress;
  const busiestStressDay = dataset.days.find((day) => day.taskLoad > 0 && Number(day.checkin?.stress_level || 0) >= 7);

  if (firstHalf && secondHalf && secondHalf < firstHalf) {
    stateInsight.textContent = busiestStressDay
      ? "Энергия снижалась во второй части периода, а в более загруженные дни стресс был выше."
      : "Энергия снижалась во второй части периода. Стоит внимательнее распределять нагрузку ближе к концу недели.";
    return;
  }

  if (avgStress >= 6) {
    stateInsight.textContent = "Стресс в среднем повышен. Полезно чередовать тяжелые и более спокойные дни.";
    return;
  }

  stateInsight.textContent = "Состояние выглядит относительно ровным. Хорошо работает умеренная и более предсказуемая нагрузка.";
}

function renderLoadChart(dataset) {
  if (!dataset.tasks.length) {
    loadChart.innerHTML = emptyState("Пока нет задач за выбранный период.", "Перейти в Бэклог", "backlog.html");
    loadInsight.textContent = "Когда появятся задачи, здесь будет видно, в какие дни нагрузка была выше.";
    return;
  }

  const maxLoad = Math.max(...dataset.days.map((day) => day.taskLoad), 1);
  loadChart.innerHTML = `
    <div class="analytics-load-bars">
      ${dataset.days.map((day) => `
        <article class="analytics-load-bar-card">
          <div class="analytics-load-bar-top">
            <strong>${Math.round(day.taskLoad)}</strong>
            <span>${day.tasks.length} ${pluralizeTasks(day.tasks.length)}</span>
          </div>
          <div class="analytics-load-bar-track">
            <span class="analytics-load-bar-fill" style="height: ${Math.max(8, (day.taskLoad / maxLoad) * 100)}%"></span>
          </div>
          <div class="analytics-load-bar-meta">
            <span>${day.label}</span>
            <small>Deep Work: ${day.deepWorkCount}</small>
          </div>
        </article>
      `).join("")}
    </div>
  `;

  const busiestDay = dataset.days.reduce((best, day) => day.taskLoad > best.taskLoad ? day : best, dataset.days[0]);
  loadInsight.textContent = `Самый загруженный день: ${busiestDay.weekday}, ${busiestDay.label}. Нагрузка: ${Math.round(busiestDay.taskLoad)}.`;
}

function renderInsights(dataset) {
  const insights = [];
  const highStressHighLoad = dataset.days.some((day) => day.taskLoad >= 80 && Number(day.checkin?.stress_level || 0) >= 7);
  const lowEnergyDeepWork = dataset.days.some((day) => Number(day.checkin?.energy_level || 10) <= 4 && day.deepWorkCount >= 2);
  const bestFocusDay = dataset.days.reduce((best, day) => Number(day.checkin?.focus_level || 0) > Number(best.checkin?.focus_level || 0) ? day : best, dataset.days[0] || {});
  const highEmotionalType = dataset.taskTypes.find((type) => type.count && (type.emotionalTotal / type.count) >= 4);

  if (highStressHighLoad) {
    insights.push("В дни с высокой задачной нагрузкой стресс тоже был выше.");
  }

  if (lowEnergyDeepWork) {
    insights.push("В дни с низкой энергией было запланировано много Deep Work задач. Это может повышать риск перегруза.");
  }

  if (bestFocusDay?.checkin && bestFocusDay.taskLoad > 0 && bestFocusDay.taskLoad <= 70) {
    insights.push("Лучший фокус был в дни с умеренной нагрузкой.");
  }

  if (highEmotionalType) {
    insights.push(`Задачи типа ${highEmotionalType.label} давали самую заметную эмоциональную нагрузку.`);
  }

  if (!insights.length) {
    insights.push(dataset.checkins.length || dataset.tasks.length
      ? "Пока мало устойчивых закономерностей. Заполняй состояние и продолжай вести задачи несколько дней подряд."
      : "Аналитика появится после нескольких дней использования трекера.");
  }

  insightsBox.innerHTML = insights.map((item) => `
    <article class="analytics-insight-card">
      <p>${item}</p>
    </article>
  `).join("");
}

function renderTaskTypes(dataset) {
  if (!dataset.tasks.length) {
    taskTypesBox.innerHTML = emptyState("Пока нет задач за выбранный период.", "Перейти в Бэклог", "backlog.html");
    taskTypesInsight.textContent = "";
    return;
  }

  taskTypesBox.innerHTML = dataset.taskTypes.map((type) => `
    <article class="analytics-type-card">
      <div class="analytics-type-head">
        <strong>${type.label}</strong>
        <span>${type.count} ${pluralizeTasks(type.count)}</span>
      </div>
      <div class="analytics-type-metrics">
        <span>Средняя cognitive: ${safeFixed(type.cognitiveTotal / type.count)}</span>
        <span>Средняя emotional: ${safeFixed(type.emotionalTotal / type.count)}</span>
        <span>Минут всего: ${Math.round(type.minutesTotal)}</span>
      </div>
    </article>
  `).join("");

  const dominant = dataset.taskTypes[0];
  const percent = dominant ? Math.round((dominant.count / dataset.tasks.length) * 100) : 0;
  taskTypesInsight.textContent = dominant
    ? `${dominant.label} занимает ${percent}% задач периода и даёт основную нагрузку.`
    : "";
}

function renderOverloadTrend(dataset) {
  if (!dataset.checkins.length && !dataset.tasks.length) {
    overloadTrendBox.innerHTML = emptyState("Аналитика появится после нескольких дней использования трекера.", "Перейти в Сегодня", todayPath());
    return;
  }

  overloadTrendBox.innerHTML = `
    <article class="analytics-overload-card analytics-overload-summary">
      <p class="analytics-card-label">Текущий статус</p>
      <strong class="analytics-card-value">${dataset.summary.overloadRisk.label}</strong>
      <span class="analytics-card-note">${dataset.summary.riskDays} дней с риском перегруза • ${dataset.summary.highLoadDays} дней с высокой нагрузкой</span>
    </article>
    ${dataset.days.map((day) => `
      <article class="analytics-overload-card is-${day.overloadState}">
        <div class="analytics-overload-head">
          <strong>${day.label}</strong>
          <span>${day.weekday}</span>
        </div>
        <div class="analytics-overload-score">${day.overloadScore}</div>
        <div class="analytics-overload-badge is-${day.overloadState}">${overloadLabel(day.overloadState)}</div>
      </article>
    `).join("")}
  `;
}

function renderRecommendations(dataset) {
  const recommendations = [];
  const deepWorkTotal = dataset.tasks.filter((task) => (task.task_type || "") === "Deep Work").length;
  const incompleteTasks = dataset.tasks.filter((task) => !task.completed_at && task.status !== "done").length;
  const lateWeekDrop = energyDropsLateWeek(dataset.days);

  if (!dataset.checkins.length) {
    recommendations.push("Заполняй состояние утром — так аналитика станет точнее.");
  }

  if (deepWorkTotal >= Math.max(4, Math.ceil(dataset.days.length / 2))) {
    recommendations.push("Ограничь Deep Work до 1–2 задач в день.");
  }

  if (dataset.summary.avgStress >= 6) {
    recommendations.push("После тяжелых дней добавляй больше Recovery или Admin задач.");
  }

  if (lateWeekDrop) {
    recommendations.push("Не ставь самые сложные задачи на четверг и пятницу.");
  }

  if (incompleteTasks >= 5) {
    recommendations.push("План выглядит перегруженным. Лучше уменьшить количество задач дня.");
  }

  if (!recommendations.length) {
    recommendations.push("Текущий ритм выглядит устойчивым. Сохраняй умеренную нагрузку и следи за состоянием каждый день.");
  }

  recommendationsBox.innerHTML = recommendations.map((item) => `
    <article class="analytics-insight-card">
      <p>${item}</p>
    </article>
  `).join("");
}

function buildLineChart(days, series) {
  const width = 760;
  const height = 260;
  const padding = { top: 20, right: 20, bottom: 42, left: 34 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const xStep = days.length > 1 ? innerWidth / (days.length - 1) : innerWidth;
  const y = (value) => padding.top + innerHeight - ((value - 1) / 9) * innerHeight;

  const gridLines = Array.from({ length: 5 }, (_, index) => {
    const value = 1 + index * 2.25;
    const position = padding.top + innerHeight - (index / 4) * innerHeight;
    return `
      <line x1="${padding.left}" y1="${position}" x2="${width - padding.right}" y2="${position}" class="analytics-svg-grid-line"></line>
      <text x="${padding.left - 10}" y="${position + 4}" class="analytics-svg-axis-label">${Math.round(value)}</text>
    `;
  }).join("");

  const labels = days.map((day, index) => `
    <text x="${padding.left + index * xStep}" y="${height - 14}" class="analytics-svg-axis-label">${day.label}</text>
  `).join("");

  const paths = series.map((item) => {
    const points = days.map((day, index) => {
      const value = Number(day.checkin?.[item.key] || 0);
      return value ? `${padding.left + index * xStep},${y(value)}` : null;
    });

    const segments = [];
    let current = [];
    points.forEach((point) => {
      if (point) {
        current.push(point);
      } else if (current.length) {
        segments.push(current);
        current = [];
      }
    });
    if (current.length) {
      segments.push(current);
    }

    return segments.map((segment) => `
      <polyline points="${segment.join(" ")}" fill="none" stroke="${item.color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
    `).join("");
  }).join("");

  const dots = series.map((item) => {
    return days.map((day, index) => {
      const value = Number(day.checkin?.[item.key] || 0);
      if (!value) {
        return "";
      }

      return `<circle cx="${padding.left + index * xStep}" cy="${y(value)}" r="4" fill="${item.color}"></circle>`;
    }).join("");
  }).join("");

  const legend = series.map((item) => `
    <div class="analytics-legend-item">
      <span class="analytics-legend-dot" style="background:${item.color}"></span>
      <span>${item.label}</span>
    </div>
  `).join("");

  return `
    <div class="analytics-legend">${legend}</div>
    <svg viewBox="0 0 ${width} ${height}" class="analytics-svg">
      ${gridLines}
      ${paths}
      ${dots}
      ${labels}
    </svg>
  `;
}

function getPeriodRange(periodKey) {
  const today = new Date();
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayIndex = (current.getDay() + 6) % 7;

  if (periodKey === "last_week") {
    const end = shiftDate(current, -(dayIndex + 1));
    const start = shiftDate(end, -6);
    return { start: toIso(start), end: toIso(end) };
  }

  if (periodKey === "last_14_days") {
    return { start: toIso(shiftDate(current, -13)), end: toIso(current) };
  }

  if (periodKey === "last_30_days") {
    return { start: toIso(shiftDate(current, -29)), end: toIso(current) };
  }

  const start = shiftDate(current, -dayIndex);
  const end = shiftDate(start, 6);
  return { start: toIso(start), end: toIso(end) };
}

function listDates(startIso, endIso) {
  const dates = [];
  let cursor = new Date(startIso);
  const end = new Date(endIso);

  while (cursor <= end) {
    dates.push(toIso(cursor));
    cursor = shiftDate(cursor, 1);
  }

  return dates;
}

function overloadRiskLabel(avgEnergy, avgStress, checkinCount = 0) {
  if (!checkinCount) {
    return { label: "—", state: "", note: "Нет данных состояния" };
  }
  if (avgStress >= 8 && avgEnergy <= 4) {
    return { label: "Высокий", state: "risk", note: "Стресс высокий, а энергия низкая." };
  }
  if (avgStress >= 6 || avgEnergy <= 5) {
    return { label: "Средний", state: "high", note: "Нагрузка требует внимания." };
  }
  return { label: "Низкий", state: "normal", note: "Состояние выглядит устойчиво." };
}

function overloadState(score) {
  if (score >= 91) return "risk";
  if (score >= 61) return "high";
  return "normal";
}

function overloadLabel(state) {
  if (state === "risk") return "Риск перегруза";
  if (state === "high") return "Высокая нагрузка";
  return "Нормальная нагрузка";
}

function energyDropsLateWeek(days) {
  const lateDays = days.filter((day) => {
    const week = weekdayLabel(day.date);
    return week === "Четверг" || week === "Пятница";
  });
  const earlyDays = days.filter((day) => {
    const week = weekdayLabel(day.date);
    return week === "Понедельник" || week === "Вторник";
  });

  const lateAvg = average(lateDays.map((day) => Number(day.checkin?.energy_level || 0)));
  const earlyAvg = average(earlyDays.map((day) => Number(day.checkin?.energy_level || 0)));
  return lateAvg > 0 && earlyAvg > 0 && lateAvg + 1 < earlyAvg;
}

function emptyState(text, actionLabel, href) {
  return `
    <div class="analytics-empty-card">
      <p class="analytics-empty">${text}</p>
      ${actionLabel ? `<a class="ghost-button analytics-empty-link" href="${href}">${actionLabel}</a>` : ""}
    </div>
  `;
}

function average(values) {
  const filtered = values.filter((value) => Number.isFinite(value) && value > 0);
  if (!filtered.length) {
    return 0;
  }
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function safeFixed(value) {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}

function weekdayLabel(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString("ru-RU", { weekday: "long" }).replace(/^./, (char) => char.toUpperCase());
}

function formatShortDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function pluralizeTasks(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "задача";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "задачи";
  return "задач";
}

function toIso(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10);
}

function shiftDate(date, diff) {
  const next = new Date(date);
  next.setDate(next.getDate() + diff);
  return next;
}

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.classList.toggle("is-error", isError);
}
