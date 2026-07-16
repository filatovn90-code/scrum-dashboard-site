import { getCurrentProfile, getSupabase } from "./supabase-client.js";
import { requireAuth, signOutCurrentUser } from "./auth-helpers.js";
import {
  completeOnboardingForUser,
  getOnboardingState,
  startOnboardingForUser,
  updateOnboardingState
} from "./onboarding-helpers.js";
import { landingPath, loginPath, todayPath } from "./route-paths.js";
import {
  calculateDailyLoadLevel,
  calculateEnergyDebtSeries,
  calculateReadinessScore,
  describeTaskLoad,
  generateRuleBasedRecommendations,
  normalizeTask,
  summarizeEnergyDebt,
  toIsoDate
} from "./lib/workload.js";

const todayIso = toIsoDate(new Date());

const statusBox = document.getElementById("onboardingStatus");
const logoutButton = document.getElementById("onboardingLogoutButton");
const stepCards = Array.from(document.querySelectorAll("[data-step]"));
const stepMarkers = Array.from(document.querySelectorAll("[data-step-marker]"));

const goalChoices = Array.from(document.querySelectorAll("[data-goal]"));
const stepOneNextButton = document.getElementById("onboardingStepOneNext");

const energyInput = document.getElementById("onboardingEnergyInput");
const stressInput = document.getElementById("onboardingStressInput");
const focusInput = document.getElementById("onboardingFocusInput");
const energyValue = document.getElementById("onboardingEnergyValue");
const stressValue = document.getElementById("onboardingStressValue");
const focusValue = document.getElementById("onboardingFocusValue");
const sleepSelect = document.getElementById("onboardingSleepSelect");
const moodSelect = document.getElementById("onboardingMoodSelect");
const saveCheckinButton = document.getElementById("onboardingSaveCheckin");
const backToGoalsButton = document.getElementById("onboardingBackToGoals");

const taskTitleInput = document.getElementById("onboardingTaskTitle");
const taskTypeInput = document.getElementById("onboardingTaskType");
const taskMentalInput = document.getElementById("onboardingTaskMental");
const taskEmotionalInput = document.getElementById("onboardingTaskEmotional");
const taskPreview = document.getElementById("onboardingTaskPreview");
const saveTaskButton = document.getElementById("onboardingSaveTask");
const goToFocusButton = document.getElementById("onboardingGoToFocus");
const backToCheckinButton = document.getElementById("onboardingBackToCheckin");

const focusList = document.getElementById("onboardingFocusList");
const saveFocusButton = document.getElementById("onboardingSaveFocus");
const backToTaskButton = document.getElementById("onboardingBackToTask");

const summaryLetter = document.getElementById("onboardingSummaryLetter");
const finishButton = document.getElementById("onboardingFinish");
const backToFocusButton = document.getElementById("onboardingBackToFocus");

let supabase;
let currentUser;
let currentProfile;
let onboardingState;
let selectedGoal = "";
let todayCheckin = null;
let todayTasks = [];
let selectedFocusIds = new Set();

bindEvents();
bootstrap();

function bindEvents() {
  logoutButton?.addEventListener("click", async () => {
    await signOutCurrentUser().catch(() => null);
    window.location.replace(landingPath());
  });

  goalChoices.forEach((button) => {
    button.addEventListener("click", () => {
      selectedGoal = button.dataset.goal || "";
      renderGoalSelection();
      setStatus("Цель выбрана. Можно переходить дальше.");
    });
  });

  stepOneNextButton?.addEventListener("click", () => {
    if (!selectedGoal) {
      setStatus("Сначала выбери, что хочешь улучшить.", true);
      return;
    }

    onboardingState = updateOnboardingState(currentUser.id, {
      goal: selectedGoal,
      currentStep: 2
    });
    showStep(2);
    setStatus("Отлично. Теперь соберем первое состояние дня.");
  });

  [energyInput, stressInput, focusInput].forEach((input) => {
    input?.addEventListener("input", syncRangeOutputs);
  });

  backToGoalsButton?.addEventListener("click", () => {
    onboardingState = updateOnboardingState(currentUser.id, { currentStep: 1 });
    showStep(1);
    setStatus("Можно поменять главный запрос.");
  });

  saveCheckinButton?.addEventListener("click", async () => {
    await saveFirstCheckin();
  });

  [taskTitleInput, taskTypeInput, taskMentalInput, taskEmotionalInput].forEach((input) => {
    input?.addEventListener("input", renderTaskPreview);
    input?.addEventListener("change", renderTaskPreview);
  });

  backToCheckinButton?.addEventListener("click", () => {
    onboardingState = updateOnboardingState(currentUser.id, { currentStep: 2 });
    showStep(2);
    setStatus("Если нужно, можно поправить состояние дня.");
  });

  saveTaskButton?.addEventListener("click", async () => {
    await saveFirstTask();
  });

  goToFocusButton?.addEventListener("click", () => {
    if (!todayTasks.length) {
      setStatus("Сначала добавь хотя бы одну задачу.", true);
      return;
    }

    onboardingState = updateOnboardingState(currentUser.id, { currentStep: 4 });
    renderFocusList();
    showStep(4);
    setStatus("Теперь выбери 1–3 задачи фокуса.");
  });

  backToTaskButton?.addEventListener("click", () => {
    onboardingState = updateOnboardingState(currentUser.id, { currentStep: 3 });
    showStep(3);
    setStatus("Можно отредактировать первую задачу или добавить еще одну.");
  });

  saveFocusButton?.addEventListener("click", async () => {
    await saveFocusSelection();
  });

  backToFocusButton?.addEventListener("click", () => {
    onboardingState = updateOnboardingState(currentUser.id, { currentStep: 4 });
    showStep(4);
    setStatus("Можно поменять задачи фокуса.");
  });

  finishButton?.addEventListener("click", () => {
    completeOnboardingForUser(currentUser.id);
    window.location.replace(todayPath());
  });
}

async function bootstrap() {
  currentUser = await requireAuth({ redirectTo: loginPath() });
  if (!currentUser) {
    return;
  }

  supabase = await getSupabase();
  currentProfile = await getCurrentProfile().catch(() => null);
  onboardingState = startOnboardingForUser(currentUser);

  if (onboardingState?.completed) {
    window.location.replace(todayPath());
    return;
  }

  selectedGoal = onboardingState?.goal || "";
  selectedFocusIds = new Set(Array.isArray(onboardingState?.focusTaskIds) ? onboardingState.focusTaskIds : []);

  try {
    await Promise.all([loadTodayCheckin(), loadTodayTasks()]);
    hydrateCheckinForm();
    renderGoalSelection();
    syncRangeOutputs();
    renderTaskPreview();
    renderFocusList();

    const initialStep = clamp(Number(onboardingState?.currentStep || 1), 1, 5);
    showStep(initialStep);
    setStatus(`Давай быстро настроим первый день${currentProfile?.full_name ? `, ${currentProfile.full_name}` : ""}.`);
  } catch (error) {
    setStatus(error?.message || "Не удалось открыть onboarding.", true);
  }
}

async function loadTodayCheckin() {
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
  let response = await supabase
    .from("tasks")
    .select("id, title, details, status, planned_date, task_type, cognitive_load, emotional_load, is_focus, completed_at, archived_at, updated_at, project_id")
    .eq("user_id", currentUser.id)
    .eq("planned_date", todayIso)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (response.error && shouldFallbackTasks(response.error)) {
    response = await supabase
      .from("tasks")
      .select("id, title, details, status, planned_date, task_type, cognitive_load, emotional_load, is_focus, completed_at, updated_at, project_id")
      .eq("user_id", currentUser.id)
      .eq("planned_date", todayIso)
      .order("updated_at", { ascending: false });
  }

  if (response.error) {
    throw response.error;
  }

  todayTasks = Array.isArray(response.data) ? response.data.map((task) => normalizeTask(task)) : [];
  if (!selectedFocusIds.size) {
    selectedFocusIds = new Set(todayTasks.filter((task) => task.is_focus).map((task) => task.id));
  }
}

function hydrateCheckinForm() {
  energyInput.value = String(todayCheckin?.energy_level || 6);
  stressInput.value = String(todayCheckin?.stress_level || 4);
  focusInput.value = String(todayCheckin?.focus_level || 6);
  sleepSelect.value = todayCheckin?.sleep_quality || "";
  moodSelect.value = todayCheckin?.mood || "";
}

function renderGoalSelection() {
  goalChoices.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.goal === selectedGoal);
  });
}

function syncRangeOutputs() {
  energyValue.textContent = energyInput?.value || "6";
  stressValue.textContent = stressInput?.value || "4";
  focusValue.textContent = focusInput?.value || "6";
}

function showStep(stepNumber) {
  stepCards.forEach((card) => {
    card.hidden = Number(card.dataset.step) !== stepNumber;
  });

  stepMarkers.forEach((marker) => {
    const markerStep = Number(marker.dataset.stepMarker);
    marker.classList.toggle("is-active", markerStep === stepNumber);
    marker.classList.toggle("is-complete", markerStep < stepNumber);
  });

  if (stepNumber === 4) {
    renderFocusList();
  }

  if (stepNumber === 5) {
    renderSummary();
  }
}

async function saveFirstCheckin() {
  const payload = {
    user_id: currentUser.id,
    checkin_date: todayIso,
    energy_level: Number(energyInput?.value || 6),
    stress_level: Number(stressInput?.value || 4),
    focus_level: Number(focusInput?.value || 6),
    sleep_quality: sleepSelect?.value || null,
    mood: moodSelect?.value || null,
    updated_at: new Date().toISOString()
  };

  setStatus("Сохраняю первый Daily Check-in...");
  saveCheckinButton.disabled = true;

  try {
    const { error } = await supabase
      .from("daily_checkins")
      .upsert(payload, { onConflict: "user_id,checkin_date" });

    if (error) {
      throw withMigrationHint(error, "daily_checkins");
    }

    todayCheckin = payload;
    onboardingState = updateOnboardingState(currentUser.id, { currentStep: 3 });
    showStep(3);
    setStatus("Состояние дня сохранено. Теперь добавим первую задачу.");
  } catch (error) {
    setStatus(error?.message || "Не удалось сохранить состояние дня.", true);
  } finally {
    saveCheckinButton.disabled = false;
  }
}

function buildTaskDraft() {
  const title = String(taskTitleInput?.value || "").trim();
  if (!title) {
    return null;
  }

  return normalizeTask({
    title,
    details: "",
    status: "todo",
    planned_date: todayIso,
    task_type: taskTypeInput?.value || "routine",
    cognitive_load: Number(taskMentalInput?.value || 3),
    emotional_load: Number(taskEmotionalInput?.value || 2),
    is_focus: false,
    completed_at: null
  });
}

function renderTaskPreview() {
  const draft = buildTaskDraft();
  if (!draft) {
    taskPreview.innerHTML = `
      <div class="onboarding-inline-note">
        Первая задача появится здесь после того, как ты введешь название.
      </div>
    `;
    return;
  }

  const details = describeTaskLoad(draft);
  taskPreview.innerHTML = `
    <article class="onboarding-task-card-preview">
      <strong>${escapeHtml(draft.title)}</strong>
      <div class="onboarding-task-preview-meta">
        <span>${escapeHtml(`${details.typeIcon} ${details.typeLabel}`)}</span>
        <span>Когнитивная: ${details.cognitiveLabel}</span>
        <span>Эмоциональная: ${details.emotionalLabel}</span>
        <span>Нагрузка: ${details.intensityLabel}</span>
      </div>
      <p class="today-section-copy">${escapeHtml(details.recoveryNote)}</p>
    </article>
  `;
}

async function saveFirstTask() {
  const draft = buildTaskDraft();
  if (!draft) {
    setStatus("Введи название первой задачи.", true);
    return;
  }

  setStatus("Сохраняю первую задачу...");
  saveTaskButton.disabled = true;

  try {
    const inserted = await insertTask(draft);
    todayTasks = [inserted, ...todayTasks.filter((task) => task.id !== inserted.id)];
    onboardingState = updateOnboardingState(currentUser.id, {
      currentStep: 4,
      taskIds: Array.from(new Set([...(onboardingState?.taskIds || []), inserted.id]))
    });
    renderFocusList();
    showStep(4);
    setStatus("Первая задача готова. Теперь выбери 1–3 задачи фокуса.");
  } catch (error) {
    setStatus(error?.message || "Не удалось сохранить первую задачу.", true);
  } finally {
    saveTaskButton.disabled = false;
  }
}

async function insertTask(draft) {
  let response = await supabase
    .from("tasks")
    .insert({
      user_id: currentUser.id,
      title: draft.title,
      details: draft.details,
      status: draft.status,
      planned_date: draft.planned_date,
      task_type: draft.task_type,
      cognitive_load: draft.cognitive_load,
      emotional_load: draft.emotional_load,
      is_focus: false
    })
    .select("*")
    .single();

  if (response.error && shouldFallbackTasks(response.error)) {
    response = await supabase
      .from("tasks")
      .insert({
        user_id: currentUser.id,
        title: draft.title,
        details: draft.details,
        status: draft.status,
        planned_date: draft.planned_date,
        task_type: draft.task_type,
        cognitive_load: draft.cognitive_load,
        emotional_load: draft.emotional_load,
        is_focus: false
      })
      .select("*")
      .single();
  }

  if (response.error) {
    throw humanizeTaskInsertError(response.error);
  }

  return normalizeTask(response.data);
}

function renderFocusList() {
  if (!focusList) {
    return;
  }

  if (!todayTasks.length) {
    focusList.innerHTML = `
      <div class="onboarding-inline-note">
        Сначала добавь хотя бы одну задачу, чтобы выбрать фокус дня.
      </div>
    `;
    return;
  }

  focusList.innerHTML = todayTasks.map((task) => {
    const checked = selectedFocusIds.has(task.id);
    const details = describeTaskLoad(task);
    return `
      <label class="onboarding-focus-card ${checked ? "is-selected" : ""}">
        <input type="checkbox" value="${escapeHtml(task.id)}" ${checked ? "checked" : ""}>
        <div>
          <strong>${escapeHtml(task.title)}</strong>
          <div class="onboarding-task-preview-meta">
            <span>${escapeHtml(`${details.typeIcon} ${details.typeLabel}`)}</span>
            <span>Когнитивная: ${details.cognitiveLabel}</span>
            <span>Эмоциональная: ${details.emotionalLabel}</span>
            <span>${details.intensityLabel}</span>
          </div>
        </div>
      </label>
    `;
  }).join("");

  focusList.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.addEventListener("change", () => {
      const selectedIds = Array.from(focusList.querySelectorAll('input[type="checkbox"]:checked'))
        .map((item) => item.value);

      if (selectedIds.length > 3) {
        input.checked = false;
        setStatus("Лучше выбрать не больше 3 главных задач, чтобы не перегрузить день.", true);
        return;
      }

      selectedFocusIds = new Set(selectedIds);
      renderFocusList();
    });
  });
}

async function saveFocusSelection() {
  const ids = Array.from(selectedFocusIds);
  if (!ids.length) {
    setStatus("Выбери хотя бы одну задачу фокуса.", true);
    return;
  }

  setStatus("Сохраняю фокус дня...");
  saveFocusButton.disabled = true;

  try {
    const resetResponse = await supabase
      .from("tasks")
      .update({ is_focus: false })
      .eq("user_id", currentUser.id)
      .eq("planned_date", todayIso);

    if (resetResponse.error && !String(resetResponse.error.message || "").toLowerCase().includes("is_focus")) {
      throw resetResponse.error;
    }

    for (const id of ids) {
      const { error } = await supabase
        .from("tasks")
        .update({ is_focus: true })
        .eq("id", id)
        .eq("user_id", currentUser.id);

      if (error && !String(error.message || "").toLowerCase().includes("is_focus")) {
        throw error;
      }
    }

    todayTasks = todayTasks.map((task) => ({
      ...task,
      is_focus: ids.includes(task.id)
    }));

    onboardingState = updateOnboardingState(currentUser.id, {
      currentStep: 5,
      focusTaskIds: ids
    });
    showStep(5);
    setStatus("Фокус дня сохранен. Ниже — первый AI Summary.");
  } catch (error) {
    setStatus(error?.message || "Не удалось сохранить фокус дня.", true);
  } finally {
    saveFocusButton.disabled = false;
  }
}

function renderSummary() {
  const summary = buildSummary();
  summaryLetter.innerHTML = summary.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

function buildSummary() {
  const checkin = {
    checkin_date: todayIso,
    energy_level: Number(energyInput?.value || 6),
    stress_level: Number(stressInput?.value || 4),
    focus_level: Number(focusInput?.value || 6),
    sleep_quality: sleepSelect?.value || "",
    mood: moodSelect?.value || ""
  };
  const activeTasks = todayTasks.filter((task) => String(task.status || "").toLowerCase() !== "done");
  const focusTasks = activeTasks.filter((task) => selectedFocusIds.has(task.id) || task.is_focus).slice(0, 3);
  const energyDebt = summarizeEnergyDebt(calculateEnergyDebtSeries([checkin], activeTasks));
  const readiness = calculateReadinessScore(checkin, activeTasks, energyDebt);
  const loadLevel = calculateDailyLoadLevel(activeTasks);
  const recommendations = generateRuleBasedRecommendations(checkin, activeTasks, { readiness, energyDebt });
  const goalText = selectedGoal ? `Твой главный запрос сейчас — ${selectedGoal.toLowerCase()}.` : "Сейчас мы собираем спокойный и реалистичный ритм дня.";
  const focusLine = focusTasks.length
    ? `Главные задачи дня: ${focusTasks.map((task) => task.title).join(", ")}.`
    : "Фокус дня пока можно уточнить, но лучше оставить не больше трех главных задач.";

  return [
    `${buildGreeting()}. Твой первый Readiness Score — ${readiness.score}/100, статус дня: ${statusTitle(readiness.state)}.`,
    `${goalText} Сегодня лучше работать в режиме ${readiness.mode}.`,
    focusLine,
    `Дневная нагрузка сейчас: ${loadLevel.label.toLowerCase()}. ${loadLevel.note}`,
    recommendations[0] || "Планируй день короткими блоками и не добавляй лишнее.",
    recommendations[1] || "Оставь место для паузы между сложными задачами."
  ];
}

function buildGreeting() {
  const hour = new Date().getHours();
  const name = currentProfile?.full_name?.trim() || "";
  const suffix = name ? `, ${name}` : "";

  if (hour < 12) return `Доброе утро${suffix}`;
  if (hour < 18) return `Добрый день${suffix}`;
  return `Добрый вечер${suffix}`;
}

function statusTitle(state) {
  if (state === "excellent") return "Excellent Day";
  if (state === "stable") return "Stable";
  if (state === "heavy") return "Heavy";
  return "Recovery Needed";
}

function humanizeTaskInsertError(error) {
  const message = String(error?.message || "");
  if (message.includes("project_id")) {
    return new Error("В базе задач еще требуется project_id. Сначала нужно обновить SQL-структуру задач или добавить проект по умолчанию.");
  }
  return error instanceof Error ? error : new Error(message || "Не удалось сохранить задачу.");
}

function shouldFallbackTasks(error) {
  const message = String(error?.message || "").toLowerCase();
  return ["archived_at", "updated_at"].some((part) => message.includes(part));
}

function withMigrationHint(error, tableName) {
  const message = String(error?.message || "");
  if (message.toLowerCase().includes(`could not find the table 'public.${tableName}'`)) {
    return new Error(`Таблица ${tableName} пока не создана в Supabase. Сначала выполни SQL-миграцию для этой таблицы.`);
  }
  return error;
}

function setStatus(message, isError = false) {
  if (!statusBox) {
    return;
  }

  statusBox.textContent = message;
  statusBox.classList.toggle("is-error", isError);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || min));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
