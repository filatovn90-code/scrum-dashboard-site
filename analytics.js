import { requireAuth, signOutCurrentUser } from "./auth-helpers.js";
import { getSupabase } from "./supabase-client.js";
import { aiCoachPath, landingPath, loginPath, todayPath } from "./route-paths.js";
import { getCurrentPlan, isProPlan } from "./pricing-helpers.js";
import { requestWeeklyReview } from "./ai-service.js";

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
    aiAssistantToggle.textContent = "AI Coach";
    aiAssistantToggle.dataset.locked = "false";
    delete aiAssistantToggle.dataset.lockHref;
  }
  await renderAnalytics();
}

function injectAiCoachLink() {
  const nav = document.querySelector(".site-nav");
  if (!nav || nav.querySelector('[href="ai-coach.html"], [href="/ai-coach"]')) {
    return;
  }

  const link = document.createElement("a");
  link.className = "nav-link";
  link.href = aiCoachPath();
  link.textContent = "AI Coach";
  nav.insertBefore(link, nav.children[1] || null);
}

function applyPricingState() {
  injectAiCoachLink();

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
    aiAssistantToggle.textContent = "AI Coach — Pro";
    aiAssistantToggle.dataset.locked = "true";
    delete aiAssistantToggle.dataset.lockHref;
  }
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
  currentDataset = dataset;

  renderWeeklyInsights(dataset);
  renderWeeklyReviewPlaceholder(dataset);
  renderTopCards(dataset);
  renderStateChart(dataset);
  renderLoadChart(dataset);
  renderDebtTrend(dataset);
  renderInsights(dataset);
  renderTaskTypes(dataset);
  renderOverloadTrend(dataset);
  renderRecommendations(dataset);
  setStatus(`${PERIOD_OPTIONS[periodKey]} • ${formatDate(range.start)} - ${formatDate(range.end)}`);
}

function renderLockedProSections() {
  return;
  weeklyInsightsBox.innerHTML = buildLockedMarkup({
    kicker: "Pro insights",
    title: "Главные инсайты недели доступны в Pro",
    copy: "В Free остаются базовые графики и показатели, а смысловые персональные выводы откроются в Pro."
  });

  weeklyReviewButton.disabled = true;
  weeklyReviewButton.textContent = "Weekly Review — Pro";
  weeklyReviewBox.innerHTML = buildLockedMarkup({
    kicker: "Pro review",
    title: "Weekly Review входит в Pro",
    copy: "Текстовый обзор недели с выводами и рекомендациями будет доступен в расширенном тарифе."
  });

  debtTrend.innerHTML = buildLockedMarkup({
    kicker: "Pro metric",
    title: "Energy Debt доступен в Pro",
    copy: "Накопленная энергетическая нагрузка за неделю откроется после подключения Pro."
  });
  debtInsight.textContent = "В Free доступна базовая аналитика задач и состояния за текущую неделю.";

  insightsBox.innerHTML = buildLockedMarkup({
    kicker: "Pro insights",
    title: "Персональные инсайты доступны в Pro",
    copy: "Связи между состоянием, нагрузкой и типами задач будут открыты в расширенной версии."
  });

  overloadTrendBox.innerHTML = buildLockedMarkup({
    kicker: "Pro trend",
    title: "Тренд перегруза доступен в Pro",
    copy: "Подробная оценка перегруза по дням недели откроется в Pro."
  });

  recommendationsBox.innerHTML = buildLockedMarkup({
    kicker: "Pro recommendations",
    title: "Персональные рекомендации доступны в Pro",
    copy: "MindPulse покажет персональные выводы и рекомендации на следующую неделю в расширенном тарифе."
  });
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
    .select("id, planned_date, status, task_type, cognitive_load, emotional_load, energy_required, estimated_minutes, is_focus, completed_at, archived_at, mental_cost, emotional_cost, recovery_minutes, task_intensity")
    .eq("user_id", currentUser.id)
    .gte("planned_date", range.start)
    .lte("planned_date", range.end)
    .is("archived_at", null)
    .order("planned_date", { ascending: true }));

  if (error && String(error.message || "").includes("mental_cost")) {
    ({
      data,
      error
    } = await supabase
      .from("tasks")
      .select("id, planned_date, status, task_type, cognitive_load, emotional_load, energy_required, estimated_minutes, is_focus, completed_at, archived_at")
      .eq("user_id", currentUser.id)
      .gte("planned_date", range.start)
      .lte("planned_date", range.end)
      .is("archived_at", null)
      .order("planned_date", { ascending: true }));
  }

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
  const mentalCost = Number(item?.mentalCost || cognitiveLoad);
  const emotionalCost = Number(item?.emotionalCost || emotionalLoad);
  const taskIntensity = item?.taskIntensity || mapEnergyCostToIntensity(energyCost);
  const recoveryMinutes = Number(item?.recoveryMinutes ?? mapIntensityToRecoveryMinutes(taskIntensity, energyCost));

  return {
    id: item?.id || `backlog-${weekLabel}-${dayIndex}-${itemIndex}`,
    planned_date: plannedDate,
    status,
    task_type: taskType,
    cognitive_load: cognitiveLoad,
    emotional_load: emotionalLoad,
    energy_required: energyRequired,
    estimated_minutes: estimatedMinutes,
    mental_cost: mentalCost,
    emotional_cost: emotionalCost,
    recovery_minutes: recoveryMinutes,
    task_intensity: taskIntensity,
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

function mapEnergyCostToIntensity(cost) {
  if (cost === "L") {
    return "high";
  }
  if (cost === "S") {
    return "low";
  }
  return "medium";
}

function mapIntensityToRecoveryMinutes(taskIntensity = "medium", energyCost = "M") {
  if (taskIntensity === "high" || energyCost === "L") {
    return 30;
  }
  if (taskIntensity === "low" || energyCost === "S") {
    return 5;
  }
  return 15;
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
      energyDebtDelta: 0,
      energyDebtValue: 0,
      energyDebtStatus: "normal",
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
    const mental = Number(task.mental_cost || task.cognitive_load || 0);
    const emotional = Number(task.emotional_cost || task.emotional_load || 0);
    const energyRequired = Number(task.energy_required || 0);
    const minutes = Number(task.estimated_minutes || 0);
    const recovery = Number(task.recovery_minutes || 0);
    const load = mental * 10 + emotional * 8 + energyRequired * 6 + minutes / 10 + recovery / 6;

    day.taskLoad += load;
    day.totalCognitive += mental;
    if ((task.task_type || "") === "Deep Work") {
      day.deepWorkCount += 1;
    }

    const type = task.task_type || "Без типа";
    if (!taskTypes.has(type)) {
      taskTypes.set(type, {
        label: type,
        count: 0,
        mentalTotal: 0,
        emotionalTotal: 0,
        recoveryTotal: 0,
        minutesTotal: 0
      });
    }

    const entry = taskTypes.get(type);
    entry.count += 1;
    entry.mentalTotal += mental;
    entry.emotionalTotal += emotional;
    entry.recoveryTotal += recovery;
    entry.minutesTotal += minutes;
  });

  const days = Array.from(dayMap.values());
  let cumulativeDebt = 0;
  days.forEach((day) => {
    const stress = Number(day.checkin?.stress_level || 0);
    const energy = Number(day.checkin?.energy_level || 0);
    const focus = Number(day.checkin?.focus_level || 0);
    const hasRecoveryTask = day.tasks.some(isRecoveryTask);

    let score = stress * 10 + day.taskLoad / 5;
    if (energy > 0 && energy <= 4) {
      score += 20;
    }
    if (focus > 0 && focus <= 4) {
      score += 10;
    }

    day.overloadScore = Math.round(score);
    day.overloadState = overloadState(day.overloadScore);
    day.energyDebtDelta = calculateEnergyDebtDelta(day.checkin, day.taskLoad, hasRecoveryTask);
    cumulativeDebt = Math.max(0, cumulativeDebt + day.energyDebtDelta);
    day.energyDebtValue = cumulativeDebt;
    day.energyDebtStatus = energyDebtState(cumulativeDebt);
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
  const currentEnergyDebt = days.length ? days[days.length - 1].energyDebtValue : 0;
  const energyDebt = energyDebtMeta(currentEnergyDebt);

  return {
    avgEnergy,
    avgStress,
    avgFocus,
    overloadRisk,
    highLoadDays,
    riskDays,
    energyDebt
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
    },
    {
      label: "Energy Debt",
      value: String(dataset.summary.energyDebt.value),
      note: dataset.summary.energyDebt.note,
      state: dataset.summary.energyDebt.state
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

function renderWeeklyReviewPlaceholder(dataset) {
  if (!weeklyReviewBox) {
    return;
  }

  if (!dataset?.checkins.length && !dataset?.tasks.length) {
    weeklyReviewBox.innerHTML = `
      <p>Пока данных мало для недельного обзора. Сначала добавьте задачи и заполните состояние дня хотя бы несколько раз.</p>
    `;
    return;
  }

  weeklyReviewBox.innerHTML = `
    <p>Нажмите «Сформировать обзор недели», и здесь появится короткий персональный отчет: что получилось, где была перегрузка и что лучше изменить на следующей неделе.</p>
  `;
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

  weeklyReviewBox.innerHTML = "<p>Собираю Weekly Review...</p>";

  const remote = await requestWeeklyReview({
    periodStart: dataset?.range?.start,
    periodEnd: dataset?.range?.end
  }).catch(() => null);

  const review = remote?.review || localReview;
  const sourceLabel = remote?.source === "openai"
    ? "<p><strong>Pro AI</strong></p>"
    : remote?.source === "cache"
      ? "<p><strong>Кэшированный AI Review</strong></p>"
      : "";

  weeklyReviewBox.innerHTML = `${sourceLabel}${review.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}`;
}

function buildWeeklyReview(dataset) {
  if (!dataset || (!dataset.checkins.length && !dataset.tasks.length)) {
    return {
      paragraphs: [
        "Пока обзор недели собрать не из чего: сначала нужны несколько check-in и задачи за выбранный период."
      ]
    };
  }

  const completedTasks = dataset.tasks.filter((task) => task.status === "done" || task.completed_at);
  const incompleteTasks = dataset.tasks.filter((task) => task.status !== "done" && !task.completed_at);
  const heavyDays = dataset.days.filter((day) => day.overloadState === "risk" || day.taskLoad >= 85);
  const highLoadDays = dataset.days.filter((day) => day.overloadState === "high");
  const bestDay = dataset.days.reduce((best, day) => {
    const score = Number(day.checkin?.focus_level || 0) + Number(day.checkin?.energy_level || 0) - Number(day.checkin?.stress_level || 0);
    const bestScore = Number(best?.checkin?.focus_level || 0) + Number(best?.checkin?.energy_level || 0) - Number(best?.checkin?.stress_level || 0);
    return score > bestScore ? day : best;
  }, dataset.days[0] || null);
  const topEnergyTasks = [...dataset.tasks]
    .map((task) => ({
      ...task,
      energyBurden: calculateTaskBurden(task)
    }))
    .sort((left, right) => right.energyBurden - left.energyBurden)
    .slice(0, 3);
  const topTypes = summarizeTopTypes(dataset.taskTypes);
  const debt = dataset.summary.energyDebt;

  const intro = bestDay?.checkin
    ? `На этой неделе лучший рабочий отклик был ${bestDay.weekday.toLowerCase()}, ${bestDay.label}. В среднем период прошел с энергией ${formatMetricValue(dataset.summary.avgEnergy)}, стрессом ${formatMetricValue(dataset.summary.avgStress)} и фокусом ${formatMetricValue(dataset.summary.avgFocus)}.`
    : `На этой неделе обзор строится в основном по задачам: данных о состоянии пока мало, поэтому выводы больше опираются на фактическую нагрузку и структуру работы.`;

  const whatWorked = completedTasks.length
    ? `Что получилось: завершено ${completedTasks.length} ${pluralizeTasks(completedTasks.length)}. Лучше всего работали дни с умеренной нагрузкой, когда список задач был более коротким и понятным, без плотного наслоения тяжелой работы.`
    : `Что получилось: даже если закрытых задач пока немного, уже видно, что устойчивее ощущаются дни с меньшим числом задач и более ясным фокусом.`;

  const overloadText = heavyDays.length || highLoadDays.length
    ? `Что перегружало: самыми тяжелыми выглядели ${formatDayList(heavyDays, highLoadDays)}. В эти дни нагрузка выходила выше комфортного уровня, а риск перегруза становился заметнее. ${debt.value > 20 ? `Energy Debt сейчас находится в зоне ${debt.label}, поэтому перегруз уже успел накопиться.` : `Пока перегруз скорее точечный, но его уже стоит учитывать при планировании.`}`
    : `Что перегружало: явных перегруженных дней почти не видно. Это хороший знак, но все равно лучше не собирать несколько cognitively heavy задач в один и тот же день.`;

  const energyTasksText = topEnergyTasks.length
    ? `Больше всего энергии забирали ${formatTaskSummary(topEnergyTasks)}. По типам сильнее всего нагружали ${topTypes}. Именно такие задачи лучше ставить в более сильные по энергии окна и не складывать подряд без пауз.`
    : `Пока еще мало задач, чтобы точно назвать самые энергозатратные, но уже можно ориентироваться на задачи с высоким Mental Cost, Emotional Cost и длинной оценкой времени.`;

  const nextWeek = buildNextWeekAdvice(dataset, heavyDays, topEnergyTasks, incompleteTasks);

  return {
    paragraphs: [intro, whatWorked, overloadText, energyTasksText, nextWeek]
  };
}

function buildNextWeekAdvice(dataset, heavyDays, topEnergyTasks, incompleteTasks) {
  const deepWorkCount = dataset.tasks.filter((task) => String(task.task_type || "").toLowerCase().includes("deep")).length;
  const lowEnergyDays = dataset.days.filter((day) => Number(day.checkin?.energy_level || 0) > 0 && Number(day.checkin?.energy_level || 0) <= 4).length;

  if (heavyDays.length >= 2 || dataset.summary.energyDebt.value > 50) {
    return "Что лучше изменить на следующей неделе: сократите количество тяжелых задач в один день, оставляйте 1–2 главные задачи вместо плотного списка и заранее закладывайте Recovery или легкие административные слоты после самых напряженных дней.";
  }

  if (deepWorkCount >= 4) {
    return "Что лучше изменить на следующей неделе: распределите Deep Work тоньше по неделе и не ставьте больше двух тяжелых задач в один день. Так будет проще удерживать фокус без провала к концу недели.";
  }

  if (lowEnergyDays >= 2) {
    return "Что лучше изменить на следующей неделе: в дни с низкой энергией переносите акцент на Light Tasks, Admin или Recovery, а самую требовательную работу оставляйте на более сильные окна.";
  }

  if (incompleteTasks.length >= 5) {
    return "Что лучше изменить на следующей неделе: план выглядит чуть шире доступной емкости. Полезно уменьшить дневной объем и оставлять в каждом дне небольшой запас.";
  }

  if (topEnergyTasks.length) {
    return "Что лучше изменить на следующей неделе: самые энергозатратные задачи планируйте на первую половину дня или на дни с более высоким фокусом, а после них оставляйте короткое восстановление.";
  }

  return "Что лучше изменить на следующей неделе: продолжайте собирать check-in и задачи в одном ритме. Через несколько дней рекомендации станут еще точнее и начнут лучше отражать ваш рабочий паттерн.";
}

function calculateTaskBurden(task) {
  const mental = Number(task.mental_cost || task.cognitive_load || 0);
  const emotional = Number(task.emotional_cost || task.emotional_load || 0);
  const energy = Number(task.energy_required || 0);
  const minutes = Number(task.estimated_minutes || 0);
  return mental * 10 + emotional * 8 + energy * 6 + minutes / 10;
}

function summarizeTopTypes(taskTypes) {
  if (!taskTypes.length) {
    return "задачи без явного паттерна";
  }

  return taskTypes
    .slice(0, 2)
    .map((type) => `${type.label} (${type.count})`)
    .join(" и ");
}

function formatTaskSummary(tasks) {
  return tasks
    .map((task) => {
      const label = task.title?.trim() || task.task_type || "задача";
      return `«${label}»`;
    })
    .join(", ");
}

function formatDayList(heavyDays, highLoadDays) {
  const source = heavyDays.length ? heavyDays : highLoadDays;
  return source
    .slice(0, 3)
    .map((day) => `${day.weekday.toLowerCase()} (${day.label})`)
    .join(", ");
}

function formatMetricValue(value) {
  return value ? value.toFixed(1) : "—";
}

function analyzeWeeklyInsights(dataset) {
  if (!dataset.checkins.length && !dataset.tasks.length) {
    return [
      {
        label: "Старт аналитики",
        title: "Данные появятся после первых check-in и задач",
        description: "Сначала заполни состояние дня и поработай с задачами несколько дней подряд.",
        state: ""
      }
    ];
  }

  const insights = [];
  const emotionalDropDay = findEnergyDropAfterEmotionalLoad(dataset.days);
  const deepWorkFocus = findDeepWorkFocusInsight(dataset.days);
  const busiestWeekday = findBusiestWeekday(dataset.days);
  const recoveryInsight = findRecoveryInsight(dataset.tasks, dataset.days);

  if (emotionalDropDay) {
    insights.push({
      label: "Энергия",
      title: "Энергия падала после дней с высоким emotional_cost",
      description: `${emotionalDropDay.from} дал заметно больше эмоциональной нагрузки, а на следующий день энергия просела.`,
      state: "high"
    });
  }

  if (deepWorkFocus) {
    insights.push({
      label: "Deep Work",
      title: "Deep Work лучше проходил в дни с фокусом выше 7",
      description: deepWorkFocus,
      state: "normal"
    });
  }

  if (busiestWeekday) {
    insights.push({
      label: "Перегрузка",
      title: `${busiestWeekday.weekday} выглядит самым перегруженным днем`,
      description: `Средняя нагрузка в этот день недели была ${Math.round(busiestWeekday.avgLoad)}. Это главный кандидат на разгрузку.`,
      state: busiestWeekday.avgLoad >= 85 ? "risk" : "high"
    });
  }

  if (recoveryInsight) {
    insights.push({
      label: "Восстановление",
      title: recoveryInsight.title,
      description: recoveryInsight.description,
      state: recoveryInsight.state
    });
  }

  if (!insights.length) {
    insights.push({
      label: "Наблюдение",
      title: "Пока рано для сильных выводов",
      description: "Данные уже есть, но устойчивых закономерностей ещё мало. Продолжай заполнять состояние и вести задачи.",
      state: ""
    });
  }

  return insights.slice(0, 4);
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

function renderDebtTrend(dataset) {
  if (!debtTrend || !debtInsight) {
    return;
  }

  if (!dataset.checkins.length && !dataset.tasks.length) {
    debtTrend.innerHTML = emptyState("Energy Debt появится после нескольких дней использования трекера.", "Перейти в Сегодня", todayPath());
    debtInsight.textContent = "Сначала нужны check-in и задачи за несколько дней подряд.";
    return;
  }

  const maxDebt = Math.max(...dataset.days.map((day) => day.energyDebtValue), 1);
  debtTrend.innerHTML = `
    <div class="analytics-load-bars">
      ${dataset.days.map((day) => `
        <article class="analytics-load-bar-card">
          <div class="analytics-load-bar-top">
            <strong>${day.energyDebtValue}</strong>
            <span>${formatDebtDelta(day.energyDebtDelta)}</span>
          </div>
          <div class="analytics-load-bar-track">
            <span class="analytics-load-bar-fill" style="height: ${Math.max(8, (day.energyDebtValue / maxDebt) * 100)}%"></span>
          </div>
          <div class="analytics-load-bar-meta">
            <span>${day.label}</span>
            <small>${energyDebtMeta(day.energyDebtValue).label}</small>
          </div>
        </article>
      `).join("")}
    </div>
  `;

  debtInsight.textContent = dataset.summary.energyDebt.value > 50
    ? "Последние дни ты работаешь в энергетический долг. Лучше снизить нагрузку или добавить восстановление."
    : dataset.summary.energyDebt.value > 20
      ? "Нагрузка накапливается. Полезно чередовать тяжёлые задачи с более лёгкими и Recovery-активностями."
      : "Тренд выглядит устойчиво: серьёзного накопления энергетического долга пока не видно.";
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
        <span>Mental Cost: ${safeFixed(type.mentalTotal / type.count)}</span>
        <span>Emotional Cost: ${safeFixed(type.emotionalTotal / type.count)}</span>
        <span>Recovery Time: ${Math.round(type.recoveryTotal)} min</span>
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

function findEnergyDropAfterEmotionalLoad(days) {
  for (let index = 0; index < days.length - 1; index += 1) {
    const current = days[index];
    const next = days[index + 1];
    const currentEmotionalAvg = current.tasks.length
      ? current.tasks.reduce((sum, task) => sum + Number(task.emotional_cost || task.emotional_load || 0), 0) / current.tasks.length
      : 0;
    const currentEnergy = Number(current.checkin?.energy_level || 0);
    const nextEnergy = Number(next.checkin?.energy_level || 0);

    if (currentEmotionalAvg >= 4 && currentEnergy > 0 && nextEnergy > 0 && nextEnergy + 1 < currentEnergy) {
      return {
        from: `${current.weekday}, ${current.label}`
      };
    }
  }

  return null;
}

function findDeepWorkFocusInsight(days) {
  const highFocusDays = days.filter((day) => Number(day.checkin?.focus_level || 0) >= 7 && day.deepWorkCount > 0);
  if (!highFocusDays.length) {
    return "";
  }

  const avgDeepWorkLoad = average(highFocusDays.map((day) => day.taskLoad));
  return `В дни с фокусом 7+ Deep Work появлялся в ${highFocusDays.length} ${pluralizeDays(highFocusDays.length)}, а средняя нагрузка оставалась на уровне ${Math.round(avgDeepWorkLoad)}.`;
}

function findBusiestWeekday(days) {
  const buckets = new Map();

  days.forEach((day) => {
    if (!buckets.has(day.weekday)) {
      buckets.set(day.weekday, { weekday: day.weekday, totalLoad: 0, count: 0 });
    }

    const bucket = buckets.get(day.weekday);
    bucket.totalLoad += day.taskLoad;
    bucket.count += 1;
  });

  const ranked = Array.from(buckets.values())
    .map((item) => ({ ...item, avgLoad: item.count ? item.totalLoad / item.count : 0 }))
    .sort((left, right) => right.avgLoad - left.avgLoad);

  return ranked[0]?.avgLoad > 0 ? ranked[0] : null;
}

function findRecoveryInsight(tasks, days) {
  const recoveryTasks = tasks.filter((task) => isRecoveryTask(task));
  if (!tasks.length) {
    return null;
  }

  if (recoveryTasks.length <= 1) {
    return {
      title: "Recovery задач почти не было",
      description: "За выбранный период восстановление почти не появлялось в плане. Это может усиливать накопление усталости.",
      state: "high"
    };
  }

  const recoveryShare = Math.round((recoveryTasks.length / tasks.length) * 100);
  const overloadedDays = days.filter((day) => day.overloadState === "risk").length;

  return {
    title: "Восстановление пока неравномерное",
    description: `Recovery занимает около ${recoveryShare}% задач. ${overloadedDays ? "На перегруженные дни стоит ставить его чаще." : "Хороший следующий шаг — ставить его рядом с тяжёлыми днями."}`,
    state: recoveryShare < 15 ? "high" : "normal"
  };
}

function calculateEnergyDebtDelta(checkin, taskLoad, hasRecoveryTask) {
  let delta = 0;

  if (Number(checkin?.stress_level || 0) >= 7) {
    delta += 10;
  }
  if (Number(checkin?.energy_level || 10) <= 4) {
    delta += 10;
  }
  if (taskLoad >= 85) {
    delta += 10;
  }
  if (hasRecoveryTask || taskLoad <= 50) {
    delta -= 5;
  }

  return delta;
}

function isRecoveryTask(task) {
  const type = String(task?.task_type || "").toLowerCase();
  const intensity = String(task?.task_intensity || "").toLowerCase();
  const recoveryMinutes = Number(task?.recovery_minutes || 0);

  return type.includes("recovery") || intensity === "low" || recoveryMinutes >= 20;
}

function energyDebtState(value) {
  if (value <= 20) return "normal";
  if (value <= 50) return "high";
  return "risk";
}

function energyDebtMeta(value) {
  if (value <= 20) {
    return {
      value,
      label: "Healthy",
      state: "normal",
      note: "Накопленной перегрузки почти нет."
    };
  }

  if (value <= 50) {
    return {
      value,
      label: "Watch",
      state: "high",
      note: "Нагрузка накапливается и требует внимания."
    };
  }

  return {
    value,
    label: "Overloaded",
    state: "risk",
    note: "Последние дни ты работаешь в энергетический долг. Лучше снизить нагрузку или добавить восстановление."
  };
}

function formatDebtDelta(value) {
  if (value > 0) return `+${value} за день`;
  if (value < 0) return `${value} за день`;
  return "без изменений";
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

function pluralizeDays(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
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
