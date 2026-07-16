import { requireAuth, signOutCurrentUser } from "./auth-helpers.js";
import { getCurrentProfile, getSupabase } from "./supabase-client.js";
import { aiCoachPath, landingPath, loginPath } from "./route-paths.js";
import {
  calculateDailyLoad,
  calculateDailyLoadLevel,
  calculateEnergyDebtSeries,
  calculateReadinessScore,
  calculateRecommendedRecovery,
  currentState,
  describeTaskLoad,
  generateRuleBasedRecommendations,
  getTaskTypeLabel,
  listDates,
  normalizeTask,
  shiftIsoDate,
  summarizeEnergyDebt,
  toIsoDate
} from "./lib/workload.js";

const today = new Date();
const todayIso = toIsoDate(today);
const todayShort = `${String(today.getDate()).padStart(2, "0")}.${String(today.getMonth() + 1).padStart(2, "0")}`;
const recentStartIso = shiftIsoDate(todayIso, -6);
const currentYear = today.getFullYear();

const sessionBadge = document.getElementById("todaySessionBadge");
const pageStatus = document.getElementById("todayPageStatus");
const logoutButton = document.getElementById("todayLogoutButton");

const summaryGreeting = document.getElementById("todaySummaryGreeting");
const summaryIntro = document.getElementById("todaySummaryIntro");
const readinessScore = document.getElementById("todayReadinessScore");
const dayStatus = document.getElementById("todayDayStatus");
const dayStatusNote = document.getElementById("todayDayStatusNote");
const dayWarning = document.getElementById("todayDayWarning");
const recommendationsList = document.getElementById("todayRecommendationsList");
const topTasksBox = document.getElementById("todayTopTasks");

const checkinForm = document.getElementById("todayCheckinForm");
const checkinStatus = document.getElementById("todayCheckinStatus");
const energyInput = document.getElementById("todayEnergyInput");
const stressInput = document.getElementById("todayStressInput");
const focusInput = document.getElementById("todayFocusInput");
const energyValue = document.getElementById("todayEnergyValue");
const stressValue = document.getElementById("todayStressValue");
const focusValue = document.getElementById("todayFocusValue");
const sleepSelect = document.getElementById("todaySleepSelect");
const moodSelect = document.getElementById("todayMoodSelect");

const capacityPercent = document.getElementById("todayCapacityPercent");
const capacityLabel = document.getElementById("todayCapacityLabel");
const capacityBar = document.getElementById("todayCapacityBar");
const capacityNote = document.getElementById("todayCapacityNote");
const energyDebtValue = document.getElementById("todayEnergyDebtValue");
const energyDebtStatus = document.getElementById("todayEnergyDebtStatus");
const energyDebtNote = document.getElementById("todayEnergyDebtNote");
const capacityMode = document.getElementById("todayCapacityMode");
const energyMapGrid = document.getElementById("todayEnergyMapGrid");
const energyMapWarning = document.getElementById("todayEnergyMapWarning");

const taskCreateForm = document.getElementById("todayTaskCreateForm");
const taskCreateStatus = document.getElementById("todayTaskCreateStatus");
const taskTitleInput = document.getElementById("todayTaskTitleInput");
const taskTypeInput = document.getElementById("todayTaskTypeInput");
const taskMentalCostInput = document.getElementById("todayTaskMentalCostInput");
const taskEmotionalCostInput = document.getElementById("todayTaskEmotionalCostInput");

const guardModal = document.getElementById("todayGuardModal");
const guardBackdrop = document.getElementById("todayGuardBackdrop");
const guardMessage = document.getElementById("todayGuardMessage");
const guardReasons = document.getElementById("todayGuardReasons");
const guardConfirmButton = document.getElementById("todayGuardConfirmButton");
const guardMoveButton = document.getElementById("todayGuardMoveButton");
const guardCancelButton = document.getElementById("todayGuardCancelButton");

let supabase;
let currentUser;
let currentProfile;
let todayCheckin = null;
let todayTasks = [];
let recentCheckins = [];
let recentTasks = [];
let pendingGuardDraft = null;

bootstrap();
bindEvents();

function bindEvents() {
  logoutButton?.addEventListener("click", async () => {
    await signOutCurrentUser().catch(() => null);
    window.location.replace(landingPath());
  });

  checkinForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveTodayCheckin();
  });

  taskCreateForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleTaskCreateSubmit();
  });

  [energyInput, stressInput, focusInput].forEach((input) => {
    input?.addEventListener("input", () => {
      syncRangeOutputs();
      renderTodayView();
    });
  });

  sleepSelect?.addEventListener("change", renderTodayView);
  moodSelect?.addEventListener("change", renderTodayView);

  guardConfirmButton?.addEventListener("click", async () => {
    if (!pendingGuardDraft) return;
    await finalizeTaskCreate(pendingGuardDraft, todayIso, "Задача добавлена на сегодня.");
  });

  guardMoveButton?.addEventListener("click", async () => {
    if (!pendingGuardDraft) return;
    await finalizeTaskCreate(pendingGuardDraft, shiftIsoDate(todayIso, 1), "Задача перенесена на завтра.");
  });

  guardCancelButton?.addEventListener("click", closeGuardModal);
  guardBackdrop?.addEventListener("click", closeGuardModal);
}

async function bootstrap() {
  currentUser = await requireAuth({ redirectTo: loginPath() });
  if (!currentUser) {
    return;
  }

  supabase = await getSupabase();
  currentProfile = await getCurrentProfile().catch(() => null);
  sessionBadge.textContent = currentProfile?.full_name || currentUser.email || "Пользователь";
  syncRangeOutputs();
  injectAiCoachLink();

  try {
    await Promise.all([
      loadTodayCheckin(),
      loadTodayTasks(),
      loadRecentCheckins(),
      loadRecentTasks()
    ]);
    fillCheckinForm();
    renderTodayView();
    setPageStatus("");
  } catch (error) {
    showPageError(error?.message || "Не удалось открыть экран Сегодня.");
  }
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
  nav.insertBefore(link, nav.children[4] || null);
}

async function loadTodayCheckin() {
  setPageStatus("Загружаю экран Сегодня...");

  const { data, error } = await supabase
    .from("daily_checkins")
    .select("id, checkin_date, energy_level, stress_level, focus_level, sleep_quality, mood, updated_at")
    .eq("user_id", currentUser.id)
    .eq("checkin_date", todayIso)
    .maybeSingle();

  if (error) {
    throw withMigrationHint(error, "daily_checkins");
  }

  todayCheckin = data || null;
}

async function loadTodayTasks() {
  const supabaseTasks = await queryTasks({
    startIso: todayIso,
    endIso: todayIso,
    limit: 80
  });
  const backlogTasks = loadBacklogTasksForRange(todayIso, todayIso);
  todayTasks = mergeTasks(supabaseTasks, backlogTasks);
}

async function loadRecentCheckins() {
  const { data, error } = await supabase
    .from("daily_checkins")
    .select("checkin_date, energy_level, stress_level, focus_level, sleep_quality, mood")
    .eq("user_id", currentUser.id)
    .gte("checkin_date", recentStartIso)
    .lte("checkin_date", todayIso)
    .order("checkin_date", { ascending: true });

  if (error) {
    throw withMigrationHint(error, "daily_checkins");
  }

  recentCheckins = Array.isArray(data) ? data : [];
}

async function loadRecentTasks() {
  const supabaseTasks = await queryTasks({
    startIso: recentStartIso,
    endIso: todayIso,
    limit: 200
  });
  const backlogTasks = loadBacklogTasksForRange(recentStartIso, todayIso);
  recentTasks = mergeTasks(supabaseTasks, backlogTasks);
}

async function queryTasks({ startIso, endIso, limit = 80 }) {
  let response = await supabase
    .from("tasks")
    .select("id, title, details, status, planned_date, task_type, cognitive_load, emotional_load, is_focus, completed_at, archived_at, updated_at, project_id")
    .eq("user_id", currentUser.id)
    .gte("planned_date", startIso)
    .lte("planned_date", endIso)
    .is("archived_at", null)
    .order("planned_date", { ascending: true })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (response.error && shouldFallbackTasks(response.error)) {
    response = await supabase
      .from("tasks")
      .select("id, title, details, status, planned_date, task_type, cognitive_load, emotional_load, is_focus, completed_at, updated_at, project_id")
      .eq("user_id", currentUser.id)
      .gte("planned_date", startIso)
      .lte("planned_date", endIso)
      .order("planned_date", { ascending: true })
      .order("updated_at", { ascending: false })
      .limit(limit);
  }

  if (response.error) {
    throw response.error;
  }

  return Array.isArray(response.data)
    ? response.data.map((task) => normalizeTask(task))
    : [];
}

function fillCheckinForm() {
  energyInput.value = String(todayCheckin?.energy_level || 6);
  stressInput.value = String(todayCheckin?.stress_level || 4);
  focusInput.value = String(todayCheckin?.focus_level || 6);
  sleepSelect.value = todayCheckin?.sleep_quality || "";
  moodSelect.value = todayCheckin?.mood || "";
  syncRangeOutputs();
  setCheckinStatus(
    todayCheckin
      ? "Данные за сегодня загружены."
      : "Заполни состояние дня, чтобы рекомендации стали точнее."
  );
}

function syncRangeOutputs() {
  energyValue.textContent = energyInput?.value || "6";
  stressValue.textContent = stressInput?.value || "4";
  focusValue.textContent = focusInput?.value || "6";
}

async function saveTodayCheckin() {
  setCheckinStatus("Сохраняю состояние...");

  const payload = {
    user_id: currentUser.id,
    checkin_date: todayIso,
    energy_level: Number(energyInput.value),
    stress_level: Number(stressInput.value),
    focus_level: Number(focusInput.value),
    sleep_quality: sleepSelect.value || null,
    mood: moodSelect.value || null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("daily_checkins")
    .upsert(payload, { onConflict: "user_id,checkin_date" });

  if (error) {
    setCheckinStatus(withMigrationHint(error, "daily_checkins").message, true);
    return;
  }

  todayCheckin = { ...(todayCheckin || {}), ...payload };
  recentCheckins = upsertRecentCheckin(recentCheckins, todayCheckin);
  setCheckinStatus("Состояние сохранено.");
  renderTodayView();
}

function renderTodayView() {
  const summary = buildTodaySummary();
  renderDailySummary(summary);
  renderCapacity(summary.readiness, summary.energyDebt);
  renderEnergyMap(summary.energyMap);
}

function buildTodaySummary() {
  const checkinState = buildCheckinFromForm();
  const activeTasks = todayTasks.filter((task) => !isDone(task));
  const topTasks = rankTasksForToday(activeTasks).slice(0, 3);
  const debtSeries = calculateEnergyDebtSeries(recentCheckins, recentTasks);
  const energyDebt = summarizeEnergyDebt(debtSeries);
  const readiness = calculateReadinessScore(checkinState, activeTasks, energyDebt);
  const recommendations = buildSummaryRecommendations(checkinState, activeTasks, readiness, energyDebt);
  const loadLevel = calculateDailyLoadLevel(activeTasks);

  return {
    greeting: buildGreeting(),
    intro: buildIntro(activeTasks, readiness),
    topTasks,
    warning: readiness.state === "risk" || loadLevel.key === "overload" || energyDebt.state === "overloaded",
    statusNote: buildStatusNote(readiness, energyDebt),
    recommendations,
    readiness,
    energyDebt,
    energyMap: buildEnergyMap(checkinState, activeTasks, readiness, energyDebt)
  };
}

function buildCheckinFromForm() {
  return {
    checkin_date: todayIso,
    energy_level: Number(energyInput?.value || todayCheckin?.energy_level || 6),
    stress_level: Number(stressInput?.value || todayCheckin?.stress_level || 4),
    focus_level: Number(focusInput?.value || todayCheckin?.focus_level || 6),
    sleep_quality: sleepSelect?.value || todayCheckin?.sleep_quality || "",
    mood: moodSelect?.value || todayCheckin?.mood || ""
  };
}

function buildIntro(tasks, readiness) {
  if (!todayCheckin && !tasks.length) {
    return "Заполни состояние дня и выбери несколько задач, чтобы собрать реалистичный план без перегруза.";
  }

  if (!tasks.length) {
    return "Состояние дня уже понятно. Теперь можно добавить 1–3 задачи и не перегружать себя лишним.";
  }

  return `На сегодня в плане ${tasks.length} ${pluralizeTasks(tasks.length)}. День сейчас выглядит как ${statusTitle(readiness.state).toLowerCase()}.`;
}

function buildStatusNote(readiness, energyDebt) {
  const loadLabel = readiness.dailyLoadLevel.label.toLowerCase();
  const parts = [`Нагрузка дня: ${loadLabel}.`, readiness.note];

  if (energyDebt.value > 20) {
    parts.push(`Energy Debt: ${energyDebt.label.toLowerCase()}.`);
  }

  return parts.join(" ");
}

function buildSummaryRecommendations(checkin, tasks, readiness, energyDebt) {
  const items = generateRuleBasedRecommendations(checkin, tasks, {
    readiness,
    energyDebt
  });

  if (readiness.dailyLoad.hasDeepWorkRisk) {
    items.unshift("Сегодня уже много задач Deep Work. Еще одну тяжелую задачу лучше перенести.");
  }

  if (readiness.dailyLoad.hasCommunicationRisk) {
    items.unshift("В плане много эмоционально сложной коммуникации. Оставь между такими задачами время на переключение.");
  }

  if (!tasks.length) {
    items.unshift("На сегодня задач пока нет. Начни с одной важной задачи и не перегружай день заранее.");
  }

  return dedupe(items).slice(0, 3);
}

function buildEnergyMap(checkin, tasks, readiness, energyDebt) {
  const state = currentState(checkin);
  const load = calculateDailyLoad(tasks);
  const heavyCommunication = load.heavyCommunicationCount >= 2;

  const slots = [
    {
      label: "Morning",
      recommendation:
        state.energy >= 7 && state.stress <= 5 && readiness.mode === "Deep Work"
          ? "Deep Work"
          : state.energy <= 4
            ? "Light Tasks"
            : "Admin",
      note:
        state.energy >= 7 && state.stress <= 5
          ? "Утро подходит для самой важной умственной задачи."
          : state.energy <= 4
            ? "Лучше начать мягко, без тяжелого разгона."
            : "Спокойный старт поможет удержать ритм."
    },
    {
      label: "Midday",
      recommendation:
        heavyCommunication || state.stress >= 7
          ? "Meetings"
          : readiness.dailyLoadLevel.key === "balanced"
            ? "Admin"
            : "Light Tasks",
      note:
        heavyCommunication
          ? "Коммуникацию лучше собрать в один понятный блок."
          : "Середина дня хороша для встреч, согласований и рутинных шагов."
    },
    {
      label: "Afternoon",
      recommendation:
        readiness.dailyLoadLevel.key === "overload"
          ? "Recovery"
          : state.focus >= 7 && state.energy >= 6
            ? "Deep Work"
            : "Admin",
      note:
        readiness.dailyLoadLevel.key === "overload"
          ? "Во второй половине дня лучше не усиливать и без того тяжелый план."
          : "Оставь здесь либо второй рабочий блок, либо понятные операционные задачи."
    },
    {
      label: "Evening",
      recommendation:
        energyDebt.value >= 50 || state.energy <= 4
          ? "Recovery"
          : "Light Tasks",
      note:
        energyDebt.value >= 50
          ? "Последние дни уже были тяжелыми, поэтому вечер лучше посвятить восстановлению."
          : "Финал дня лучше оставить для коротких и простых дел."
    }
  ];

  let warning = "";
  if (readiness.dailyLoadLevel.key === "overload") {
    warning = "План дня уже выглядит перегруженным. Лучше не добавлять новые тяжелые задачи.";
  } else if (energyDebt.state === "overloaded") {
    warning = "Последние дни складываются в энергетический долг. Сегодня стоит беречь ресурс.";
  } else if (state.stress >= 8) {
    warning = "Стресс высокий — сегодня лучше не ставить несколько сложных задач подряд.";
  }

  return { slots, warning };
}

function renderDailySummary(summary) {
  summaryGreeting.textContent = summary.greeting;
  summaryIntro.textContent = summary.intro;
  readinessScore.textContent = String(summary.readiness.score);
  dayStatus.textContent = statusTitle(summary.readiness.state);
  dayStatus.dataset.state = summary.readiness.state;
  dayStatusNote.textContent = summary.statusNote;
  dayWarning.hidden = !summary.warning;
  dayWarning.textContent = summary.warning ? "Есть риск перегруза" : "";

  recommendationsList.innerHTML = summary.recommendations
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  if (!summary.topTasks.length) {
    topTasksBox.innerHTML = `<p class="today-summary-empty">Пока нет задач на сегодня.</p>`;
    return;
  }

  topTasksBox.innerHTML = summary.topTasks.map((task) => {
    const details = describeTaskLoad(task);
    return `
      <article class="today-top-task-card">
        <strong>${escapeHtml(task.title)}</strong>
        <div class="today-top-task-meta">
          <span>${escapeHtml(`${details.typeIcon} ${details.typeLabel}`)}</span>
          <span>Когнитивная: ${details.cognitiveLabel}</span>
          <span>Эмоциональная: ${details.emotionalLabel}</span>
          <span>Нагрузка: ${details.intensityLabel}</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderCapacity(readiness, energyDebt) {
  capacityPercent.textContent = String(readiness.score);
  capacityLabel.textContent = statusTitle(readiness.state);
  capacityLabel.dataset.state = readiness.state;
  capacityBar.style.width = `${Math.min(readiness.score, 100)}%`;
  capacityBar.dataset.state = readiness.state;
  capacityNote.textContent = readiness.note;
  capacityMode.textContent = readiness.mode;

  energyDebtValue.textContent = String(energyDebt.value);
  energyDebtStatus.textContent = energyDebt.label;
  energyDebtStatus.dataset.state = energyDebt.state;
  energyDebtNote.textContent = energyDebt.note;
}

function renderEnergyMap(energyMap) {
  energyMapGrid.innerHTML = energyMap.slots.map((slot) => `
    <article class="today-energy-slot-card">
      <span class="today-summary-label">${escapeHtml(slot.label)}</span>
      <strong>${escapeHtml(slot.recommendation)}</strong>
      <p>${escapeHtml(slot.note)}</p>
    </article>
  `).join("");

  energyMapWarning.hidden = !energyMap.warning;
  energyMapWarning.textContent = energyMap.warning || "";
  energyMapWarning.classList.toggle("is-error", Boolean(energyMap.warning));
}

async function handleTaskCreateSubmit() {
  const draft = buildDraftTask();
  if (!draft) {
    setTaskCreateStatus("Добавь название задачи.", true);
    return;
  }

  const guard = evaluateOverloadGuard(draft);
  if (guard.shouldWarn) {
    pendingGuardDraft = draft;
    openGuardModal(guard);
    return;
  }

  await finalizeTaskCreate(draft, todayIso, "Задача добавлена на сегодня.");
}

function buildDraftTask() {
  const title = String(taskTitleInput?.value || "").trim();
  if (!title) {
    return null;
  }

  return normalizeTask({
    id: `draft-${Date.now()}`,
    title,
    details: "",
    status: "todo",
    planned_date: todayIso,
    task_type: taskTypeInput?.value || "routine",
    cognitive_load: Number(taskMentalCostInput?.value || 3),
    emotional_load: Number(taskEmotionalCostInput?.value || 2),
    is_focus: false,
    completed_at: null
  });
}

function evaluateOverloadGuard(draftTask) {
  const currentReadiness = calculateReadinessScore(buildCheckinFromForm(), todayTasks.filter((task) => !isDone(task)), summarizeEnergyDebt(calculateEnergyDebtSeries(recentCheckins, recentTasks)));
  const projectedTasks = [...todayTasks.filter((task) => !isDone(task)), draftTask];
  const projectedDaily = calculateDailyLoad(projectedTasks);
  const projectedDebt = summarizeEnergyDebt(
    calculateEnergyDebtSeries(recentCheckins, mergeTasks(recentTasks, [draftTask]))
  );
  const projectedReadiness = calculateReadinessScore(buildCheckinFromForm(), projectedTasks, projectedDebt);
  const reasons = [];

  if (projectedDaily.deepWorkCount >= 3) {
    reasons.push("Сегодня уже будет три задачи Deep Work.");
  }

  if (projectedDaily.heavyCommunicationCount >= 3) {
    reasons.push("На сегодня уже собирается несколько эмоционально тяжелых коммуникаций.");
  }

  if (draftTask.cognitive_load >= 4) {
    reasons.push("У новой задачи высокая когнитивная нагрузка.");
  }

  if (projectedReadiness.score <= 39) {
    reasons.push("Readiness Score упадет до тяжелого уровня.");
  }

  if (projectedDebt.value > summarizeEnergyDebt(calculateEnergyDebtSeries(recentCheckins, recentTasks)).value) {
    reasons.push("Energy Debt вырастет еще сильнее.");
  }

  if (projectedReadiness.score <= currentReadiness.score - 15) {
    reasons.push("Эта задача заметно снизит готовность дня.");
  }

  if (projectedReadiness.dailyLoadLevel.key === "high" || projectedReadiness.dailyLoadLevel.key === "overload") {
    reasons.push("После добавления дневная нагрузка станет слишком высокой.");
  }

  return {
    shouldWarn: reasons.length > 0,
    projectedReadiness,
    projectedDebt,
    reasons: dedupe(reasons)
  };
}

function openGuardModal(guard) {
  guardModal.hidden = false;
  guardMessage.textContent = "Похоже, день станет перегруженным. Лучше перенести эту задачу?";
  guardReasons.innerHTML = guard.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("");
}

function closeGuardModal() {
  pendingGuardDraft = null;
  guardModal.hidden = true;
  guardReasons.innerHTML = "";
}

async function finalizeTaskCreate(draft, plannedDate, successMessage) {
  closeGuardModal();
  setTaskCreateStatus("Сохраняю задачу...");

  const payload = buildTaskInsertPayload(draft, plannedDate);
  let response = await supabase
    .from("tasks")
    .insert(payload)
    .select("id, title, details, status, planned_date, task_type, cognitive_load, emotional_load, is_focus, completed_at, archived_at, project_id")
    .single();

  if (response.error && shouldFallbackTasks(response.error)) {
    response = await supabase
      .from("tasks")
      .insert({
        user_id: currentUser.id,
        title: draft.title,
        details: draft.details,
        status: "todo",
        planned_date: plannedDate,
        task_type: draft.task_type,
        cognitive_load: draft.cognitive_load,
        emotional_load: draft.emotional_load,
        is_focus: false
      })
      .select("id, title, details, status, planned_date, task_type, cognitive_load, emotional_load, is_focus, completed_at, archived_at, project_id")
      .single();
  }

  if (response.error) {
    setTaskCreateStatus(humanizeTaskInsertError(response.error), true);
    return;
  }

  const insertedTask = normalizeTask(response.data || { ...draft, planned_date: plannedDate });
  if (plannedDate === todayIso) {
    todayTasks = mergeTasks(todayTasks, [insertedTask]);
  }
  recentTasks = mergeTasks(recentTasks, [insertedTask]);
  resetTaskCreateForm();
  setTaskCreateStatus(successMessage);
  renderTodayView();
}

function buildTaskInsertPayload(draft, plannedDate) {
  return {
    user_id: currentUser.id,
    title: draft.title,
    details: draft.details || "",
    status: "todo",
    planned_date: plannedDate,
    task_type: draft.task_type,
    cognitive_load: draft.cognitive_load,
    emotional_load: draft.emotional_load,
    is_focus: false
  };
}

function humanizeTaskInsertError(error) {
  const message = String(error?.message || "");

  if (message.includes("project_id")) {
    return "В базе задач еще требуется project_id. Сначала нужно обновить SQL-структуру задач или добавить проект по умолчанию.";
  }

  return message || "Не удалось сохранить задачу.";
}

function resetTaskCreateForm() {
  taskCreateForm?.reset();
  if (taskTypeInput) taskTypeInput.value = "routine";
  if (taskMentalCostInput) taskMentalCostInput.value = "3";
  if (taskEmotionalCostInput) taskEmotionalCostInput.value = "2";
}

function loadBacklogTasksForRange(startIso, endIso) {
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
      return backlogToRangeTasks(parsed, startIso, endIso);
    } catch {
      return [];
    }
  }

  return [];
}

function backlogToRangeTasks(backlogData, startIso, endIso) {
  if (!backlogData || typeof backlogData !== "object") {
    return [];
  }

  const tasks = [];

  Object.values(backlogData).forEach((week) => {
    const days = Array.isArray(week?.days) ? week.days : [];
    days.forEach((day) => {
      const plannedDate = backlogDateToIso(day?.date);
      if (!plannedDate || plannedDate < startIso || plannedDate > endIso) {
        return;
      }

      const items = Array.isArray(day?.items) ? day.items : [];
      items.forEach((item, index) => {
        tasks.push(normalizeTask({
          id: item?.id || `backlog-${plannedDate}-${index}`,
          title: item?.text || "Без названия",
          details: "",
          status: mapBacklogStatus(item?.status),
          planned_date: plannedDate,
          task_type: mapLegacyBacklogTaskType(item?.taskType),
          cognitive_load: Number(item?.cognitiveLoad || item?.mentalCost || mapLegacyCognitiveLoad(item)),
          emotional_load: Number(item?.emotionalLoad || item?.emotionalCost || mapLegacyEmotionalLoad(item)),
          completed_at: mapBacklogStatus(item?.status) === "done" ? `${plannedDate}T18:00:00.000Z` : null,
          source: "backlog"
        }));
      });
    });
  });

  return tasks;
}

function mapLegacyBacklogTaskType(value) {
  const type = String(value || "").toLowerCase();
  if (type.includes("deep")) return "deep_work";
  if (type.includes("meeting") || type.includes("комму") || type.includes("commun")) return "communication";
  if (type.includes("creative") || type.includes("твор")) return "creative";
  if (type.includes("learn") || type.includes("обуч")) return "learning";
  if (type.includes("recover") || type.includes("восст")) return "recovery";
  return "routine";
}

function mapLegacyCognitiveLoad(item) {
  const energyCost = String(item?.energyCost || "M").toUpperCase();
  if (energyCost === "L") return 4;
  if (energyCost === "S") return 2;
  return 3;
}

function mapLegacyEmotionalLoad(item) {
  const stress = String(item?.stress || "").toLowerCase();
  if (stress.includes("выс")) return 5;
  if (stress.includes("сред")) return 3;
  if (stress.includes("низ")) return 2;
  return 2;
}

function backlogDateToIso(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const [day, month] = value.split(".");
  if (!day || !month) {
    return null;
  }

  return `${currentYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function mapBacklogStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("сдел") || value.includes("done")) return "done";
  if (value.includes("работ") || value.includes("progress")) return "in_progress";
  return "todo";
}

function rankTasksForToday(tasks) {
  return tasks
    .map((task) => ({
      ...task,
      rankWeight:
        (task.is_focus ? 1000 : 0)
        + (task.cognitive_load * 20)
        + (task.emotional_load * 15)
        + (task.task_load || 0)
    }))
    .sort((left, right) => right.rankWeight - left.rankWeight);
}

function mergeTasks(...groups) {
  const merged = new Map();

  groups.flat().forEach((task) => {
    const normalized = normalizeTask(task);
    const key = String(normalized.id || `${normalized.title}-${normalized.planned_date || "today"}`);
    merged.set(key, normalized);
  });

  return Array.from(merged.values());
}

function upsertRecentCheckin(items, checkin) {
  const map = new Map((items || []).map((item) => [item.checkin_date, item]));
  map.set(checkin.checkin_date, checkin);
  return Array.from(map.values()).sort((left, right) => String(left.checkin_date).localeCompare(String(right.checkin_date)));
}

function statusTitle(state) {
  if (state === "excellent") return "Excellent Day";
  if (state === "stable") return "Stable";
  if (state === "heavy") return "Heavy";
  return "Recovery Needed";
}

function buildGreeting() {
  const hour = new Date().getHours();
  const name = currentProfile?.full_name?.trim() || "";
  const suffix = name ? `, ${name}` : "";

  if (hour < 12) return `Доброе утро${suffix}`;
  if (hour < 18) return `Добрый день${suffix}`;
  return `Добрый вечер${suffix}`;
}

function shouldFallbackTasks(error) {
  const message = String(error?.message || "").toLowerCase();
  return ["archived_at", "updated_at"].some((field) => message.includes(field));
}

function isDone(task) {
  return task.status === "done" || Boolean(task.completed_at);
}

function dedupe(items) {
  return Array.from(new Set((items || []).filter(Boolean)));
}

function pluralizeTasks(count) {
  if (count % 10 === 1 && count % 100 !== 11) return "задача";
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return "задачи";
  return "задач";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function withMigrationHint(error, tableName) {
  const message = String(error?.message || "");

  if (message.includes("Could not find the table 'public.daily_checkins'")) {
    return new Error(`В Supabase пока нет таблицы ${tableName}. Сначала выполни SQL-миграции из папки supabase.`);
  }

  if (message.includes("sleep_quality") || message.includes("mood")) {
    return new Error(`Для экрана Сегодня нужно обновить структуру таблицы ${tableName} в Supabase.`);
  }

  return error instanceof Error ? error : new Error(message || "Неизвестная ошибка.");
}

function showPageError(message) {
  setPageStatus(message, true);
  sessionBadge.textContent = "Ошибка";
}

function setPageStatus(message, isError = false) {
  if (!message) {
    pageStatus.hidden = true;
    pageStatus.textContent = "";
    pageStatus.classList.remove("is-error");
    return;
  }

  pageStatus.hidden = false;
  pageStatus.textContent = message;
  pageStatus.classList.toggle("is-error", isError);
}

function setCheckinStatus(message, isError = false) {
  checkinStatus.textContent = message;
  checkinStatus.classList.toggle("is-error", isError);
}

function setTaskCreateStatus(message, isError = false) {
  if (!taskCreateStatus) {
    return;
  }

  taskCreateStatus.textContent = message;
  taskCreateStatus.classList.toggle("is-error", isError);
}
