import { requireAuth, signOutCurrentUser } from "./auth-helpers.js";
import { getCurrentProfile, getSupabase } from "./supabase-client.js";
import { landingPath, loginPath } from "./route-paths.js";
import {
  calculateDailyLoadLevel,
  calculateEnergyDebtSeries,
  calculateReadinessScore,
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

const pageStatus = document.getElementById("todayPageStatus");
const logoutButton = document.getElementById("todayLogoutButton");

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

let supabase;
let currentUser;
let currentProfile;
let todayCheckin = null;
let todayTasks = [];
let recentCheckins = [];
let recentTasks = [];

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

  [energyInput, stressInput, focusInput].forEach((input) => {
    input?.addEventListener("input", () => {
      syncRangeOutputs();
      renderTodayView();
    });
  });

  sleepSelect?.addEventListener("change", renderTodayView);
  moodSelect?.addEventListener("change", renderTodayView);
}

async function bootstrap() {
  currentUser = await requireAuth({ redirectTo: loginPath() });
  if (!currentUser) {
    return;
  }

  supabase = await getSupabase();
  currentProfile = await getCurrentProfile().catch(() => null);
  syncRangeOutputs();

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
  const checkinState = buildCheckinFromForm();
  const activeTasks = todayTasks.filter((task) => !isDone(task));
  const debtSeries = calculateEnergyDebtSeries(recentCheckins, recentTasks);
  const energyDebt = summarizeEnergyDebt(debtSeries);
  const readiness = calculateReadinessScore(checkinState, activeTasks, energyDebt);
  renderCapacity(readiness, energyDebt);
}

function renderCapacity(readiness, energyDebt) {
  const safeReadiness = readiness || calculateReadinessScore(buildCheckinFromForm(), [], summarizeEnergyDebt([]));
  const safeDebt = energyDebt || summarizeEnergyDebt([]);
  const loadLevel = safeReadiness.dailyLoadLevel || calculateDailyLoadLevel(todayTasks.filter((task) => !isDone(task)));

  if (capacityPercent) {
    capacityPercent.textContent = String(safeReadiness.score ?? 0);
  }

  if (capacityLabel) {
    capacityLabel.textContent = safeReadiness.label || "Стабильное состояние";
    capacityLabel.dataset.state = safeReadiness.state || "stable";
  }

  if (capacityBar) {
    const score = Number(safeReadiness.score ?? 0);
    capacityBar.style.width = `${Math.max(0, Math.min(100, score))}%`;
    capacityBar.dataset.state = safeReadiness.state || "stable";
  }

  if (capacityNote) {
    const parts = [
      safeReadiness.note,
      loadLevel?.note
    ].filter(Boolean);
    capacityNote.textContent = parts.join(" ");
  }

  if (energyDebtValue) {
    energyDebtValue.textContent = String(safeDebt.value ?? 0);
  }

  if (energyDebtStatus) {
    energyDebtStatus.textContent = safeDebt.label || "Устойчивый ритм";
    energyDebtStatus.dataset.state = mapDebtStateToBadgeState(safeDebt.state);
  }

  if (energyDebtNote) {
    energyDebtNote.textContent = safeDebt.note || "Метрика появится после нескольких дней использования.";
  }

  if (capacityMode) {
    capacityMode.textContent = safeReadiness.mode || "Light Tasks";
  }
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

function mapDebtStateToBadgeState(state) {
  if (state === "healthy") return "excellent";
  if (state === "watch") return "stable";
  if (state === "fatigue") return "heavy";
  if (state === "high" || state === "overloaded") return "risk";
  return "stable";
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

function shouldFallbackTasks(error) {
  const message = String(error?.message || "").toLowerCase();
  return ["archived_at", "updated_at"].some((field) => message.includes(field));
}

function isDone(task) {
  return task.status === "done" || Boolean(task.completed_at);
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

