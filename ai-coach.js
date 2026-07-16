import { requireAuth, signOutCurrentUser } from "./auth-helpers.js";
import { getCurrentProfile, getSupabase } from "./supabase-client.js";
import { landingPath, loginPath } from "./route-paths.js";
import { getCurrentPlan, isProPlan } from "./pricing-helpers.js";
import { fetchCoachStatus, requestCoachResponse } from "./ai-service.js";
import {
  buildAiContext,
  buildRuleBasedCoachResponse,
  endOfWeekIso,
  startOfWeekIso,
  toIsoDate
} from "./mindpulse-ai-core.js";
import { normalizeTask, getTaskTypeLabel, calculateTaskLoad } from "./lib/workload.js";

const todayIso = toIsoDate(new Date());
const weekStartIso = startOfWeekIso(new Date());
const weekEndIso = endOfWeekIso(new Date());

const logoutButton = document.getElementById("aiCoachLogoutButton");
const pageStatus = document.getElementById("aiCoachPageStatus");
const planBadgeBox = document.getElementById("aiCoachPlanBadge");
const usageLabelBox = document.getElementById("aiCoachUsageLabel");
const greetingBox = document.getElementById("aiCoachGreeting");
const introBox = document.getElementById("aiCoachIntro");
const readinessScoreBox = document.getElementById("aiCoachReadinessScore");
const readinessStatusBox = document.getElementById("aiCoachReadinessStatus");
const readinessNoteBox = document.getElementById("aiCoachReadinessNote");
const debtValueBox = document.getElementById("aiCoachEnergyDebtValue");
const debtStatusBox = document.getElementById("aiCoachEnergyDebtStatus");
const debtNoteBox = document.getElementById("aiCoachEnergyDebtNote");
const responseTitleBox = document.getElementById("aiCoachResponseTitle");
const responseBox = document.getElementById("aiCoachResponse");
const todayTasksCountBox = document.getElementById("aiCoachTodayTasksCount");
const todayModeBox = document.getElementById("aiCoachTodayMode");
const heavyDaysCountBox = document.getElementById("aiCoachHeavyDaysCount");
const heavyDaysNoteBox = document.getElementById("aiCoachHeavyDaysNote");
const topTaskTypeBox = document.getElementById("aiCoachTopTaskType");
const topTaskNoteBox = document.getElementById("aiCoachTopTaskNote");
const actionButtons = Array.from(document.querySelectorAll("[data-action]"));

let supabase;
let currentUser;
let currentProfile;
let currentPlan = "free";
let coachStatus = null;
let coachContext = null;
let selectedAction = "plan-day";

bootstrap();

logoutButton?.addEventListener("click", async () => {
  await signOutCurrentUser().catch(() => null);
  window.location.replace(landingPath());
});

actionButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    selectedAction = button.dataset.action || "plan-day";
    actionButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    await renderCoachResponse();
  });
});

async function bootstrap() {
  currentUser = await requireAuth({ redirectTo: loginPath() });
  if (!currentUser) {
    return;
  }

  supabase = await getSupabase();
  currentPlan = await getCurrentPlan().catch(() => "free");
  currentProfile = await getCurrentProfile().catch(() => null);
  coachStatus = await fetchCoachStatus().catch(() => null);
  renderPlanState();
  setStatus("Собираю рекомендации AI Coach...");

  try {
    const [todayCheckin, weekCheckins, weekTasks] = await Promise.all([
      fetchTodayCheckin(),
      fetchWeekCheckins(),
      fetchWeekTasks()
    ]);

    coachContext = buildAiContext({
      periodStart: weekStartIso,
      periodEnd: weekEndIso,
      todayIso,
      checkins: [todayCheckin, ...weekCheckins].filter(Boolean),
      tasks: weekTasks
    });

    renderCoachHero();
    renderCoachContext();
    await renderCoachResponse();
    setStatus("");
  } catch (error) {
    console.error("AI Coach bootstrap failed:", error);
    setStatus(error.message || "Не удалось загрузить AI Coach.", true);
    responseTitleBox.textContent = "AI Coach";
    responseBox.innerHTML = "<p>Не удалось собрать рекомендации. Проверьте, что задачи и check-in доступны.</p>";
  }
}

function renderPlanState() {
  const pro = isProPlan(currentPlan);
  const usage = coachStatus?.usage || null;

  if (planBadgeBox) {
    planBadgeBox.textContent = pro ? "Pro AI" : "Free Coach";
    planBadgeBox.dataset.state = pro ? "excellent" : "stable";
  }

  if (usageLabelBox) {
    usageLabelBox.textContent = pro && usage
      ? `AI-запросы: ${usage.usedRequests} / ${usage.limit} в этом месяце`
      : "Базовые рекомендации на основе задач и состояния";
  }
}

async function fetchTodayCheckin() {
  const { data, error } = await supabase
    .from("daily_checkins")
    .select("checkin_date, energy_level, stress_level, focus_level, sleep_quality, mood")
    .eq("user_id", currentUser.id)
    .eq("checkin_date", todayIso)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

async function fetchWeekCheckins() {
  const { data, error } = await supabase
    .from("daily_checkins")
    .select("checkin_date, energy_level, stress_level, focus_level, sleep_quality, mood")
    .eq("user_id", currentUser.id)
    .gte("checkin_date", weekStartIso)
    .lte("checkin_date", weekEndIso)
    .order("checkin_date", { ascending: true });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data : [];
}

async function fetchWeekTasks() {
  let response = await supabase
    .from("tasks")
    .select("id, title, details, status, planned_date, task_type, cognitive_load, emotional_load, is_focus, completed_at, archived_at, updated_at")
    .eq("user_id", currentUser.id)
    .gte("planned_date", weekStartIso)
    .lte("planned_date", weekEndIso)
    .is("archived_at", null)
    .order("planned_date", { ascending: true })
    .order("updated_at", { ascending: false });

  if (response.error && shouldFallbackTasks(response.error)) {
    response = await supabase
      .from("tasks")
      .select("id, title, details, status, planned_date, completed_at")
      .eq("user_id", currentUser.id)
      .gte("planned_date", weekStartIso)
      .lte("planned_date", weekEndIso)
      .order("planned_date", { ascending: true })
      .limit(120);
  }

  if (response.error) {
    throw response.error;
  }

  const supabaseTasks = normalizeSupabaseTasks(Array.isArray(response.data) ? response.data : []);
  const backlogTasks = loadBacklogTasksForRange(weekStartIso, weekEndIso);
  return mergeTasks(supabaseTasks, backlogTasks);
}

function renderCoachHero() {
  if (!coachContext) {
    return;
  }

  const name = currentProfile?.full_name?.trim();
  const today = coachContext.today;
  const readiness = today?.readiness;
  const debt = coachContext.energyDebt;
  const pro = isProPlan(currentPlan);

  greetingBox.textContent = name ? `AI Coach для ${name}` : "AI Coach помогает собрать реалистичный день";
  introBox.textContent = pro
    ? "Глубокий AI-анализ использует агрегированные данные недели и ищет повторяющиеся паттерны перегруза."
    : "Free Coach работает локально: без внешнего AI, только на основе задач, состояния, Readiness Score и Energy Debt.";

  readinessScoreBox.textContent = String(readiness?.score ?? 0);
  readinessStatusBox.textContent = readiness?.label || "Stable";
  readinessStatusBox.dataset.state = readiness?.state || "stable";
  readinessNoteBox.textContent = readiness?.note || "Оценка дня появится после check-in и задач.";

  debtValueBox.textContent = String(debt?.value ?? 0);
  debtStatusBox.textContent = debt?.label || "Healthy";
  debtStatusBox.dataset.state = debt?.state || "excellent";
  debtNoteBox.textContent = debt?.note || "Energy Debt появится после нескольких дней использования.";
}

function renderCoachContext() {
  if (!coachContext) {
    return;
  }

  const today = coachContext.today;
  const todayTasks = today?.tasks || [];
  const heavyDays = coachContext.overloadedDays || [];
  const topTask = coachContext.topHeavyTasks?.[0] || null;

  todayTasksCountBox.textContent = `${todayTasks.length} ${pluralizeTasks(todayTasks.length)}`;
  todayModeBox.textContent = today?.readiness?.mode
    ? `Лучший режим на сегодня: ${today.readiness.mode}.`
    : "Сначала добавьте задачи и заполните состояние дня.";

  heavyDaysCountBox.textContent = String(heavyDays.length);
  heavyDaysNoteBox.textContent = heavyDays.length
    ? `На этой неделе самые тяжелые дни пришлись на ${heavyDays.slice(0, 2).map((day) => weekdayLabel(day.date).toLowerCase()).join(" и ")}.`
    : "Пока неделя выглядит достаточно устойчиво.";

  topTaskTypeBox.textContent = topTask?.title || "—";
  topTaskNoteBox.textContent = topTask
    ? `${getTaskTypeLabel(topTask.task_type)} • нагрузка ${Math.round(calculateTaskLoad(topTask))}`
    : "Появится после анализа нескольких задач.";
}

async function renderCoachResponse() {
  if (!coachContext) {
    return;
  }

  responseTitleBox.textContent = actionLabel(selectedAction);
  responseBox.innerHTML = "<p>Собираю ответ...</p>";

  const localResponse = buildRuleBasedCoachResponse(selectedAction, coachContext);

  if (!isProPlan(currentPlan)) {
    renderResponse(localResponse, "Free Coach");
    return;
  }

  const remote = await requestCoachResponse({
    action: selectedAction,
    periodStart: weekStartIso,
    periodEnd: weekEndIso,
    todayIso
  }).catch(() => null);

  if (!remote?.response) {
    renderResponse(localResponse, "Fallback");
    return;
  }

  coachStatus = remote;
  renderPlanState();
  renderResponse(remote.response, remote.source === "openai" ? "Pro AI" : "Rule-based fallback");
}

function renderResponse(payload, sourceLabel = "") {
  const paragraphs = Array.isArray(payload?.paragraphs) ? payload.paragraphs : [];
  const points = Array.isArray(payload?.points) ? payload.points : [];

  responseTitleBox.textContent = payload?.title || actionLabel(selectedAction);
  responseBox.innerHTML = `
    ${sourceLabel ? `<p><strong>${escapeHtml(sourceLabel)}</strong></p>` : ""}
    ${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    ${points.length ? `<ul>${points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>` : ""}
  `;
}

function normalizeSupabaseTasks(tasks) {
  return tasks
    .filter((task) => task?.planned_date)
    .map((task) => normalizeTask(task));
}

function loadBacklogTasksForRange(startIso, endIso) {
  const activeUser = window.appStorage?.getItem("scrum-dashboard-auth-user");
  if (!activeUser) {
    return [];
  }

  const storageKeys = [`scrum-master-backlog-data:${activeUser}`, "scrum-master-backlog-data"];
  for (const key of storageKeys) {
    const raw = window.appStorage?.getItem(key);
    if (!raw) {
      continue;
    }

    try {
      return normalizeBacklogTasks(JSON.parse(raw), startIso, endIso);
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeBacklogTasks(backlogData, startIso, endIso) {
  if (!backlogData || typeof backlogData !== "object") {
    return [];
  }

  const tasks = [];
  Object.values(backlogData).forEach((week) => {
    const days = Array.isArray(week?.days) ? week.days : [];
    days.forEach((day, dayIndex) => {
      const plannedDate = backlogDateToIso(day?.date);
      if (!plannedDate || plannedDate < startIso || plannedDate > endIso) {
        return;
      }

      const items = Array.isArray(day?.items) ? day.items : [];
      items.forEach((item, itemIndex) => {
        tasks.push(normalizeTask({
          id: item?.id || `backlog-${plannedDate}-${dayIndex}-${itemIndex}`,
          title: item?.text || "Задача",
          details: "",
          status: mapBacklogStatus(item?.status),
          planned_date: plannedDate,
          task_type: item?.taskType || "routine",
          cognitive_load: item?.cognitive_load ?? item?.mentalCost ?? mapLegacyTaskTypeToCognitiveLoad(item?.taskType),
          emotional_load: item?.emotional_load ?? item?.emotionalCost ?? mapLegacyStressToEmotionalLoad(item?.stress),
          is_focus: false,
          completed_at: mapBacklogStatus(item?.status) === "done" ? `${plannedDate}T18:00:00.000Z` : null
        }));
      });
    });
  });

  return tasks;
}

function mergeTasks(primaryTasks, secondaryTasks) {
  const merged = new Map();
  [...secondaryTasks, ...primaryTasks].forEach((task) => {
    const key = [task.id, task.planned_date, task.status, task.title || ""].join("::");
    merged.set(key, task);
  });

  return Array.from(merged.values()).sort((left, right) => String(left.planned_date || "").localeCompare(String(right.planned_date || "")));
}

function shouldFallbackTasks(error) {
  const message = String(error?.message || "");
  return ["updated_at", "archived_at", "task_type", "cognitive_load", "emotional_load"].some((field) => message.includes(field));
}

function actionLabel(action) {
  if (action === "move") return "Что лучше перенести?";
  if (action === "why-tired") return "Почему я устал?";
  if (action === "reduce-load") return "Как снизить нагрузку сегодня?";
  if (action === "weekly-review") return "Weekly Review";
  return "Составь план дня";
}

function weekdayLabel(isoDate) {
  return new Date(isoDate).toLocaleDateString("ru-RU", { weekday: "long" }).replace(/^./, (char) => char.toUpperCase());
}

function pluralizeTasks(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "задача";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "задачи";
  return "задач";
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
  if (status === "Сделано") return "done";
  if (status === "В работе") return "in_progress";
  return "todo";
}

function mapLegacyStressToEmotionalLoad(stress) {
  if (stress === "Высокий") return 5;
  if (stress === "Средний") return 3;
  if (stress === "Низкий") return 2;
  return 2;
}

function mapLegacyTaskTypeToCognitiveLoad(taskType) {
  const normalized = String(taskType || "").toLowerCase();
  if (normalized.includes("deep")) return 5;
  if (normalized.includes("creative")) return 4;
  if (normalized.includes("learn")) return 4;
  if (normalized.includes("meeting") || normalized.includes("commun")) return 3;
  if (normalized.includes("recover")) return 1;
  return 3;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setStatus(message, isError = false) {
  if (!pageStatus) {
    return;
  }

  pageStatus.hidden = !message;
  pageStatus.textContent = message;
  pageStatus.classList.toggle("is-error", Boolean(isError));
}
