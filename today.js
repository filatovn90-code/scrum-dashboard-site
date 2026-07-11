import { requireAuth, signOutCurrentUser } from "./auth-helpers.js";
import { getCurrentProfile, getSupabase } from "./supabase-client.js";
import { aiCoachPath, landingPath, loginPath } from "./route-paths.js";

const today = new Date();
const todayIso = today.toISOString().slice(0, 10);
const todayShort = `${String(today.getDate()).padStart(2, "0")}.${String(today.getMonth() + 1).padStart(2, "0")}`;
const recentStartIso = shiftIsoDate(todayIso, -6);

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
const energyDebtCard = document.querySelector(".today-energy-debt-card");
const capacityMode = document.getElementById("todayCapacityMode");
const energyMapGrid = document.getElementById("todayEnergyMapGrid");
const energyMapWarning = document.getElementById("todayEnergyMapWarning");
const taskCreateForm = document.getElementById("todayTaskCreateForm");
const taskCreateStatus = document.getElementById("todayTaskCreateStatus");
const taskTitleInput = document.getElementById("todayTaskTitleInput");
const taskTypeInput = document.getElementById("todayTaskTypeInput");
const taskMentalCostInput = document.getElementById("todayTaskMentalCostInput");
const taskEmotionalCostInput = document.getElementById("todayTaskEmotionalCostInput");
const taskMinutesInput = document.getElementById("todayTaskMinutesInput");
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

[energyInput, stressInput, focusInput].forEach((input) => {
  input?.addEventListener("input", () => {
    syncRangeOutputs();
    renderTodayView();
  });
});

sleepSelect?.addEventListener("change", renderTodayView);
moodSelect?.addEventListener("change", renderTodayView);

async function bootstrap() {
  currentUser = await requireAuth({ redirectTo: loginPath() });
  if (!currentUser) {
    return;
  }

  supabase = await getSupabase();
  injectAiCoachLink();
  currentProfile = await getCurrentProfile().catch(() => null);
  sessionBadge.textContent = currentProfile?.full_name || currentUser.email || "Пользователь";
  syncRangeOutputs();

  try {
    await Promise.all([loadTodayCheckin(), loadTodayTasks(), loadRecentCheckins(), loadRecentTasks()]);
    fillCheckinForm();
    renderTodayView();
    setPageStatus("");
  } catch (error) {
    showPageError(error.message || "Не удалось открыть экран Сегодня.");
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
  nav.insertBefore(link, nav.children[1] || null);
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
  let data;
  let error;

  ({
    data,
    error
  } = await supabase
    .from("tasks")
    .select("id, title, details, status, planned_date, task_type, cognitive_load, emotional_load, energy_required, estimated_minutes, is_focus, completed_at, archived_at, mental_cost, emotional_cost, recovery_minutes, task_intensity")
    .eq("user_id", currentUser.id)
    .eq("planned_date", todayIso)
    .is("archived_at", null)
    .order("is_focus", { ascending: false })
    .order("updated_at", { ascending: false }));

  if (error && shouldFallbackTasks(error)) {
    ({
      data,
      error
    } = await supabase
      .from("tasks")
      .select("id, title, details, status, completed_at")
      .eq("user_id", currentUser.id)
      .order("updated_at", { ascending: false })
      .limit(20));
  }

  if (error) {
    throw error;
  }

  const supabaseTasks = Array.isArray(data) ? normalizeSupabaseTasks(data) : [];
  const backlogTasks = loadBacklogTasksForToday();
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
  let data;
  let error;

  ({
    data,
    error
  } = await supabase
    .from("tasks")
    .select("id, title, details, status, planned_date, task_type, cognitive_load, emotional_load, energy_required, estimated_minutes, is_focus, completed_at, archived_at, mental_cost, emotional_cost, recovery_minutes, task_intensity")
    .eq("user_id", currentUser.id)
    .gte("planned_date", recentStartIso)
    .lte("planned_date", todayIso)
    .is("archived_at", null)
    .order("planned_date", { ascending: true })
    .order("updated_at", { ascending: false }));

  if (error && shouldFallbackTasks(error)) {
    ({
      data,
      error
    } = await supabase
      .from("tasks")
      .select("id, title, details, status, planned_date, completed_at")
      .eq("user_id", currentUser.id)
      .gte("planned_date", recentStartIso)
      .lte("planned_date", todayIso)
      .order("updated_at", { ascending: false })
      .limit(80));
  }

  if (error) {
    throw error;
  }

  const supabaseTasks = Array.isArray(data)
    ? normalizeSupabaseTasksForRange(data, recentStartIso, todayIso)
    : [];
  const backlogTasks = loadBacklogTasksForRange(recentStartIso, todayIso);
  recentTasks = mergeTasks(supabaseTasks, backlogTasks);
}

function normalizeSupabaseTasks(tasks) {
  return tasks
    .filter((task) => !task.planned_date || task.planned_date === todayIso)
    .map((task) => ({
      id: task.id,
      title: task.title || "Без названия",
      details: task.details || "",
      status: task.status || "todo",
      task_type: task.task_type || "Admin",
      cognitive_load: Number(task.cognitive_load || 1),
      emotional_load: Number(task.emotional_load || 1),
      energy_required: Number(task.energy_required || 1),
      estimated_minutes: Number(task.estimated_minutes || 30),
      mental_cost: Number(task.mental_cost || task.cognitive_load || 1),
      emotional_cost: Number(task.emotional_cost || task.emotional_load || 1),
      recovery_minutes: Number(task.recovery_minutes || 0),
      task_intensity: task.task_intensity || mapEnergyRequiredToIntensity(task.energy_required),
      is_focus: Boolean(task.is_focus),
      completed_at: task.completed_at || null,
      source: "supabase"
    }));
}

function normalizeSupabaseTasksForRange(tasks, startIso, endIso) {
  return tasks
    .filter((task) => task?.planned_date && task.planned_date >= startIso && task.planned_date <= endIso)
    .map((task) => ({
      id: task.id,
      title: task.title || "Р‘РµР· РЅР°Р·РІР°РЅРёСЏ",
      details: task.details || "",
      status: task.status || "todo",
      task_type: task.task_type || "Admin",
      cognitive_load: Number(task.cognitive_load || 1),
      emotional_load: Number(task.emotional_load || 1),
      energy_required: Number(task.energy_required || 1),
      estimated_minutes: Number(task.estimated_minutes || 30),
      mental_cost: Number(task.mental_cost || task.cognitive_load || 1),
      emotional_cost: Number(task.emotional_cost || task.emotional_load || 1),
      recovery_minutes: Number(task.recovery_minutes || 0),
      task_intensity: task.task_intensity || mapEnergyRequiredToIntensity(task.energy_required),
      is_focus: Boolean(task.is_focus),
      completed_at: task.completed_at || null,
      planned_date: task.planned_date,
      source: "supabase"
    }));
}

function loadBacklogTasksForToday() {
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
      return backlogToTodayTasks(parsed);
    } catch {
      return [];
    }
  }

  return [];
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

function backlogToTodayTasks(backlogData) {
  if (!backlogData || typeof backlogData !== "object") {
    return [];
  }

  const tasks = [];

  Object.values(backlogData).forEach((week) => {
    const days = Array.isArray(week?.days) ? week.days : [];
    days.forEach((day) => {
      if (day?.date !== todayShort) {
        return;
      }

      const items = Array.isArray(day?.items) ? day.items : [];
      items.forEach((item, index) => {
        const energyCost = item?.energyCost || "M";
        const mentalCost = Number(item?.mentalCost || mapTaskTypeToMentalCost(item?.taskType, energyCost));
        const emotionalCost = Number(item?.emotionalCost || mapStressToEmotionalCost(item?.stress));
        const estimatedMinutes = Number(item?.estimated_minutes || mapEnergyCostToMinutes(energyCost));
        const taskIntensity = item?.taskIntensity || mapEnergyCostToIntensity(energyCost);

        tasks.push({
          id: item?.id || `backlog-${day.date}-${index}`,
          title: item?.text || "Без названия",
          details: "",
          status: mapBacklogStatus(item?.status),
          task_type: item?.taskType || "Low Energy",
          cognitive_load: mentalCost,
          emotional_load: emotionalCost,
          energy_required: mapTaskTypeToEnergyRequired(item?.taskType, energyCost),
          estimated_minutes: estimatedMinutes,
          mental_cost: mentalCost,
          emotional_cost: emotionalCost,
          recovery_minutes: Number(item?.recoveryMinutes ?? mapIntensityToRecoveryMinutes(taskIntensity, energyCost)),
          task_intensity: taskIntensity,
          is_focus: false,
          completed_at: mapBacklogStatus(item?.status) === "done" ? todayIso : null,
          source: "backlog"
        });
      });
    });
  });

  return tasks;
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
        const energyCost = item?.energyCost || "M";
        const mentalCost = Number(item?.mentalCost || mapTaskTypeToMentalCost(item?.taskType, energyCost));
        const emotionalCost = Number(item?.emotionalCost || mapStressToEmotionalCost(item?.stress));
        const estimatedMinutes = Number(item?.estimated_minutes || mapEnergyCostToMinutes(energyCost));
        const taskIntensity = item?.taskIntensity || mapEnergyCostToIntensity(energyCost);

        tasks.push({
          id: item?.id || `backlog-${plannedDate}-${index}`,
          title: item?.text || "Р‘РµР· РЅР°Р·РІР°РЅРёСЏ",
          details: "",
          status: mapBacklogStatus(item?.status),
          task_type: item?.taskType || "Low Energy",
          cognitive_load: mentalCost,
          emotional_load: emotionalCost,
          energy_required: mapTaskTypeToEnergyRequired(item?.taskType, energyCost),
          estimated_minutes: estimatedMinutes,
          mental_cost: mentalCost,
          emotional_cost: emotionalCost,
          recovery_minutes: Number(item?.recoveryMinutes ?? mapIntensityToRecoveryMinutes(taskIntensity, energyCost)),
          task_intensity: taskIntensity,
          is_focus: false,
          completed_at: mapBacklogStatus(item?.status) === "done" ? `${plannedDate}T18:00:00.000Z` : null,
          planned_date: plannedDate,
          source: "backlog"
        });
      });
    });
  });

  return tasks;
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

async function handleTaskCreateSubmit() {
  const draft = buildDraftTask();
  if (!draft) {
    setTaskCreateStatus("Добавьте название задачи.", true);
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

async function finalizeTaskCreate(draft, plannedDate, successMessage) {
  closeGuardModal();
  setTaskCreateStatus("Сохраняю задачу...");

  const payload = buildTaskInsertPayload(draft, plannedDate);
  let inserted;
  let error;

  ({
    data: inserted,
    error
  } = await supabase
    .from("tasks")
    .insert(payload)
    .select("id, title, details, status, planned_date, task_type, cognitive_load, emotional_load, energy_required, estimated_minutes, is_focus, completed_at, archived_at, mental_cost, emotional_cost, recovery_minutes, task_intensity")
    .single());

  if (error && shouldFallbackTasks(error)) {
    ({
      data: inserted,
      error
    } = await supabase
      .from("tasks")
      .insert({
        user_id: currentUser.id,
        title: draft.title,
        details: "",
        status: "todo",
        planned_date: plannedDate,
        task_type: draft.task_type,
        cognitive_load: draft.cognitive_load,
        emotional_load: draft.emotional_load,
        energy_required: draft.energy_required,
        estimated_minutes: draft.estimated_minutes,
        is_focus: false
      })
      .select("id, title, details, status, planned_date, task_type, cognitive_load, emotional_load, energy_required, estimated_minutes, is_focus, completed_at")
      .single());
  }

  if (error) {
    setTaskCreateStatus(error.message || "Не удалось сохранить задачу.", true);
    return;
  }

  const normalizedInserted = normalizeInsertedTask(inserted, plannedDate, draft);
  if (plannedDate === todayIso) {
    todayTasks = mergeTasks([...todayTasks, normalizedInserted], []);
    recentTasks = mergeTasks([...recentTasks, normalizedInserted], []);
  }

  resetTaskCreateForm();
  setTaskCreateStatus(successMessage);
  renderTodayView();
}

function fillCheckinForm() {
  if (!todayCheckin) {
    energyInput.value = "6";
    stressInput.value = "4";
    focusInput.value = "6";
    sleepSelect.value = "";
    moodSelect.value = "";
    syncRangeOutputs();
    setCheckinStatus("Заполните состояние дня, чтобы приложение точнее оценило нагрузку.");
    return;
  }

  energyInput.value = String(todayCheckin.energy_level || 6);
  stressInput.value = String(todayCheckin.stress_level || 4);
  focusInput.value = String(todayCheckin.focus_level || 6);
  sleepSelect.value = todayCheckin.sleep_quality || "";
  moodSelect.value = todayCheckin.mood || "";
  syncRangeOutputs();
  setCheckinStatus("Данные за сегодня загружены.");
}

function syncRangeOutputs() {
  energyValue.textContent = energyInput.value;
  stressValue.textContent = stressInput.value;
  focusValue.textContent = focusInput.value;
}

function renderTodayView() {
  const summary = buildTodaySummary();
  renderDailySummary(summary);
  renderCapacity(summary.capacity);
  renderEnergyDebt(summary.energyDebt);
  renderEnergyMap(summary.energyMap);
}

function buildTodaySummary() {
  const state = currentState();
  const activeTasks = todayTasks.filter((task) => !isDone(task));
  const topTasks = rankTasksForToday(activeTasks).slice(0, 3);
  const totalLoad = activeTasks.reduce((sum, task) => sum + calculateTaskLoad(task), 0);

  const capacity = calculateCapacityMetrics(state, activeTasks, totalLoad);
  const status = readinessStatus(capacity.score);
  const recommendations = buildRecommendations(state, activeTasks, totalLoad, status, capacity);
  const warning = capacity.score < 40 || capacity.taskPenalty >= 24 || state.stress >= 8;
  const greeting = buildGreeting();
  const intro = buildIntro(state, activeTasks, status);
  const statusNote = buildStatusNote(state, activeTasks, totalLoad, status, capacity);
  const energyDebt = summarizeEnergyDebt(buildEnergyDebtSeries(recentCheckins, recentTasks));
  const energyMap = buildEnergyMap(state, activeTasks, totalLoad, capacity);

  return {
    greeting,
    intro,
    score: capacity.score,
    status,
    warning,
    recommendations: recommendations.slice(0, 3),
    topTasks,
    statusNote,
    capacity,
    energyDebt,
    energyMap
  };
}

function currentState() {
  return {
    energy: Number(energyInput?.value || todayCheckin?.energy_level || 6),
    stress: Number(stressInput?.value || todayCheckin?.stress_level || 4),
    focus: Number(focusInput?.value || todayCheckin?.focus_level || 6),
    sleep: sleepSelect?.value || todayCheckin?.sleep_quality || "",
    mood: moodSelect?.value || todayCheckin?.mood || ""
  };
}

function buildDraftTask() {
  const title = String(taskTitleInput?.value || "").trim();
  if (!title) {
    return null;
  }

  const taskType = taskTypeInput?.value || "Admin";
  const mentalCost = clamp(Number(taskMentalCostInput?.value || 3), 1, 5);
  const emotionalCost = clamp(Number(taskEmotionalCostInput?.value || 3), 1, 5);
  const estimatedMinutes = Math.max(10, Number(taskMinutesInput?.value || 45));
  const energyRequired = inferEnergyRequired(taskType, mentalCost);
  const taskIntensity = inferTaskIntensity(taskType, mentalCost, estimatedMinutes);
  const recoveryMinutes = taskType === "Recovery" ? 25 : taskIntensity === "high" ? 20 : taskIntensity === "low" ? 5 : 10;

  return {
    id: `draft-${Date.now()}`,
    title,
    details: "",
    status: "todo",
    task_type: taskType,
    cognitive_load: mentalCost,
    emotional_load: emotionalCost,
    energy_required: energyRequired,
    estimated_minutes: estimatedMinutes,
    mental_cost: mentalCost,
    emotional_cost: emotionalCost,
    recovery_minutes: recoveryMinutes,
    task_intensity: taskIntensity,
    is_focus: false,
    completed_at: null,
    planned_date: todayIso,
    source: "draft"
  };
}

function renderDailySummary(summary) {
  summaryGreeting.textContent = summary.greeting;
  summaryIntro.textContent = summary.intro;
  readinessScore.textContent = String(summary.score);
  dayStatus.textContent = summary.status.label;
  dayStatus.dataset.state = summary.status.state;
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

  topTasksBox.innerHTML = summary.topTasks.map((task) => `
    <article class="today-top-task-card">
      <strong>${escapeHtml(task.title)}</strong>
      <div class="today-top-task-meta">
        <span>${escapeHtml(task.task_type || "Task")}</span>
        <span>Mental ${Number(task.mental_cost || task.cognitive_load || 1)}/5</span>
        <span>Emotional ${Number(task.emotional_cost || task.emotional_load || 1)}/5</span>
        <span>${Number(task.estimated_minutes || 30)} min</span>
      </div>
    </article>
  `).join("");
}

function renderCapacity(metrics) {
  capacityPercent.textContent = String(metrics.score);
  capacityLabel.textContent = metrics.label;
  capacityLabel.dataset.state = metrics.state;
  capacityBar.style.width = `${Math.min(metrics.score, 100)}%`;
  capacityBar.dataset.state = metrics.state;
  capacityNote.textContent = metrics.note;
  if (capacityMode) {
    capacityMode.textContent = metrics.mode;
  }
}

function renderEnergyDebt(energyDebt) {
  if (!energyDebtValue || !energyDebtStatus || !energyDebtNote) {
    return;
  }

  energyDebtCard?.classList.remove("is-locked");
  energyDebtValue.textContent = String(energyDebt.value);
  energyDebtStatus.textContent = energyDebt.status;
  energyDebtStatus.dataset.state = energyDebt.state;
  energyDebtNote.textContent = energyDebt.note;
}

function renderEnergyMap(energyMap) {
  if (!energyMapGrid || !energyMapWarning) {
    return;
  }

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

function calculateCapacityMetrics(state, tasks, totalLoad = tasks.reduce((sum, task) => sum + calculateTaskLoad(task), 0)) {
  const energyBonus = Math.round((clamp(state.energy, 1, 10) / 10) * 20);
  const focusBonus = Math.round((clamp(state.focus, 1, 10) / 10) * 10);
  const stressPenalty = Math.round((clamp(state.stress, 1, 10) / 10) * 25);
  const loadPenalty = Math.min(30, Math.round(totalLoad / 5));
  const score = clamp(70 + energyBonus + focusBonus - stressPenalty - loadPenalty, 0, 100);

  const status = readinessStatus(score);
  const mode = recommendedMode(score, state, tasks);

  return {
    score,
    state: status.state,
    label: status.label,
    note: readinessExplanation(score, state, totalLoad, mode),
    mode,
    energyBonus,
    focusBonus,
    stressPenalty,
    taskPenalty: loadPenalty
  };
}

function calculateTaskLoad(task) {
  const mental = Number(task.mental_cost || task.cognitive_load || 1);
  const emotional = Number(task.emotional_cost || task.emotional_load || 1);
  const energy = Number(task.energy_required || 1);
  const minutes = Number(task.estimated_minutes || 30);
  return mental * 10 + emotional * 8 + energy * 6 + minutes / 10;
}

function buildEnergyMap(state, tasks, totalLoad, capacity) {
  const taskCount = tasks.length;
  const heavyLoad = totalLoad >= 110 || taskCount >= 5;
  const highStress = state.stress >= 7;
  const lowEnergy = state.energy <= 4;
  const lowFocus = state.focus <= 4;

  const morning = highStress
    ? {
        recommendation: "Admin",
        note: "Утро лучше начать без тяжёлого Deep Work, чтобы не усиливать напряжение."
      }
    : state.energy >= 7 && state.focus >= 6
      ? {
          recommendation: "Deep Work",
          note: "Лучшее окно для самой важной и интеллектуально сложной задачи."
        }
      : lowEnergy
        ? {
            recommendation: "Light Tasks",
            note: "С утра лучше выбрать короткие и понятные задачи без сильного давления."
          }
        : {
            recommendation: "Meetings",
            note: "Подойдёт для синхронизаций и обсуждений, если ресурс пока средний."
          };

  const midday = lowEnergy
    ? {
        recommendation: "Recovery",
        note: "В середине дня полезно замедлиться и оставить пространство на восстановление."
      }
    : highStress
      ? {
          recommendation: "Light Tasks",
          note: "Лучше выбирать спокойные задачи и избегать длинных тяжёлых блоков."
        }
      : {
          recommendation: "Meetings",
          note: "Хорошее время для встреч, согласований и командных обсуждений."
        };

  const afternoon = lowFocus || highStress
    ? {
        recommendation: "Admin",
        note: "Во второй половине дня лучше закрывать операционные и поддерживающие задачи."
      }
    : capacity.mode === "Deep Work"
      ? {
          recommendation: "Deep Work",
          note: "Если ресурс держится, можно оставить ещё один короткий фокус-блок."
        }
      : {
          recommendation: "Light Tasks",
          note: "Лучше планировать умеренную нагрузку и быстрые завершения."
        };

  const evening = heavyLoad || lowEnergy
    ? {
        recommendation: "Recovery",
        note: "Вечером лучше не усиливать нагрузку и оставить время на восстановление."
      }
    : {
        recommendation: "Admin",
        note: "Подходит для лёгкого завершения дня, заметок и мелких организационных задач."
      };

  const warning = heavyLoad
    ? "Задач на сегодня уже много. Не добавляй ещё тяжёлые слоты без необходимости."
    : highStress
      ? "Стресс высокий: сегодня лучше не планировать несколько Deep Work блоков подряд."
      : "";

  return {
    slots: [
      { label: "Morning", ...morning },
      { label: "Midday", ...midday },
      { label: "Afternoon", ...afternoon },
      { label: "Evening", ...evening }
    ],
    warning
  };
}

function evaluateOverloadGuard(draftTask) {
  const currentSummary = buildTodaySummary();
  const projectedTasks = [...todayTasks.filter((task) => !isDone(task)), draftTask];
  const projectedTotalLoad = projectedTasks.reduce((sum, task) => sum + calculateTaskLoad(task), 0);
  const projectedCapacity = calculateCapacityMetrics(currentState(), projectedTasks, projectedTotalLoad);
  const projectedEnergyDebt = summarizeEnergyDebt(buildEnergyDebtSeries(recentCheckins, [...recentTasks, draftTask]));
  const projectedDeepWorkCount = projectedTasks.filter((task) => String(task.task_type || "").toLowerCase() === "deep work").length;
  const reasons = [];

  if (currentSummary.score - projectedCapacity.score >= 15) {
    reasons.push(`Readiness Score снизится с ${currentSummary.score} до ${projectedCapacity.score}.`);
  }

  if (projectedEnergyDebt.value > currentSummary.energyDebt.value) {
    reasons.push(`Energy Debt вырастет с ${currentSummary.energyDebt.value} до ${projectedEnergyDebt.value}.`);
  }

  if (projectedDeepWorkCount > 2) {
    reasons.push(`Deep Work задач станет ${projectedDeepWorkCount}. Лучше держать не больше двух.`);
  }

  if (Number(draftTask.mental_cost || 0) >= 4) {
    reasons.push("У новой задачи высокий Mental Cost.");
  }

  if (projectedCapacity.score < 40 && !reasons.length) {
    reasons.push("После добавления день будет выглядеть тяжёлым для текущего состояния.");
  }

  return {
    shouldWarn: reasons.length > 0,
    reasons
  };
}

function openGuardModal(guard) {
  if (!guardModal || !guardMessage || !guardReasons) {
    return;
  }

  guardMessage.textContent = "Похоже, день станет перегруженным. Лучше перенести эту задачу?";
  guardReasons.innerHTML = guard.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("");
  guardModal.hidden = false;
}

function closeGuardModal() {
  pendingGuardDraft = null;
  if (guardModal) {
    guardModal.hidden = true;
  }
}

function buildEnergyDebtSeries(checkins, tasks) {
  const checkinMap = new Map((checkins || []).map((item) => [item.checkin_date, item]));
  const taskMap = new Map();

  (tasks || []).forEach((task) => {
    const date = task?.planned_date;
    if (!date) {
      return;
    }

    if (!taskMap.has(date)) {
      taskMap.set(date, []);
    }
    taskMap.get(date).push(task);
  });

  let cumulative = 0;
  return listIsoDates(recentStartIso, todayIso).map((date) => {
    const dayCheckin = checkinMap.get(date) || null;
    const dayTasks = taskMap.get(date) || [];
    const taskLoad = dayTasks.reduce((sum, task) => sum + calculateTaskLoad(task), 0);
    const hasRecoveryTask = dayTasks.some(isRecoveryTask);
    const delta = calculateEnergyDebtDelta(dayCheckin, taskLoad, hasRecoveryTask);

    cumulative = Math.max(0, cumulative + delta);

    return {
      date,
      checkin: dayCheckin,
      tasks: dayTasks,
      taskLoad,
      hasRecoveryTask,
      delta,
      value: cumulative
    };
  });
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

function summarizeEnergyDebt(series) {
  if (!series.length) {
    return {
      value: 0,
      status: "Healthy",
      state: "excellent",
      note: "Метрика появится после нескольких дней использования."
    };
  }

  const current = series[series.length - 1]?.value || 0;
  const status = energyDebtStatusMeta(current);

  return {
    value: current,
    status: status.label,
    state: status.state,
    note: status.note
  };
}

function energyDebtStatusMeta(value) {
  if (value <= 20) {
    return {
      label: "Healthy",
      state: "excellent",
      note: "Нагрузка выглядит устойчивой. Пока нет признаков заметного энергетического долга."
    };
  }

  if (value <= 50) {
    return {
      label: "Watch",
      state: "heavy",
      note: "Нагрузка накапливается. Стоит внимательнее чередовать тяжёлые задачи и восстановление."
    };
  }

  return {
    label: "Overloaded",
    state: "risk",
    note: "Последние дни ты работаешь в энергетический долг. Лучше снизить нагрузку или добавить восстановление."
  };
}

function rankTasksForToday(tasks) {
  return [...tasks].sort((left, right) => {
    if (Boolean(right.is_focus) !== Boolean(left.is_focus)) {
      return Number(Boolean(right.is_focus)) - Number(Boolean(left.is_focus));
    }

    const rightLoad = calculateTaskLoad(right);
    const leftLoad = calculateTaskLoad(left);
    if (rightLoad !== leftLoad) {
      return rightLoad - leftLoad;
    }

    return String(left.title || "").localeCompare(String(right.title || ""));
  });
}

function buildRecommendations(state, tasks, totalLoad, status, capacity) {
  const recommendations = [];
  const deepWorkCount = tasks.filter((task) => String(task.task_type || "").toLowerCase().includes("deep")).length;
  const heavyMentalCount = tasks.filter((task) => Number(task.mental_cost || task.cognitive_load || 1) >= 4).length;

  if (!todayCheckin) {
    recommendations.push("Заполни Daily Check-in утром, чтобы рекомендации стали точнее.");
  }

  if (state.energy <= 4) {
    recommendations.push("Начни с короткой задачи на 15–30 минут и не планируй больше одной тяжёлой задачи подряд.");
  }

  if (state.stress >= 8) {
    recommendations.push("Стресс высокий — не начинай день с самой эмоционально тяжёлой задачи.");
  }

  if (state.focus <= 4) {
    recommendations.push("Собери день вокруг одного главного блока работы и убери лишние переключения.");
  }

  if (deepWorkCount >= 2 || heavyMentalCount >= 2) {
    recommendations.push("Оставь максимум 1–2 задачи с высокой ментальной нагрузкой на сегодня.");
  }

  if (totalLoad > 120 || status.state === "risk") {
    recommendations.push("День перегружен — часть задач лучше перенести или сократить по объёму.");
  }

  if (capacity.mode === "Recovery") {
    recommendations.push("Сделай ставку на восстановление и короткие спокойные задачи вместо тяжёлых блоков.");
  } else if (capacity.mode === "Admin") {
    recommendations.push("Лучше закрывать понятные операционные задачи и не перегружать день сложным анализом.");
  } else if (capacity.mode === "Light Tasks") {
    recommendations.push("Ставь короткие задачи с быстрым прогрессом и избегай длинных тяжёлых блоков.");
  } else if (capacity.mode === "Deep Work") {
    recommendations.push("Лучшее окно для глубокой работы — начни с самой важной задачи, пока есть энергия и фокус.");
  }

  if (!tasks.length) {
    recommendations.push("На сегодня пока нет задач. Выбери 1–3 действительно важные задачи и не перегружай день.");
  }

  if (recommendations.length < 2) {
    recommendations.push("Сохраняй умеренный темп: сначала самое важное, потом поддерживающие задачи.");
  }

  if (recommendations.length < 3) {
    recommendations.push("Оставь окно на восстановление между тяжёлыми задачами.");
  }

  return dedupe(recommendations);
}

function buildGreeting() {
  const hour = new Date().getHours();
  const name = currentProfile?.full_name?.trim() || "";
  const suffix = name ? `, ${name}` : "";

  if (hour < 12) return `Доброе утро${suffix}`;
  if (hour < 18) return `Добрый день${suffix}`;
  return `Добрый вечер${suffix}`;
}

function buildIntro(state, tasks, status) {
  if (!tasks.length && !todayCheckin) {
    return "Сначала отметь своё состояние и выбери несколько задач на сегодня — тогда сводка станет полезнее.";
  }

  if (!tasks.length) {
    return "Состояние дня уже понятно. Теперь можно собрать короткий реалистичный план без лишней нагрузки.";
  }

  return `На сегодня в плане ${tasks.length} ${pluralizeTasks(tasks.length)}. Общий ритм дня сейчас оценивается как ${status.label.toLowerCase()}.`;
}

function buildStatusNote(state, tasks, totalLoad, status, capacity) {
  if (!tasks.length) {
    return "Пока задач на сегодня нет. Это хороший момент, чтобы выбрать только самое важное и не переполнить день.";
  }

  if (status.state === "excellent") {
    return "Состояние сильное: энергии и фокуса достаточно, а текущая нагрузка выглядит комфортной.";
  }

  if (status.state === "stable") {
    return "День выглядит рабочим и устойчивым. Лучше держаться короткого плана и не добавлять лишнее.";
  }

  if (status.state === "heavy") {
    return `День уже выглядит плотным: ${Math.round(totalLoad)} баллов нагрузки. Лучше держаться более лёгкого режима и не набирать лишнее.`;
  }

  return `Сейчас score = ${capacity.score}. Лучше уменьшить плотность плана и оставить задачи в режиме ${capacity.mode}.`;
}

function readinessStatus(score) {
  if (score >= 80) {
    return { label: "Excellent Day", state: "excellent" };
  }
  if (score >= 60) {
    return { label: "Stable", state: "stable" };
  }
  if (score >= 40) {
    return { label: "Heavy", state: "heavy" };
  }
  return { label: "Recovery Needed", state: "risk" };
}

function recommendedMode(score, state, tasks) {
  const deepWorkCount = tasks.filter((task) => String(task.task_type || "").toLowerCase().includes("deep")).length;
  const heavyMentalCount = tasks.filter((task) => Number(task.mental_cost || task.cognitive_load || 1) >= 4).length;

  if (score < 40 || state.stress >= 8) return "Recovery";
  if (score < 55 || state.energy <= 4) return "Light Tasks";
  if (state.focus <= 5 || heavyMentalCount >= 3) return "Admin";
  if (deepWorkCount >= 1 && score >= 75) return "Deep Work";
  return "Admin";
}

function readinessExplanation(score, state, totalLoad, mode) {
  if (score >= 80) {
    return `Энергия и фокус хорошие, а текущая нагрузка выглядит комфортной. Лучший формат дня — ${mode}.`;
  }
  if (score >= 60) {
    return `День выглядит устойчивым. Можно работать спокойно, но без перегруза. Подходящий режим — ${mode}.`;
  }
  if (score >= 40) {
    return `Нагрузка уже ощущается: стресс или объём задач начали давить на день. Лучше сместиться в режим ${mode}.`;
  }
  return `Сегодня день тяжёлый: сочетание стресса, энергии и нагрузки просит более бережный ритм. Лучше выбрать ${mode}.`;
}

function sleepModifier(value) {
  if (value === "Хорошо") return 6;
  if (value === "Плохо") return -8;
  return 0;
}

function moodModifier(value) {
  if (value === "Воодушевленное") return 4;
  if (value === "Спокойное") return 2;
  if (value === "Тревожное") return -5;
  if (value === "Раздраженное") return -6;
  if (value === "Уставшее") return -7;
  return 0;
}

function mapBacklogStatus(status) {
  if (status === "Сделано" || status === "РЎРґРµР»Р°РЅРѕ") {
    return "done";
  }
  if (status === "В работе" || status === "Р’ СЂР°Р±РѕС‚Рµ") {
    return "in_progress";
  }
  return "todo";
}

function mapEnergyCostToMinutes(cost) {
  if (cost === "L") return 90;
  if (cost === "S") return 30;
  return 60;
}

function mapEnergyCostToIntensity(cost) {
  if (cost === "L") return "high";
  if (cost === "S") return "low";
  return "medium";
}

function mapTaskTypeToMentalCost(taskType, energyCost = "M") {
  const level = energyCost === "L" ? 2 : energyCost === "S" ? 0 : 1;
  if (taskType === "Deep Work") return Math.min(5, 3 + level);
  if (taskType === "High Energy") return Math.min(5, 2 + level);
  return Math.min(5, 1 + level);
}

function mapStressToEmotionalCost(stress) {
  if (stress === "Высокий" || stress === "Р’С‹СЃРѕРєРёР№") return 5;
  if (stress === "Средний" || stress === "РЎСЂРµРґРЅРёР№") return 3;
  if (stress === "Низкий" || stress === "РќРёР·РєРёР№") return 2;
  return 1;
}

function mapTaskTypeToEnergyRequired(taskType, energyCost = "M") {
  const level = energyCost === "L" ? 2 : energyCost === "S" ? 0 : 1;
  if (taskType === "High Energy") return 3 + level;
  if (taskType === "Deep Work") return 2 + level;
  return 1 + level;
}

function mapIntensityToRecoveryMinutes(taskIntensity = "medium", energyCost = "M") {
  if (taskIntensity === "high" || energyCost === "L") return 30;
  if (taskIntensity === "low" || energyCost === "S") return 5;
  return 15;
}

function mapEnergyRequiredToIntensity(value) {
  const normalized = Number(value || 1);
  if (normalized >= 4) return "high";
  if (normalized <= 2) return "low";
  return "medium";
}

function isRecoveryTask(task) {
  const type = String(task?.task_type || "").toLowerCase();
  const intensity = String(task?.task_intensity || "").toLowerCase();
  const recoveryMinutes = Number(task?.recovery_minutes || 0);

  return type.includes("recovery") || intensity === "low" || recoveryMinutes >= 20;
}

function mergeTasks(supabaseTasks, backlogTasks) {
  const merged = new Map();

  [...backlogTasks, ...supabaseTasks].forEach((task) => {
    const key = String(task.id || `${task.title}-${task.status}`);
    merged.set(key, task);
  });

  return Array.from(merged.values());
}

function upsertRecentCheckin(items, checkin) {
  const map = new Map((items || []).map((item) => [item.checkin_date, item]));
  map.set(checkin.checkin_date, checkin);
  return Array.from(map.values()).sort((left, right) => String(left.checkin_date).localeCompare(String(right.checkin_date)));
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

function buildTaskInsertPayload(draft, plannedDate) {
  return {
    user_id: currentUser.id,
    title: draft.title,
    details: "",
    status: "todo",
    planned_date: plannedDate,
    task_type: draft.task_type,
    cognitive_load: draft.cognitive_load,
    emotional_load: draft.emotional_load,
    energy_required: draft.energy_required,
    estimated_minutes: draft.estimated_minutes,
    is_focus: false,
    mental_cost: draft.mental_cost,
    emotional_cost: draft.emotional_cost,
    recovery_minutes: draft.recovery_minutes,
    task_intensity: draft.task_intensity
  };
}

function normalizeInsertedTask(task, plannedDate, fallbackDraft) {
  return {
    id: task?.id || fallbackDraft.id,
    title: task?.title || fallbackDraft.title,
    details: task?.details || "",
    status: task?.status || "todo",
    task_type: task?.task_type || fallbackDraft.task_type,
    cognitive_load: Number(task?.cognitive_load || fallbackDraft.cognitive_load || 1),
    emotional_load: Number(task?.emotional_load || fallbackDraft.emotional_load || 1),
    energy_required: Number(task?.energy_required || fallbackDraft.energy_required || 1),
    estimated_minutes: Number(task?.estimated_minutes || fallbackDraft.estimated_minutes || 30),
    mental_cost: Number(task?.mental_cost || fallbackDraft.mental_cost || task?.cognitive_load || 1),
    emotional_cost: Number(task?.emotional_cost || fallbackDraft.emotional_cost || task?.emotional_load || 1),
    recovery_minutes: Number(task?.recovery_minutes || fallbackDraft.recovery_minutes || 0),
    task_intensity: task?.task_intensity || fallbackDraft.task_intensity || mapEnergyRequiredToIntensity(task?.energy_required),
    is_focus: Boolean(task?.is_focus),
    completed_at: task?.completed_at || null,
    planned_date: task?.planned_date || plannedDate,
    source: "supabase"
  };
}

function resetTaskCreateForm() {
  if (taskCreateForm) {
    taskCreateForm.reset();
  }
  if (taskMentalCostInput) taskMentalCostInput.value = "3";
  if (taskEmotionalCostInput) taskEmotionalCostInput.value = "3";
  if (taskMinutesInput) taskMinutesInput.value = "45";
  if (taskTypeInput) taskTypeInput.value = "Deep Work";
}

function inferEnergyRequired(taskType, mentalCost) {
  if (taskType === "Recovery") return 1;
  if (taskType === "Light Tasks") return 2;
  if (taskType === "Admin") return 2;
  if (taskType === "Meetings") return 3;
  if (taskType === "Deep Work") return Math.max(3, mentalCost);
  return 3;
}

function inferTaskIntensity(taskType, mentalCost, estimatedMinutes) {
  if (taskType === "Recovery" || taskType === "Light Tasks") return "low";
  if (taskType === "Deep Work" && (mentalCost >= 4 || estimatedMinutes >= 60)) return "high";
  if (taskType === "Meetings" && estimatedMinutes >= 60) return "medium";
  if (taskType === "Admin") return "low";
  return mentalCost >= 4 ? "high" : "medium";
}

function shouldFallbackTasks(error) {
  const message = String(error?.message || "");
  return [
    "planned_date",
    "mental_cost",
    "emotional_cost",
    "recovery_minutes",
    "task_intensity",
    "archived_at"
  ].some((field) => message.includes(field));
}

function isDone(task) {
  return task.status === "done" || Boolean(task.completed_at);
}

function dedupe(items) {
  return Array.from(new Set(items.filter(Boolean)));
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function listIsoDates(startIso, endIso) {
  const dates = [];
  let cursor = new Date(startIso);
  const end = new Date(endIso);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function shiftIsoDate(isoDate, diff) {
  const next = new Date(isoDate);
  next.setDate(next.getDate() + diff);
  return next.toISOString().slice(0, 10);
}

function withMigrationHint(error, tableName) {
  const message = String(error?.message || "");

  if (message.includes("Could not find the table 'public.daily_checkins'")) {
    return new Error("В Supabase еще не создана таблица daily_checkins. Сначала выполните SQL из файла supabase/schema.sql, затем выполните supabase/today-screen-migration.sql.");
  }

  if (message.includes("sleep_quality") || message.includes("mood")) {
    return new Error(`Для экрана Сегодня нужно выполнить SQL из файла supabase/today-screen-migration.sql. Таблица: ${tableName}.`);
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
