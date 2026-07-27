import { requireAuth, signOutCurrentUser } from "./auth-helpers.js";
import { getSupabase } from "./supabase-client.js";
import { applyTranslations, onLocaleChange, t } from "./i18n.js";
import { backlogPath, landingPath, loginPath, todayPath } from "./route-paths.js";
import { getCurrentPlan, isProPlan } from "./pricing-helpers.js";
import { requestWeeklyReview } from "./ai-service.js";
import {
  calculateDailyLoad,
  calculateDailyLoadLevel,
  calculateEnergyDebtSeries,
  calculateReadinessScore,
  currentState,
  generateRuleBasedRecommendations,
  getTaskTypeLabel,
  listDates,
  normalizeTask,
  summarizeEnergyDebt,
  toIsoDate
} from "./lib/workload.js";

const logoutButton = document.getElementById("logoutButton");
const periodSelect = document.getElementById("analyticsPeriodSelect");
const statusBox = document.getElementById("analyticsStatus");
const weeklyInsightsBox = document.getElementById("analyticsWeeklyInsights");
const weeklyReviewButton = document.getElementById("analyticsWeeklyReviewButton");
const weeklyReviewBox = document.getElementById("analyticsWeeklyReview");
const topCards = document.getElementById("analyticsTopCards");
const stateChart = document.getElementById("analyticsStateChart");
const stateInsight = document.getElementById("analyticsStateInsight");
const loadChart = document.getElementById("analyticsLoadChart");
const loadInsight = document.getElementById("analyticsLoadInsight");
const debtTrend = document.getElementById("analyticsDebtTrend");
const debtInsight = document.getElementById("analyticsDebtInsight");
const insightsBox = document.getElementById("analyticsInsights");
const taskTypesBox = document.getElementById("analyticsTaskTypes");
const taskTypesInsight = document.getElementById("analyticsTaskTypesInsight");
const overloadTrendBox = document.getElementById("analyticsOverloadTrend");
const recommendationsBox = document.getElementById("analyticsRecommendations");
const aiAssistantToggle = document.getElementById("aiAssistantToggle");

let supabase;
let currentUser;
let currentDataset = null;
let currentPlan = "free";

const PERIOD_OPTIONS = {
  this_week: "analytics.periodThisWeek",
  last_week: "analytics.periodLastWeek",
  last_14_days: "analytics.periodLast14Days",
  last_30_days: "analytics.periodLast30Days"
};

bootstrap();

onLocaleChange(() => {
  applyTranslations(document);
  renderAnalytics().catch((error) => {
    setStatus(error.message || t("analytics.refreshError"), true);
  });
});

logoutButton?.addEventListener("click", async () => {
  await signOutCurrentUser().catch(() => null);
  window.location.replace(landingPath());
});

periodSelect?.addEventListener("change", () => {
  renderAnalytics().catch((error) => {
    setStatus(error.message || t("analytics.refreshError"), true);
  });
});

weeklyReviewButton?.addEventListener("click", async () => {
  await renderWeeklyReview(currentDataset);
});

async function bootstrap() {
  currentUser = await requireAuth({ redirectTo: loginPath() });
  if (!currentUser) {
    return;
  }

  supabase = await getSupabase();
  currentPlan = await getCurrentPlan().catch(() => "free");
  applyPricingState();
  if (aiAssistantToggle) {
    aiAssistantToggle.textContent = t("analytics.askAi");
    aiAssistantToggle.dataset.locked = "false";
    delete aiAssistantToggle.dataset.lockHref;
  }
  await renderAnalytics();
}

function applyPricingState() {
  if (isProPlan(currentPlan)) {
    return;
  }

  if (periodSelect) {
    Array.from(periodSelect.options).forEach((option) => {
      if (option.value !== "this_week") {
        option.disabled = true;
        if (!option.textContent.includes("Pro")) {
          option.textContent = `${option.textContent} — Pro`;
        }
      }
    });
    periodSelect.value = "this_week";
  }

  if (aiAssistantToggle) {
    aiAssistantToggle.textContent = t("analytics.aiProLocked");
    aiAssistantToggle.dataset.locked = "true";
    delete aiAssistantToggle.dataset.lockHref;
  }
}

async function renderAnalytics() {
  setStatus(t("analytics.loading"));

  const periodKey = periodSelect?.value || "this_week";
  const range = getPeriodRange(periodKey);

  const [checkins, tasks] = await Promise.all([
    fetchCheckins(range),
    fetchTasks(range)
  ]);

  currentDataset = buildDataset(range, checkins, tasks);

  renderWeeklyInsights(currentDataset);
  renderWeeklyReviewPlaceholder(currentDataset);
  renderTopCards(currentDataset);
  renderStateChart(currentDataset);
  renderLoadChart(currentDataset);
  renderDebtTrend(currentDataset);
  renderInsights(currentDataset);
  renderTaskTypes(currentDataset);
  renderOverloadTrend(currentDataset);
  renderRecommendations(currentDataset);

  setStatus(`${t(PERIOD_OPTIONS[periodKey])} • ${formatDate(range.start)} - ${formatDate(range.end)}`);
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
  let data;
  let error;

  ({
    data,
    error
  } = await supabase
    .from("tasks")
    .select("id, title, details, planned_date, status, task_type, cognitive_load, emotional_load, is_focus, completed_at, archived_at")
    .eq("user_id", currentUser.id)
    .gte("planned_date", range.start)
    .lte("planned_date", range.end)
    .is("archived_at", null)
    .order("planned_date", { ascending: true }));

  if (error && String(error.message || "").includes("title")) {
    ({
      data,
      error
    } = await supabase
      .from("tasks")
      .select("id, planned_date, status, task_type, cognitive_load, emotional_load, is_focus, completed_at, archived_at")
      .eq("user_id", currentUser.id)
      .gte("planned_date", range.start)
      .lte("planned_date", range.end)
      .is("archived_at", null)
      .order("planned_date", { ascending: true }));
  }

  if (error) {
    throw error;
  }

  const appTasks = (data || []).map((task) => normalizeTask(task));
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
  const mappedType = mapLegacyTaskType(item?.task_type || item?.taskType);
  const cognitiveLoad = clampLoad(item?.cognitive_load ?? item?.mentalCost ?? legacyTypeToCognitive(mappedType));
  const emotionalLoad = clampLoad(item?.emotional_load ?? item?.emotionalCost ?? mapStressToLoad(item?.stress));

  return normalizeTask({
    id: item?.id || `backlog-${weekLabel}-${dayIndex}-${itemIndex}`,
    planned_date: plannedDate,
    status: mapBacklogStatus(item?.status),
    task_type: mappedType,
    cognitive_load: cognitiveLoad,
    emotional_load: emotionalLoad,
    is_focus: Boolean(item?.is_focus),
    completed_at: mapBacklogStatus(item?.status) === "done" ? `${plannedDate}T18:00:00.000Z` : null,
    archived_at: null,
    source: "backlog",
    title: item?.title || item?.text || "",
    time: item?.time || ""
  });
}

function mergeTaskSources(appTasks, backlogTasks) {
  const merged = new Map();

  [...backlogTasks, ...appTasks].forEach((task) => {
    const normalized = normalizeTask(task);
    const key = [normalized.id, normalized.planned_date, normalized.title || ""].join("::");
    merged.set(key, normalized);
  });

  return Array.from(merged.values()).sort((left, right) => {
    return String(left.planned_date || "").localeCompare(String(right.planned_date || ""));
  });
}

function buildDataset(range, checkins, tasks) {
  const dayMap = new Map();
  const checkinMap = new Map(checkins.map((item) => [item.checkin_date, item]));

  for (const date of listDates(range.start, range.end)) {
    dayMap.set(date, {
      date,
      label: formatShortDate(date),
      weekday: weekdayLabel(date),
      checkin: checkinMap.get(date) || null,
      tasks: [],
      loadValue: 0,
      loadMeta: calculateDailyLoad([]),
      readiness: { score: 65, label: "Стабильное состояние", note: "Появится после оценок состояния и задач.", state: "stable" },
      overloadState: "balanced",
      overloadLabel: "Сбалансировано"
    });
  }

  tasks.forEach((task) => {
    if (!task.planned_date || !dayMap.has(task.planned_date)) {
      return;
    }
    dayMap.get(task.planned_date).tasks.push(normalizeTask(task));
  });

  const days = Array.from(dayMap.values());
  const recentHistory = [];

  days.forEach((day) => {
    day.loadMeta = calculateDailyLoad(day.tasks);
    day.loadValue = day.loadMeta.total;
    const loadLevel = calculateDailyLoadLevel(day.tasks);
    day.overloadState = loadLevel.state;
    day.overloadLabel = loadLevel.label;
    day.readiness = calculateReadinessScore(day.checkin, day.tasks, recentHistory);
    recentHistory.push({
      date: day.date,
      checkin: day.checkin,
      tasks: day.tasks
    });
  });

  const debtSeries = calculateEnergyDebtSeries(checkins, tasks);
  const debtMap = new Map(debtSeries.map((item) => [item.date, item]));

  days.forEach((day) => {
    day.debt = debtMap.get(day.date) || {
      date: day.date,
      debt: 0,
      delta: 0,
      status: "healthy",
      label: "Устойчивый ритм"
    };
  });

  const taskTypes = buildTaskTypeSummary(tasks);
  const summary = buildSummary(days, tasks, checkins);

  return {
    range,
    days,
    checkins,
    tasks,
    taskTypes,
    summary
  };
}

function buildTaskTypeSummary(tasks) {
  const map = new Map();

  tasks.forEach((rawTask) => {
    const task = normalizeTask(rawTask);
    const key = task.task_type || "routine";
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: getTaskTypeLabel(key),
        count: 0,
        cognitiveTotal: 0,
        emotionalTotal: 0,
        loadTotal: 0
      });
    }

    const entry = map.get(key);
    entry.count += 1;
    entry.cognitiveTotal += Number(task.cognitive_load || 0);
    entry.emotionalTotal += Number(task.emotional_load || 0);
    entry.loadTotal += Number(task.task_load || 0);
  });

  return Array.from(map.values()).sort((left, right) => right.count - left.count);
}

function buildSummary(days, tasks, checkins) {
  const checkinDays = days.filter((day) => day.checkin);
  const avgEnergy = average(checkinDays.map((day) => Number(day.checkin.energy_level || 0)));
  const avgStress = average(checkinDays.map((day) => Number(day.checkin.stress_level || 0)));
  const avgFocus = average(checkinDays.map((day) => Number(day.checkin.focus_level || 0)));
  const debtMeta = summarizeEnergyDebt(calculateEnergyDebtSeries(checkins, tasks));
  const readinessAverage = average(days.map((day) => Number(day.readiness?.score || 0)));
  const overloadDays = days.filter((day) => day.overloadState === "overload").length;
  const highDays = days.filter((day) => day.overloadState === "high").length;

  return {
    avgEnergy,
    avgStress,
    avgFocus,
    debt: debtMeta,
    readinessAverage,
    overloadRisk: overloadRiskLabel(avgEnergy, avgStress),
    overloadDays,
    highDays
  };
}

function renderWeeklyInsights(dataset) {
  if (!weeklyInsightsBox) {
    return;
  }

  const insights = analyzeWeeklyInsights(dataset);
  weeklyInsightsBox.innerHTML = insights.map((item) => `
    <article class="analytics-weekly-insight-card ${item.state ? `is-${item.state}` : ""}">
      <span class="analytics-card-label">${item.label}</span>
      <strong>${item.title}</strong>
      <p>${item.description}</p>
    </article>
  `).join("");
}

function analyzeWeeklyInsights(dataset) {
  const insights = [];
  const heavyDay = [...dataset.days].sort((left, right) => right.loadValue - left.loadValue)[0];
  const emotionalSpike = dataset.taskTypes.find((type) => type.count > 0 && (type.emotionalTotal / type.count) >= 4);
  const deepWorkDays = dataset.days.filter((day) => day.tasks.filter((task) => task.task_type === "deep_work").length >= 3);
  const noRecoveryDays = dataset.days.filter((day) => day.tasks.length > 0 && !day.tasks.some((task) => task.task_type === "recovery"));

  if (heavyDay?.tasks?.length) {
    insights.push({
      label: t("analytics.weekSummaryLoadLabel"),
      title: `${heavyDay.weekday} выглядит самым тяжелым днем`,
      description: `Суммарная нагрузка в этот день была ${Math.round(heavyDay.loadValue)}. Если это повторяется, лучше заранее разгружать середину недели.`,
      state: heavyDay.overloadState === "overload" ? "risk" : "high"
    });
  }

  if (emotionalSpike) {
    insights.push({
      label: t("analytics.weekSummaryEmotionLabel"),
      title: `${emotionalSpike.label} сильнее всего нагружает эмоционально`,
      description: `Средняя эмоциональная нагрузка для этого типа задач — ${safeFixed(emotionalSpike.emotionalTotal / emotionalSpike.count)} из 5.`,
      state: "high"
    });
  }

  if (deepWorkDays.length) {
    insights.push({
      label: t("analytics.weekSummaryFocusLabel"),
      title: "Три и более задач глубокой работы собираются в один день",
      description: "Такая связка часто делает день тяжелее и снижает реалистичность плана. Лучше распределять глубокую работу по неделе.",
      state: "risk"
    });
  }

  if (noRecoveryDays.length >= Math.max(2, Math.ceil(dataset.days.length / 2))) {
    insights.push({
      label: t("analytics.weekSummaryRecoveryLabel"),
      title: "Задач на восстановление почти не было",
      description: "Неделя выглядит плотной без пауз на восстановление. Даже короткие восстановительные блоки помогают держать ритм устойчивым.",
      state: "high"
    });
  }

  if (!insights.length) {
    insights.push({
      label: t("analytics.weekSummaryLabel"),
      title: t("analytics.weekSummaryFallbackTitle"),
      description: t("analytics.weekSummaryFallbackBody"),
      state: ""
    });
  }

  return insights.slice(0, 4);
}

function renderWeeklyReviewPlaceholder(dataset) {
  if (!weeklyReviewBox) {
    return;
  }

  if (!dataset?.checkins.length && !dataset?.tasks.length) {
    weeklyReviewBox.innerHTML = `<p>${t("analytics.weeklyReviewEmpty")}</p>`;
    return;
  }

  weeklyReviewBox.innerHTML = `<p>${t("analytics.weeklyReviewPrompt")}</p>`;
}

async function renderWeeklyReview(dataset) {
  if (!weeklyReviewBox) {
    return;
  }

  const localReview = buildWeeklyReview(dataset);

  if (!isProPlan(currentPlan)) {
    weeklyReviewBox.innerHTML = localReview.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
    return;
  }

  weeklyReviewBox.innerHTML = `<p>${t("analytics.weeklyReviewLoading")}</p>`;

  const remote = await requestWeeklyReview({
    periodStart: dataset?.range?.start,
    periodEnd: dataset?.range?.end
  }).catch(() => null);

  const review = remote?.review || localReview;
  const sourceLabel = remote?.source === "openai"
    ? `<p><strong>${t("analytics.weeklyReviewPro")}</strong></p>`
    : remote?.source === "cache"
      ? `<p><strong>${t("analytics.weeklyReviewCache")}</strong></p>`
      : "";

  weeklyReviewBox.innerHTML = `${sourceLabel}${review.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}`;
}

function buildWeeklyReview(dataset) {
  if (!dataset || (!dataset.checkins.length && !dataset.tasks.length)) {
    return {
      paragraphs: [
        t("analytics.weeklyReviewNoData")
      ]
    };
  }

  const completedTasks = dataset.tasks.filter((task) => task.status === "done" || task.completed_at);
  const pendingTasks = dataset.tasks.filter((task) => task.status !== "done" && !task.completed_at);
  const heavyDays = dataset.days.filter((day) => day.overloadState === "overload" || day.overloadState === "high");
  const topHeavyTasks = [...dataset.tasks]
    .sort((left, right) => Number(right.task_load || 0) - Number(left.task_load || 0))
    .slice(0, 3);
  const debt = dataset.summary.debt;
  const dominantType = dataset.taskTypes[0];

  return {
    paragraphs: [
      dataset.checkins.length
        ? t("analytics.weeklyReviewStateSummary", {
            energy: formatMetricValue(dataset.summary.avgEnergy),
            stress: formatMetricValue(dataset.summary.avgStress),
            focus: formatMetricValue(dataset.summary.avgFocus)
          })
        : t("analytics.weeklyReviewStateFew"),
      completedTasks.length
        ? t("analytics.weeklyReviewCompleted", {
            count: completedTasks.length,
            tasksWord: pluralizeTasks(completedTasks.length)
          })
        : t("analytics.weeklyReviewCompletedFew"),
      heavyDays.length
        ? t("analytics.weeklyReviewHeavyDays", { days: formatDayList(heavyDays) })
        : t("analytics.weeklyReviewHeavyDaysNone"),
      topHeavyTasks.length
        ? t("analytics.weeklyReviewTopTasks", {
            tasks: topHeavyTasks.map((task) => task.title || t("workload.untitledTask")).join(", ")
          })
        : t("analytics.weekSummaryFallbackBody"),
      dominantType
        ? t("analytics.weeklyReviewNext", { type: dominantType.label })
        : t("analytics.insightFewData"),
      debt.value > 20
        ? t("analytics.weeklyReviewDebt", { value: debt.value, label: debt.label })
        : t("analytics.debtHealthy")
    ]
  };
}

function renderTopCards(dataset) {
  const cards = [
    {
      label: t("analytics.energyAverage"),
      value: dataset.summary.avgEnergy ? dataset.summary.avgEnergy.toFixed(1) : "—",
      note: dataset.checkins.length
        ? t("analytics.checkinAppears")
        : t("analytics.checkinAppearsLater")
    },
    {
      label: t("analytics.stressAverage"),
      value: dataset.summary.avgStress ? dataset.summary.avgStress.toFixed(1) : "—",
      note: dataset.checkins.length
        ? t("analytics.checkinAppears")
        : t("analytics.checkinAppearsLater")
    },
    {
      label: t("analytics.focusAverage"),
      value: dataset.summary.avgFocus ? dataset.summary.avgFocus.toFixed(1) : "—",
      note: dataset.checkins.length
        ? t("analytics.checkinAppears")
        : t("analytics.checkinAppearsLater")
    },
    {
      label: t("analytics.overloadRisk"),
      value: dataset.summary.overloadRisk.label,
      note: dataset.summary.overloadRisk.note,
      state: dataset.summary.overloadRisk.state
    },
    {
      label: t("pulse.energyDebt"),
      value: String(dataset.summary.debt.value),
      note: dataset.summary.debt.note,
      state: dataset.summary.debt.state
    }
  ];

  topCards.innerHTML = cards.map((card) => `
    <article class="analytics-card analytics-card-state ${card.state ? `is-${card.state}` : ""}">
      <p class="analytics-card-label">${card.label}</p>
      <strong class="analytics-card-value">${card.value}</strong>
      <span class="analytics-card-note">${card.note}</span>
    </article>
  `).join("");
}

function renderStateChart(dataset) {
  if (!dataset.checkins.length) {
    stateChart.innerHTML = emptyState(t("analytics.noState"), t("analytics.goToPulse"), todayPath());
    stateInsight.textContent = t("analytics.stateHint");
    return;
  }

  const series = [
    { key: "energy_level", label: t("analytics.energyLegend"), color: "#5d8f60" },
    { key: "stress_level", label: t("analytics.stressLegend"), color: "#d67b5c" },
    { key: "focus_level", label: t("analytics.focusLegend"), color: "#7a95c9" }
  ];

  stateChart.innerHTML = buildLineChart(dataset.days, series);

  const lateWeekEnergy = average(dataset.days.slice(-Math.min(3, dataset.days.length)).map((day) => Number(day.checkin?.energy_level || 0)));
  const earlyWeekEnergy = average(dataset.days.slice(0, Math.min(3, dataset.days.length)).map((day) => Number(day.checkin?.energy_level || 0)));

  if (lateWeekEnergy && earlyWeekEnergy && lateWeekEnergy < earlyWeekEnergy) {
    stateInsight.textContent = t("analytics.stateInsightDown");
    return;
  }

  if (dataset.summary.avgStress >= 6) {
    stateInsight.textContent = t("analytics.stateInsightStress");
    return;
  }

  stateInsight.textContent = t("analytics.stateInsightStable");
}

function renderLoadChart(dataset) {
  if (!dataset.tasks.length) {
    loadChart.innerHTML = emptyState(t("analytics.noTasks"), t("analytics.goToPlan"), backlogPath());
    loadInsight.textContent = t("analytics.loadHint");
    return;
  }

  const maxLoad = Math.max(...dataset.days.map((day) => day.loadValue), 1);
  loadChart.innerHTML = `
    <div class="analytics-load-bars">
      ${dataset.days.map((day) => `
        <article class="analytics-load-bar-card">
          <div class="analytics-load-bar-top">
            <strong>${Math.round(day.loadValue)}</strong>
            <span>${day.tasks.length} ${pluralizeTasks(day.tasks.length)}</span>
          </div>
          <div class="analytics-load-bar-track">
            <span class="analytics-load-bar-fill" style="height: ${Math.max(8, (day.loadValue / maxLoad) * 100)}%"></span>
          </div>
          <div class="analytics-load-bar-meta">
            <span>${day.label}</span>
          </div>
        </article>
      `).join("")}
    </div>
  `;

  const busiestDay = dataset.days.reduce((best, day) => (day.loadValue > best.loadValue ? day : best), dataset.days[0]);
  loadInsight.textContent = busiestDay?.tasks?.length
    ? t("analytics.busiestDay", {
        weekday: busiestDay.weekday,
        date: busiestDay.label,
        load: Math.round(busiestDay.loadValue)
      })
    : t("analytics.noBusiestDay");
}

function renderDebtTrend(dataset) {
  if (!debtTrend || !debtInsight) {
    return;
  }

  if (!dataset.checkins.length && !dataset.tasks.length) {
    debtTrend.innerHTML = emptyState(t("analytics.weeklyReviewEmpty"), t("analytics.goToPulse"), todayPath());
    debtInsight.textContent = t("analytics.weeklyReviewPrompt");
    return;
  }

  const maxDebt = Math.max(...dataset.days.map((day) => day.debt?.debt || 0), 1);
  debtTrend.innerHTML = `
    <div class="analytics-load-bars">
      ${dataset.days.map((day) => `
        <article class="analytics-load-bar-card">
          <div class="analytics-load-bar-top">
            <strong>${day.debt?.debt || 0}</strong>
            <span>${formatDebtDelta(day.debt?.delta || 0)}</span>
          </div>
          <div class="analytics-load-bar-track">
            <span class="analytics-load-bar-fill" style="height: ${Math.max(8, ((day.debt?.debt || 0) / maxDebt) * 100)}%"></span>
          </div>
          <div class="analytics-load-bar-meta">
            <span>${day.label}</span>
            <small>${cleanDebtLabel(day.debt?.label)}</small>
          </div>
        </article>
      `).join("")}
    </div>
  `;

  debtInsight.textContent = dataset.summary.debt.value > 50
    ? t("analytics.debtHigh")
    : dataset.summary.debt.value > 20
      ? t("analytics.debtWatch")
      : t("analytics.debtHealthy");
}

function cleanDebtLabel(label) {
  if (!label || looksCorruptedText(label)) {
    return t("workload.debtHealthy");
  }
  return label;
}

function renderInsights(dataset) {
  const insights = [];
  const highStressHighLoad = dataset.days.some((day) => day.loadValue >= 141 && Number(day.checkin?.stress_level || 0) >= 7);
  const lowEnergyHeavyCognitive = dataset.days.some((day) => Number(day.checkin?.energy_level || 10) <= 4 && day.tasks.filter((task) => Number(task.cognitive_load || 0) >= 4).length >= 2);
  const bestFocusDay = dataset.days.reduce((best, day) => Number(day.checkin?.focus_level || 0) > Number(best?.checkin?.focus_level || 0) ? day : best, dataset.days[0] || null);
  const highEmotionalType = dataset.taskTypes.find((type) => type.count && (type.emotionalTotal / type.count) >= 4);

  if (highStressHighLoad) {
    insights.push(t("analytics.insightLoadStress"));
  }

  if (lowEnergyHeavyCognitive) {
    insights.push(t("analytics.insightLowEnergyHeavy"));
  }

  if (bestFocusDay?.checkin && bestFocusDay.loadValue > 0 && bestFocusDay.loadValue <= 140) {
    insights.push(t("analytics.insightFocusModerate"));
  }

  if (highEmotionalType) {
    insights.push(t("analytics.insightEmotionType", { type: highEmotionalType.label }));
  }

  if (!insights.length) {
    insights.push(dataset.checkins.length || dataset.tasks.length
      ? t("analytics.insightFewData")
      : t("analytics.insightEmpty"));
  }

  insightsBox.innerHTML = insights.map((item) => `
    <article class="analytics-insight-card">
      <p>${item}</p>
    </article>
  `).join("");
}

function renderTaskTypes(dataset) {
  if (!dataset.tasks.length) {
    taskTypesBox.innerHTML = emptyState(t("analytics.noTasks"), t("analytics.goToPlan"), backlogPath());
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
        <span>${t("analytics.typeAvgCognitive")}: ${safeFixed(type.cognitiveTotal / type.count)}</span>
        <span>${t("analytics.typeAvgEmotional")}: ${safeFixed(type.emotionalTotal / type.count)}</span>
        <span>${t("analytics.typeAvgLoad")}: ${Math.round(type.loadTotal / type.count)}</span>
      </div>
    </article>
  `).join("");

  const dominant = dataset.taskTypes[0];
  const percent = dominant ? Math.round((dominant.count / dataset.tasks.length) * 100) : 0;
  taskTypesInsight.textContent = dominant
    ? t("analytics.typeDominant", { type: dominant.label, percent })
    : "";
}

function renderOverloadTrend(dataset) {
  if (!dataset.checkins.length && !dataset.tasks.length) {
    overloadTrendBox.innerHTML = emptyState(t("analytics.insightEmpty"), t("analytics.goToPulse"), todayPath());
    return;
  }

  overloadTrendBox.innerHTML = `
    <article class="analytics-overload-card analytics-overload-summary">
      <p class="analytics-card-label">${t("analytics.overloadCurrent")}</p>
      <strong class="analytics-card-value">${dataset.summary.overloadRisk.label}</strong>
      <span class="analytics-card-note">${t("analytics.overloadDays", { riskDays: dataset.summary.overloadDays, highDays: dataset.summary.highDays })}</span>
    </article>
    ${dataset.days.map((day) => `
      <article class="analytics-overload-card is-${day.overloadState}">
        <div class="analytics-overload-head">
          <strong>${day.label}</strong>
          <span>${day.weekday}</span>
        </div>
        <div class="analytics-overload-score">${Math.round(day.loadValue)}</div>
        <div class="analytics-overload-badge is-${day.overloadState}">${day.overloadLabel}</div>
      </article>
    `).join("")}
  `;
}

function renderRecommendations(dataset) {
  const recommendations = generateRuleBasedRecommendations(
    currentState(dataset.days[dataset.days.length - 1]?.checkin),
    dataset.days[dataset.days.length - 1]?.tasks || [],
    {
      readiness: dataset.days[dataset.days.length - 1]?.readiness,
      energyDebt: dataset.summary.debt,
      dailyLoad: dataset.days[dataset.days.length - 1]?.loadMeta
    }
  );

  const output = recommendations.length
    ? recommendations
    : [t("analytics.recommendationStable")];

  recommendationsBox.innerHTML = output.map((item) => `
    <article class="analytics-insight-card">
      <p>${item}</p>
    </article>
  `).join("");
}

function getPeriodRange(periodKey) {
  const today = new Date();
  const current = toIsoDate(today);

  if (periodKey === "last_14_days") {
    return { start: shiftIsoDate(current, -13), end: current };
  }

  if (periodKey === "last_30_days") {
    return { start: shiftIsoDate(current, -29), end: current };
  }

  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(today);
  start.setDate(today.getDate() + mondayOffset);

  if (periodKey === "last_week") {
    start.setDate(start.getDate() - 7);
  }

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: toIsoDate(start),
    end: toIsoDate(end)
  };
}

function shiftIsoDate(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
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
  return 2;
}

function mapLegacyTaskType(value) {
  switch (String(value || "").toLowerCase()) {
    case "deep work":
    case "deep_work":
      return "deep_work";
    case "high energy":
    case "communication":
    case "meeting":
      return "communication";
    case "creative":
      return "creative";
    case "learning":
      return "learning";
    case "recovery":
      return "recovery";
    case "low energy":
    case "low_energy":
    case "shallow_work":
    case "admin":
    case "routine":
    default:
      return "routine";
  }
}

function legacyTypeToCognitive(taskType) {
  if (taskType === "deep_work") {
    return 4;
  }
  if (taskType === "creative" || taskType === "learning") {
    return 3;
  }
  if (taskType === "communication") {
    return 3;
  }
  if (taskType === "recovery") {
    return 1;
  }
  return 2;
}

function clampLoad(value) {
  const normalized = Number.parseInt(value, 10);
  if (!Number.isFinite(normalized)) {
    return 3;
  }
  return Math.max(1, Math.min(5, normalized));
}

function overloadRiskLabel(avgEnergy, avgStress) {
  if (avgStress >= 8 && avgEnergy <= 4) {
    return {
      label: t("analytics.overloadRiskHigh"),
      note: t("analytics.overloadRiskHighNote"),
      state: "risk"
    };
  }

  if (avgStress >= 6 || avgEnergy <= 5) {
    return {
      label: t("analytics.overloadRiskMedium"),
      note: t("analytics.overloadRiskMediumNote"),
      state: "high"
    };
  }

  return {
    label: t("analytics.overloadRiskLow"),
    note: t("analytics.overloadRiskLowNote"),
    state: "normal"
  };
}

function looksCorruptedText(value) {
  const text = String(value || "");
  return /[ÐÑ�]/.test(text) || text.includes("РЎ") || text.includes("Ñ") || text.includes("Ð");
}

function formatDate(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

function formatShortDate(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function weekdayLabel(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  return ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"][date.getDay()];
}

function average(values) {
  const filtered = values.filter((value) => Number.isFinite(value) && value > 0);
  if (!filtered.length) {
    return 0;
  }
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function formatMetricValue(value) {
  return value ? value.toFixed(1) : "—";
}

function pluralizeTasks(count) {
  if (count % 10 === 1 && count % 100 !== 11) {
    return "задача";
  }
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return "задачи";
  }
  return "задач";
}

function formatDayList(days) {
  return days.map((day) => `${day.weekday.toLowerCase()}, ${day.label}`).join(" и ");
}

function formatDebtDelta(delta) {
  if (delta > 0) {
    return `+${delta}`;
  }
  if (delta < 0) {
    return String(delta);
  }
  return "0";
}

function safeFixed(value) {
  return Number.isFinite(value) ? value.toFixed(1) : "—";
}

function emptyState(text, ctaLabel, href) {
  return `
    <div class="analytics-empty-state">
      <p>${text}</p>
      <a class="analytics-empty-link" href="${href}">${ctaLabel}</a>
    </div>
  `;
}

function setStatus(message, isError = false) {
  if (!statusBox) {
    return;
  }

  statusBox.textContent = message;
  statusBox.classList.toggle("is-error", Boolean(isError));
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

  const dots = series.map((item) => days.map((day, index) => {
    const value = Number(day.checkin?.[item.key] || 0);
    if (!value) {
      return "";
    }

    return `<circle cx="${padding.left + index * xStep}" cy="${y(value)}" r="4" fill="${item.color}"></circle>`;
  }).join("")).join("");

  return `
    <div class="analytics-legend">
      ${series.map((item) => `
        <div class="analytics-legend-item">
          <span class="analytics-legend-dot" style="background:${item.color}"></span>
          <span>${item.label}</span>
        </div>
      `).join("")}
    </div>
    <svg viewBox="0 0 ${width} ${height}" class="analytics-svg">
      ${gridLines}
      ${paths}
      ${dots}
      ${labels}
    </svg>
  `;
}
