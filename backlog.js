import { getCurrentSession, getSupabase, signOutCurrentUser } from "./auth-helpers.js";
import { landingPath } from "./route-paths.js";
import { createCloudRepository, createFocusRepository, createFocusSaveQueue, createLoadGuard, getInitialWeek, getLegacyEntries, getLegacyFocusDays, mapCloudTask, migrateLegacyEntries, migrateLegacyFocusDays, toIsoBoardDate } from "./cloud-backlog.js";
import { applyTranslations, onLocaleChange, t } from "./i18n.js";
import {
  calculateDailyLoad,
  calculateEnergyDebtSeries,
  calculateTaskIntensity,
  calculateReadinessScore,
  getTaskTypeIcon,
  getTaskTypeLabel,
  normalizeTask,
  summarizeEnergyDebt,
  toIsoDate
} from "./lib/workload.js";

const AUTH_KEY = "scrum-dashboard-auth-user";
let activeUser = window.appStorage.getItem(AUTH_KEY) || "";
const weekSelect = document.getElementById("weekSelect");
const focusTodayPanel = document.getElementById("focusTodayPanel");
const backlogSummary = document.getElementById("backlogSummary");
const backlogBoard = document.getElementById("backlogBoard");
const logoutButton = document.getElementById("logoutButton");

const DAILY_FOCUS_DAY_STORAGE_KEY = "scrum-master-daily-focus-day";
const DAY_PULSE_SNAPSHOT_STORAGE_KEY = "mindpulse-day-pulse-snapshots";
let userBacklogWeekStorageKey = `scrum-master-backlog-week:${activeUser}`;
let userDayPulseSnapshotStorageKey = `${DAY_PULSE_SNAPSHOT_STORAGE_KEY}:${activeUser}`;
const BACKLOG_YEAR = 2026;
const DEFAULT_DAY_PULSE = 70;

const timeline = [
  "09:00", "09:15", "09:30", "09:45",
  "10:00", "10:15", "10:30", "10:45",
  "11:00", "11:15", "11:30", "11:45",
  "12:00", "12:15", "12:30", "12:45",
  "13:00", "13:15", "13:30", "13:45",
  "14:00", "14:15", "14:30", "14:45",
  "15:00", "15:15", "15:30", "15:45"
];

const weekdayNames = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
const monthNames = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

const seededBacklogData = {
  "Неделя 20.04 - 24.04": {
    days: [
      {
        date: "20.04",
        weekday: "Понедельник",
        items: [
          { id: "20-0900", time: "09:00", text: "Написать расписание встреч по планированию", status: "В работе", task_type: "communication", cognitive_load: 3, emotional_load: 3 },
          { id: "20-1430", time: "14:30", text: "Заполнить еженедельный отчет", status: "Сделано", task_type: "routine", cognitive_load: 2, emotional_load: 1 },
          { id: "20-1445", time: "14:45", text: "Подготовиться к встрече завтра с ИТ", status: "Сделано", task_type: "deep_work", cognitive_load: 4, emotional_load: 2 },
          { id: "20-1515", time: "15:15", text: "Дать ОС по сбору ЛМГ", status: "Сделано", task_type: "communication", cognitive_load: 2, emotional_load: 2 }
        ]
      },
      {
        date: "21.04",
        weekday: "Вторник",
        items: [
          { id: "21-0915", time: "09:15", text: "Подготовиться к встрече с ИТ", status: "Сделано", task_type: "deep_work", cognitive_load: 4, emotional_load: 2 },
          { id: "21-0930", time: "09:30", text: "Сделать презентацию для встречи в среду", status: "Сделано", task_type: "creative", cognitive_load: 4, emotional_load: 2 },
          { id: "21-1015", time: "10:15", text: "Перенести данные для викли", status: "Сделано", task_type: "routine", cognitive_load: 2, emotional_load: 1 },
          { id: "21-1045", time: "10:45", text: "Написать минутки после встречи с ИТ", status: "Сделано", task_type: "communication", cognitive_load: 2, emotional_load: 2 }
        ]
      },
      {
        date: "22.04",
        weekday: "Среда",
        items: [
          { id: "22-0915", time: "09:15", text: "Поставить встречу по анализу TTM и LT", status: "Запланировано", task_type: "communication", cognitive_load: 2, emotional_load: 3 },
          { id: "22-0930", time: "09:30", text: "Перенести общие встречи по планированию", status: "Запланировано", task_type: "routine", cognitive_load: 1, emotional_load: 1 },
          { id: "22-1000", time: "10:00", text: "Протестировать календарь Димы", status: "В работе", task_type: "deep_work", cognitive_load: 4, emotional_load: 2 }
        ]
      },
      {
        date: "23.04",
        weekday: "Четверг",
        items: [
          { id: "23-0900", time: "09:00", text: "Проверить бэклог перед планированием", status: "Запланировано", task_type: "routine", cognitive_load: 2, emotional_load: 1 },
          { id: "23-1030", time: "10:30", text: "Подготовить синк по Agile Radar", status: "В работе", task_type: "communication", cognitive_load: 3, emotional_load: 4 },
          { id: "23-1315", time: "13:15", text: "Разобрать блокеры по Jira hygiene", status: "Запланировано", task_type: "deep_work", cognitive_load: 4, emotional_load: 3 }
        ]
      },
      {
        date: "24.04",
        weekday: "Пятница",
        items: [
          { id: "24-0915", time: "09:15", text: "Сверить загрузку команды на цели МП", status: "Запланировано", task_type: "deep_work", cognitive_load: 4, emotional_load: 3 },
          { id: "24-1100", time: "11:00", text: "Подготовить материалы к ретро", status: "Запланировано", task_type: "creative", cognitive_load: 3, emotional_load: 2 },
          { id: "24-1500", time: "15:00", text: "Обновить квартальные метрики", status: "Запланировано", task_type: "routine", cognitive_load: 2, emotional_load: 1 }
        ]
      }
    ]
  }
};

let activeEditorState = null;
let draggedTaskKey = null;
let supabaseClient;
let currentSession;
let cloudRepository;
let focusRepository;
let focusSaveQueue;
let migrationChecked = false;
const focusCache = new Map();
const loadGuard = createLoadGuard();
let focusEditVersion = 0;
let dayPulseCheckins = new Map();
const expandedPulseCards = new Set();
let pulseSnapshots = loadPulseSnapshots();

onLocaleChange(() => {
  applyTranslations(document);
  renderBacklog(weekSelect.value).catch((error) => console.error("Failed to rerender backlog locale", error));
});

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}${date.getFullYear() === BACKLOG_YEAR ? "" : `.${date.getFullYear()}`}`;
}

function loadPulseSnapshots() {
  try {
    return JSON.parse(window.appStorage.getItem(userDayPulseSnapshotStorageKey) || "{}");
  } catch {
    return {};
  }
}

function savePulseSnapshots() {
  window.appStorage.setItem(userDayPulseSnapshotStorageKey, JSON.stringify(pulseSnapshots));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function weekStartValue(label) {
  const match = label.match(/(\d{2})\.(\d{2})/);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const [, day, month] = match;
  const year = Number(/\((\d{4})\)$/.exec(label)?.[1] || BACKLOG_YEAR);
  return new Date(year, Number(month) - 1, Number(day)).getTime();
}

function monthNameForWeek(week) {
  const match = week.match(/(\d{2})\.(\d{2})/);
  if (!match) {
    return "Без месяца";
  }

  const year = /\((\d{4})\)$/.exec(week)?.[1];
  return `${monthNames[Number(match[2]) - 1] || "Без месяца"}${year ? ` ${year}` : ""}`;
}

function shortWeekLabel(week) {
  const match = week.match(/(\d{2}\.\d{2})\s*-\s*(\d{2}\.\d{2})/);
  if (!match) {
    return week;
  }

  const year = /\((\d{4})\)$/.exec(week)?.[1];
  return `${match[1]} - ${match[2]}${year ? ` · ${year}` : ""}`;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function toBacklogIsoDate(value) {
  return toIsoBoardDate(value);
}

function isPastBacklogDate(dateIso) {
  if (!dateIso) return false;
  return dateIso < toIsoDate(new Date());
}

function createEmptyWeek(startDate, endLimit) {
  const days = [];

  for (let offset = 0; offset < 5; offset += 1) {
    const date = addDays(startDate, offset);
    if (date > endLimit || date.getFullYear() !== startDate.getFullYear()) {
      break;
    }

    days.push({
      date: formatDate(date),
      weekday: weekdayNames[date.getDay()],
      items: []
    });
  }

  const endDate = addDays(startDate, days.length - 1);
  const year = startDate.getFullYear();
  const label = `Неделя ${formatDate(startDate).slice(0, 5)} - ${formatDate(endDate).slice(0, 5)}${year === BACKLOG_YEAR ? "" : ` (${year})`}`;

  return {
    [label]: { days }
  };
}

function generateWeeksUntilYearEnd() {
  const generated = {};
  for (let year = BACKLOG_YEAR; year <= Math.max(BACKLOG_YEAR, new Date().getFullYear()); year += 1) {
    const yearEnd = new Date(year, 11, 31);
    const firstDay = year === BACKLOG_YEAR ? new Date(year, 3, 20) : new Date(year, 0, 1);
    let cursor = addDays(firstDay, (8 - firstDay.getDay()) % 7);
    while (cursor <= yearEnd) {
      Object.assign(generated, createEmptyWeek(cursor, yearEnd));
      cursor = addDays(cursor, 7);
    }
  }

  return generated;
}

function mergeWeekData(template, stored) {
  const merged = {};

  Object.entries(template).forEach(([week, value]) => {
    merged[week] = stored?.[week] ? stored[week] : JSON.parse(JSON.stringify(value));
  });

  Object.entries(stored || {}).forEach(([week, value]) => {
    if (!merged[week]) {
      merged[week] = value;
    }
  });

  return merged;
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

function clampLoad(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isFinite(parsed)) {
    return Math.max(1, Math.min(5, parsed));
  }
  return fallback;
}

function fallbackCognitiveLoad(taskType) {
  if (taskType === "deep_work") return 4;
  if (taskType === "communication" || taskType === "creative" || taskType === "learning") return 3;
  if (taskType === "recovery") return 1;
  return 2;
}

function fallbackEmotionalLoad(stress) {
  const value = String(stress || "").toLowerCase();
  if (value.includes("выс") || value.includes("high")) return 5;
  if (value.includes("сред") || value.includes("medium")) return 3;
  if (value.includes("низ") || value.includes("low")) return 2;
  return 2;
}

function normalizeBacklogTaskItem(item, date = "") {
  const taskType = mapLegacyTaskType(item?.task_type || item?.taskType);
  const cognitiveLoad = clampLoad(item?.cognitive_load ?? item?.mentalCost, fallbackCognitiveLoad(taskType));
  const emotionalLoad = clampLoad(item?.emotional_load ?? item?.emotionalCost, fallbackEmotionalLoad(item?.stress));
  const normalized = normalizeTask({
    task_type: taskType,
    cognitive_load: cognitiveLoad,
    emotional_load: emotionalLoad,
    title: item?.title || item?.text || "",
    planned_date: date
  });

  return {
    id: item?.id || `task-${date}-${item?.time || "09:00"}-${Math.random().toString(36).slice(2, 8)}`,
    time: item?.time || "09:00",
    text: item?.text || item?.title || "",
    status: item?.status || "Запланировано",
    task_type: normalized.task_type,
    cognitive_load: normalized.cognitive_load,
    emotional_load: normalized.emotional_load
  };
}

function buildAnalyticsTask(item, date) {
  const normalized = normalizeBacklogTaskItem(item, date);
  return normalizeTask({
    id: normalized.id,
    title: normalized.text,
    task_type: normalized.task_type,
    cognitive_load: normalized.cognitive_load,
    emotional_load: normalized.emotional_load,
    planned_date: toBacklogIsoDate(date),
    completed_at: normalized.status === "Сделано" ? `${toBacklogIsoDate(date)}T18:00:00.000Z` : null,
    status: normalized.status === "Сделано" ? "done" : normalized.status === "В работе" ? "in_progress" : "todo"
  });
}

function normalizeStoredData(template, stored) {
  const merged = mergeWeekData(template, stored);
  Object.values(merged).forEach((week) => {
    week.days.forEach((day) => {
      day.items = (day.items || []).map((item) => normalizeBacklogTaskItem(item, day.date));
    });
  });
  return merged;
}

function parseKey(key) {
  const [week, date, value] = key.split("::");
  return { week, date, value };
}

function makeTaskKey(week, date, id) {
  return `${week}::${date}::${id}`;
}

function makeCreateKey(week, date) {
  return `${week}::${date}::__new__`;
}

function isCreateEditor(key) {
  return activeEditorState?.mode === "create" && activeEditorState.key === key;
}

function isEditEditor(key) {
  return activeEditorState?.mode === "edit" && activeEditorState.key === key;
}

function findDay(week, date) {
  return backlogData[week]?.days.find((entry) => entry.date === date);
}

function findTaskByKey(key) {
  const { week, date, value } = parseKey(key);
  const day = findDay(week, date);
  const task = day?.items.find((entry) => entry.id === value);
  return { week, date, id: value, day, task };
}

function statusSortOrder(status) {
  if (status === "В работе") return 0;
  if (status === "Запланировано") return 1;
  if (status === "Сделано") return 2;
  return 3;
}

function sortDayItems(day) {
  day.items.sort((a, b) => {
    const statusDiff = statusSortOrder(a.status) - statusSortOrder(b.status);
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return timeline.indexOf(a.time) - timeline.indexOf(b.time);
  });
}

function renderTimeOptions(day, selectedTime, originalTime = null) {
  return timeline.map((time) => {
    const occupied = day.items.some((entry) => entry.time === time && entry.time !== originalTime);
    return `<option value="${time}" ${time === selectedTime ? "selected" : ""} ${occupied ? "disabled" : ""}>${time}</option>`;
  }).join("");
}

function getNextAvailableTime(day) {
  return timeline.find((time) => !day.items.some((entry) => entry.time === time)) || timeline[0];
}

const defaultBacklogData = generateWeeksUntilYearEnd();
const backlogData = normalizeStoredData(defaultBacklogData);
const weekNames = Object.keys(backlogData).sort((a, b) => weekStartValue(a) - weekStartValue(b));
const storedWeek = window.appStorage.getItem(userBacklogWeekStorageKey);
const defaultWeek = weekNames.includes(storedWeek) ? storedWeek : getInitialWeek(weekNames);

const weeksByMonth = weekNames.reduce((groups, week) => {
  const month = monthNameForWeek(week);
  if (!groups[month]) {
    groups[month] = [];
  }
  groups[month].push(week);
  return groups;
}, {});

Object.entries(weeksByMonth).forEach(([month, weeks]) => {
  const optgroup = document.createElement("optgroup");
  optgroup.label = month;
  weeks.forEach((week) => {
    const option = document.createElement("option");
    option.value = week;
    option.textContent = shortWeekLabel(week);
    option.selected = week === defaultWeek;
    optgroup.appendChild(option);
  });
  weekSelect.appendChild(optgroup);
});

function focusSelectedDayStorageKey(week) {
  return `${DAILY_FOCUS_DAY_STORAGE_KEY}:${activeUser}:${week}`;
}

function getFocusDays(week) {
  return backlogData[week]?.days || [];
}

function getSelectedFocusDay(week) {
  const days = getFocusDays(week);
  if (!days.length) return "";
  const stored = window.appStorage.getItem(focusSelectedDayStorageKey(week));
  return days.some((day) => day.date === stored) ? stored : days[0].date;
}

function loadDailyFocus(week, date) {
  const fallback = [0, 1, 2].map(() => ({ text: "", done: false }));
  const items = focusCache.get(toBacklogIsoDate(date));
  return items ? [0, 1, 2].map((index) => ({
    text: items[index]?.text || "",
    done: Boolean(items[index]?.done)
  })) : fallback;
}

function saveDailyFocus(week, date, items) {
  const normalized = items.slice(0, 3).map((item) => ({
    text: String(item?.text || "").trim(),
    done: Boolean(item?.done)
  }));
  const focusDate = toBacklogIsoDate(date);
  focusCache.set(focusDate, normalized);
  focusEditVersion += 1;
  return ensurePulseContext().then(() => focusSaveQueue.save({ focus_date: focusDate, items: normalized }));
}

function renderDailyFocus(week = weekSelect.value) {
  if (!focusTodayPanel) return;

  const days = getFocusDays(week);
  const selectedDate = getSelectedFocusDay(week);
  const focusItems = loadDailyFocus(week, selectedDate);

  focusTodayPanel.innerHTML = `
    <div class="daily-focus-header">
      <h3 class="daily-focus-title">${t("plan.todayFocus")}</h3>
    </div>
    <div class="daily-focus-list">
      ${focusItems.map((item, index) => `
        <div class="daily-focus-item ${item.text.trim() ? "" : "is-empty"} ${item.done ? "is-done" : ""}">
          <label class="daily-focus-check">
            <input type="checkbox" ${item.done ? "checked" : ""} data-focus-done="${index}">
            <span></span>
          </label>
          <input class="daily-focus-input" type="text" maxlength="160" value="${escapeHtml(item.text)}" placeholder="${t("plan.focusItemPlaceholder", { index: index + 1 })}" data-focus-input="${index}">
        </div>
      `).join("")}
    </div>
  `;

  const header = focusTodayPanel.querySelector(".daily-focus-header");
  if (header) {
    const daySelectControl = document.createElement("select");
    daySelectControl.className = "daily-focus-select";
    daySelectControl.id = "focusDaySelect";
    daySelectControl.innerHTML = days.map((day) => (
      `<option value="${day.date}" ${day.date === selectedDate ? "selected" : ""}>${day.weekday} · ${day.date}</option>`
    )).join("");
    header.appendChild(daySelectControl);
  }

  const daySelect = document.getElementById("focusDaySelect");
  daySelect?.addEventListener("change", () => {
    window.appStorage.setItem(focusSelectedDayStorageKey(week), daySelect.value);
    renderDailyFocus(week);
  });

  function collectFocusState() {
    return [0, 1, 2].map((index) => {
      const textField = focusTodayPanel.querySelector(`[data-focus-input="${index}"]`);
      const doneField = focusTodayPanel.querySelector(`[data-focus-done="${index}"]`);
      return {
        text: textField?.value.trim() || "",
        done: Boolean(doneField?.checked)
      };
    });
  }

  focusTodayPanel.querySelectorAll("[data-focus-input], [data-focus-done]").forEach((field) => {
    field.addEventListener("change", () => {
      void saveDailyFocus(week, daySelect?.value || selectedDate, collectFocusState())
        .catch((error) => { focusTodayPanel.textContent = error.message; });
      renderDailyFocus(week);
    });
  });
}

function renderBacklogSummary(week) {
  const days = backlogData[week]?.days || [];
  const tasks = days.flatMap((day) => day.items);
  const deepWorkCount = tasks.filter((task) => task.task_type === "deep_work").length;
  const heavyCognitiveCount = tasks.filter((task) => Number(task.cognitive_load || 0) >= 4).length;
  const heavyEmotionalCount = tasks.filter((task) => Number(task.emotional_load || 0) >= 4).length;

  backlogSummary.innerHTML = `
    <div class="analytics-overview-grid analytics-overview-grid-4">
      <article class="analytics-card">
        <p class="analytics-card-label">${t("plan.totalTasks")}</p>
        <strong class="analytics-card-value">${tasks.length}</strong>
        <span class="analytics-card-note">${t("plan.tasksForWeek")}</span>
      </article>
      <article class="analytics-card">
        <p class="analytics-card-label">${t("plan.deepWork")}</p>
        <strong class="analytics-card-value">${deepWorkCount}</strong>
        <span class="analytics-card-note">${t("plan.deepWorkTasks")}</span>
      </article>
      <article class="analytics-card">
        <p class="analytics-card-label">${t("plan.cognitiveHeavy")}</p>
        <strong class="analytics-card-value">${heavyCognitiveCount}</strong>
        <span class="analytics-card-note">${t("plan.cognitiveHeavyTasks")}</span>
      </article>
      <article class="analytics-card">
        <p class="analytics-card-label">${t("plan.emotionalHeavy")}</p>
        <strong class="analytics-card-value">${heavyEmotionalCount}</strong>
        <span class="analytics-card-note">${t("plan.emotionalHeavyTasks")}</span>
      </article>
    </div>
  `;
}

function makeDayPulseKey(week, date) {
  return `${week}::${date}::__pulse__`;
}

function getWeekIsoRange(week) {
  const days = backlogData[week]?.days || [];
  if (!days.length) return null;

  return {
    start: toBacklogIsoDate(days[0].date),
    end: toBacklogIsoDate(days[days.length - 1].date)
  };
}

async function ensurePulseContext() {
  if (cloudRepository) {
    return;
  }

  currentSession = await getCurrentSession();
  supabaseClient = await getSupabase();
  if (!currentSession?.user?.id || !supabaseClient) {
    window.location.replace("login.html");
    throw new Error("Войдите в аккаунт, чтобы открыть план недели.");
  }
  activeUser = currentSession.user.email || currentSession.user.id;
  userBacklogWeekStorageKey = `scrum-master-backlog-week:${activeUser}`;
  userDayPulseSnapshotStorageKey = `${DAY_PULSE_SNAPSHOT_STORAGE_KEY}:${activeUser}`;
  pulseSnapshots = loadPulseSnapshots();
  cloudRepository = createCloudRepository(supabaseClient, currentSession.user.id);
  focusRepository = createFocusRepository(supabaseClient, currentSession.user.id);
  focusSaveQueue = createFocusSaveQueue(focusRepository);
}

async function loadCloudWeek(week) {
  await ensurePulseContext();
  if (!migrationChecked) {
    const demoItems = Object.values(seededBacklogData).flatMap((entry) => entry.days.flatMap((day) => day.items));
    const legacyEntries = getLegacyEntries(window.appStorage, currentSession.user.email, BACKLOG_YEAR, demoItems);
    await migrateLegacyEntries(window.appStorage, currentSession.user.id, legacyEntries, cloudRepository);
    const focusDays = Object.entries(defaultBacklogData).flatMap(([label, value]) =>
      value.days.map((day) => ({ week: label, date: day.date })));
    const legacyFocus = getLegacyFocusDays(window.appStorage, currentSession.user.email, focusDays, BACKLOG_YEAR);
    await migrateLegacyFocusDays(window.appStorage, currentSession.user.id, legacyFocus, focusRepository);
    migrationChecked = true;
  }

  const range = getWeekIsoRange(week);
  if (!range) return { rows: [], focusRows: [], focusVersion: focusEditVersion };
  await focusSaveQueue.settled();
  const focusVersion = focusEditVersion;
  const [rows, focusRows] = await Promise.all([
    cloudRepository.load(range.start, range.end),
    focusRepository.load(range.start, range.end)
  ]);
  return { rows, focusRows, focusVersion };
}

function applyCloudWeek(week, { rows, focusRows, focusVersion }) {
  const days = backlogData[week]?.days || [];
  days.forEach((day) => { day.items = []; });
  (rows || []).forEach((row) => {
    const day = days.find((entry) => toBacklogIsoDate(entry.date) === row.planned_date);
    if (!day) return;
    const task = mapCloudTask(row);
    if (!row.planned_time) task.time = getNextAvailableTime(day);
    day.items.push(task);
  });
  if (focusVersion === focusEditVersion) {
    days.forEach((day) => focusCache.delete(toBacklogIsoDate(day.date)));
    (focusRows || []).forEach((row) => focusCache.set(row.focus_date, row.items));
    renderDailyFocus(week);
  }
}

async function loadDayPulseData(week) {
  await ensurePulseContext();

  if (!supabaseClient || !currentSession?.user?.id) {
    return new Map();
  }

  const range = getWeekIsoRange(week);
  if (!range) {
    return new Map();
  }

  const { data, error } = await supabaseClient
    .from("daily_checkins")
    .select("checkin_date, energy_level, stress_level, focus_level, sleep_quality, mood")
    .eq("user_id", currentSession.user.id)
    .gte("checkin_date", range.start)
    .lte("checkin_date", range.end);

  if (error) {
    console.error("Failed to load backlog day pulse", error);
    return new Map();
  }

  const checkins = new Map();
  (data || []).forEach((item) => {
    checkins.set(toIsoDate(item.checkin_date), item);
  });
  return checkins;
}

function getPulseCardState(percent) {
  if (percent > 100) return "risk";
  if (percent >= 86) return "heavy";
  if (percent >= 61) return "stable";
  return "excellent";
}

function getPulseCardLabel(state) {
  if (state === "risk") return t("workload.loadOverload");
  if (state === "heavy") return t("workload.loadDense");
  if (state === "stable") return t("workload.loadComfort");
  return t("workload.loadBalanced");
}

function getPulseCardHint(metrics) {
  if (metrics.overBy > 0) {
    return t("plan.noteHeavy");
  }

  if (metrics.remaining <= 0) {
    return t("workload.dayCapacityFilled");
  }

  if (metrics.remaining <= 15) {
    return t("plan.noteLightOnly");
  }

  if (metrics.state === "heavy") {
    return t("plan.noteDense");
  }

  if (metrics.state === "stable") {
    return t("workload.dayComfortable");
  }

  return t("workload.dayHasCapacity");
}

function resolveStoredPulse(dateIso, computedPulse) {
  if (!Number.isFinite(computedPulse)) {
    return null;
  }

  const rounded = Math.max(0, Math.min(100, Math.round(computedPulse)));
  if (!isPastBacklogDate(dateIso)) {
    return rounded;
  }

  const saved = Number(pulseSnapshots[dateIso]);
  if (Number.isFinite(saved)) {
    return Math.max(0, Math.min(100, Math.round(saved)));
  }

  pulseSnapshots[dateIso] = rounded;
  savePulseSnapshots();
  return rounded;
}

function buildDayPulseMetricsMap(week, days) {
  const analyticsTasks = days.flatMap((day) => day.items.map((item) => buildAnalyticsTask(item, day.date)));
  const checkins = Array.from(dayPulseCheckins.values()).sort((left, right) => {
    return toIsoDate(left.checkin_date || left.date).localeCompare(toIsoDate(right.checkin_date || right.date));
  });
  const debtSeries = calculateEnergyDebtSeries(checkins, analyticsTasks);
  const debtByDate = new Map();

  debtSeries.forEach((entry, index) => {
    debtByDate.set(entry.date, summarizeEnergyDebt(debtSeries.slice(0, index + 1)));
  });

  return new Map(days.map((day) => {
    const dateIso = toBacklogIsoDate(day.date);
    const tasks = day.items.map((item) => buildAnalyticsTask(item, day.date));
    const loadMetrics = calculateDailyLoad(tasks);
    const checkin = dayPulseCheckins.get(dateIso);
    const computedPulse = checkin
      ? resolveStoredPulse(dateIso, calculateReadinessScore(checkin, tasks, debtByDate.get(dateIso)).score)
      : null;
    const capacity = computedPulse ?? DEFAULT_DAY_PULSE;
    const totalLoad = Math.max(0, Math.round(loadMetrics.total));
    const cognitiveLoad = day.items.reduce((sum, item) => sum + Number(normalizeBacklogTaskItem(item, day.date).cognitive_load || 0), 0);
    const emotionalLoad = day.items.reduce((sum, item) => sum + Number(normalizeBacklogTaskItem(item, day.date).emotional_load || 0), 0);
    const heavyTasks = day.items.filter((item) => {
      const normalized = normalizeBacklogTaskItem(item, day.date);
      return Number(normalized.cognitive_load) >= 4 || Number(normalized.emotional_load) >= 4;
    }).length;
    const percent = capacity > 0 ? Math.round((totalLoad / capacity) * 100) : 0;
    const overBy = Math.max(0, totalLoad - capacity);
    const remaining = Math.max(0, capacity - totalLoad);

    return [day.date, {
      dateIso,
      hasPulse: Number.isFinite(computedPulse),
      pulse: computedPulse,
      capacity,
      totalLoad,
      cognitiveLoad,
      emotionalLoad,
      heavyTasks,
      percent,
      overBy,
      remaining,
      state: getPulseCardState(percent),
      tooltip: Number.isFinite(computedPulse)
        ? t("plan.pulseTooltipAssessed", {
            capacity,
            planned: totalLoad,
            restLine: overBy
              ? t("plan.pulseOverByLine", { value: overBy })
              : t("plan.pulseRemainingLine", { value: remaining })
          })
        : t("plan.pulseTooltipUnassessed", {
            planned: totalLoad,
            capacity
          })
    }];
  }));
}

function renderDayPulseCard(week, day, metrics) {
  const pulseKey = makeDayPulseKey(week, day.date);
  const expanded = expandedPulseCards.has(pulseKey);
  const topLabel = metrics.hasPulse ? `${t("plan.pulse")} ${metrics.pulse}` : t("plan.pulseNotAssessed");
  const summaryLabel = metrics.hasPulse
    ? `${metrics.totalLoad} / ${metrics.capacity}`
    : `${metrics.totalLoad} / ${t("workload.baseCapacityShort", { value: metrics.capacity })}`;

  return `
    <div class="day-pulse-shell" title="${escapeHtml(metrics.tooltip)}">
      <button
        type="button"
        class="day-pulse-card"
        data-day-pulse-toggle="${pulseKey}"
        aria-expanded="${expanded ? "true" : "false"}"
      >
        <div class="day-pulse-top">
          <strong>${topLabel}</strong>
          <span>${metrics.hasPulse ? t("plan.dayAssessed") : t("plan.plan")}</span>
        </div>
        <div class="day-pulse-bar">
          <span data-state="${metrics.state}" style="width:${Math.min(metrics.percent, 100)}%"></span>
        </div>
        <div class="day-pulse-bottom">
          <span>${summaryLabel}</span>
          ${metrics.overBy ? `<span class="day-pulse-over">+${metrics.overBy}</span>` : ""}
        </div>
        <div class="day-pulse-note">${getPulseCardHint(metrics)}</div>
      </button>
      ${expanded ? `
        <div class="day-pulse-details">
          <span>${t("plan.cognitive")}: ${metrics.cognitiveLoad}</span>
          <span>${t("plan.emotional")}: ${metrics.emotionalLoad}</span>
          <span>${t("workload.heavyTasksCount")}: ${metrics.heavyTasks}</span>
        </div>
      ` : ""}
    </div>
  `;
}

function renderTaskEditor(editorKey, day, defaults) {
  return `
    <div class="backlog-slot-cell is-editor">
      <div class="inline-task-editor" data-editor="${editorKey}">
        <input class="inline-task-input" type="text" placeholder="${t("plan.addTaskPlaceholder")}" value="${escapeHtml(defaults.text)}" data-editor-text>
        <div class="inline-task-row ${defaults.hideTime ? "is-single" : ""}">
          ${defaults.hideTime ? "" : `
            <select data-editor-time>
              ${renderTimeOptions(day, defaults.time, defaults.originalTime || defaults.time)}
            </select>
          `}
          <select data-editor-status>
            <option value="Запланировано" ${defaults.status === "Запланировано" ? "selected" : ""}>${t("plan.taskPlanned")}</option>
            <option value="В работе" ${defaults.status === "В работе" ? "selected" : ""}>${t("plan.taskInProgress")}</option>
            <option value="Сделано" ${defaults.status === "Сделано" ? "selected" : ""}>${t("plan.taskDone")}</option>
          </select>
        </div>
        <div class="inline-task-row">
          <select data-editor-task-type>
            <option value="routine" ${defaults.task_type === "routine" ? "selected" : ""}>${t("taskTypes.routine")}</option>
            <option value="deep_work" ${defaults.task_type === "deep_work" ? "selected" : ""}>${t("taskTypes.deep_work")}</option>
            <option value="communication" ${defaults.task_type === "communication" ? "selected" : ""}>${t("taskTypes.communication")}</option>
            <option value="creative" ${defaults.task_type === "creative" ? "selected" : ""}>${t("taskTypes.creative")}</option>
            <option value="learning" ${defaults.task_type === "learning" ? "selected" : ""}>${t("taskTypes.learning")}</option>
            <option value="recovery" ${defaults.task_type === "recovery" ? "selected" : ""}>${t("taskTypes.recovery")}</option>
          </select>
          <select data-editor-cognitive-load>
            ${[1, 2, 3, 4, 5].map((value) => `<option value="${value}" ${defaults.cognitive_load === value ? "selected" : ""}>${t("plan.cognitive")} ${value}/5</option>`).join("")}
          </select>
        </div>
        <div class="inline-task-row">
          <select data-editor-emotional-load>
            ${[1, 2, 3, 4, 5].map((value) => `<option value="${value}" ${defaults.emotional_load === value ? "selected" : ""}>${t("plan.emotional")} ${value}/5</option>`).join("")}
          </select>
        </div>
        <div class="inline-task-actions">
          <button type="button" class="inline-action-button is-primary" data-editor-save="${editorKey}">${t("plan.saveTask")}</button>
          <button type="button" class="inline-action-button" data-editor-cancel="${editorKey}">${t("common.cancel")}</button>
        </div>
      </div>
    </div>
  `;
}

function renderDayCreateArea(week, day) {
  const createKey = makeCreateKey(week, day.date);

  if (isCreateEditor(createKey)) {
    return renderTaskEditor(createKey, day, {
      time: getNextAvailableTime(day),
      text: "",
      status: "Запланировано",
      task_type: "routine",
      cognitive_load: 3,
      emotional_load: 2,
      hideTime: true
    });
  }

  return `<button type="button" class="backlog-day-add-button" data-day-add="${createKey}">${t("plan.addTask")}</button>`;
}

function renderTaskCard(week, day, rawItem) {
  const item = normalizeBacklogTaskItem(rawItem, day.date);
  const taskKey = makeTaskKey(week, day.date, item.id);

  if (isEditEditor(taskKey)) {
    return renderTaskEditor(taskKey, day, {
      time: item.time,
      originalTime: item.time,
      text: item.text,
      status: item.status,
      task_type: item.task_type,
      cognitive_load: item.cognitive_load,
      emotional_load: item.emotional_load
    });
  }

  const intensity = calculateTaskIntensity(item);
  const doneMark = item.status === "Сделано" ? '<span class="task-done-mark" aria-hidden="true">✓</span>' : "";

  return `
    <div class="backlog-slot-cell is-task" draggable="true" tabindex="0" data-task-card="${taskKey}" title="${t("plan.editTask")}">
      <div class="task-card ${item.status === "Сделано" ? "is-done" : ""}">
        ${doneMark}
        <span class="task-drag-hint" aria-hidden="true">::</span>
        <p>${escapeHtml(item.text)}</p>
        <div class="task-card-actions task-card-actions-stacked">
          <div class="task-status-group">
            <span class="task-meta-label">${t("plan.status")}</span>
            <select class="task-status-select ${statusClass(item.status)}" data-task-status="${taskKey}">
              <option value="Запланировано" ${item.status === "Запланировано" ? "selected" : ""}>${t("plan.taskPlanned")}</option>
              <option value="В работе" ${item.status === "В работе" ? "selected" : ""}>${t("plan.taskInProgress")}</option>
              <option value="Сделано" ${item.status === "Сделано" ? "selected" : ""}>${t("plan.taskDone")}</option>
              <option value="__delete__">${t("plan.deleteTask")}</option>
            </select>
          </div>
          <div class="task-meta task-meta-labeled">
            <span class="task-meta-label">${t("plan.taskType")}</span>
            <span class="task-badge">${getTaskTypeIcon(item.task_type)} ${getTaskTypeLabel(item.task_type)}</span>
          </div>
          <div class="task-meta task-meta-labeled">
            <span class="task-meta-label">${t("plan.cognitive")}</span>
            <span class="task-badge">${item.cognitive_load}/5</span>
          </div>
          <div class="task-meta task-meta-labeled">
            <span class="task-meta-label">${t("plan.emotional")}</span>
            <span class="task-badge">${item.emotional_load}/5</span>
          </div>
          <div class="task-meta task-meta-labeled">
            <span class="task-meta-label">${t("plan.overallLoad")}</span>
            <span class="task-badge">${intensity.label}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function statusClass(status) {
  if (status === "Сделано") return "is-done";
  if (status === "В работе") return "is-progress";
  return "is-todo";
}

async function saveEditor(editorKey) {
  const editor = backlogBoard.querySelector(`[data-editor="${editorKey}"]`);
  if (!editor) return;

  const textInput = editor.querySelector("[data-editor-text]");
  const timeSelect = editor.querySelector("[data-editor-time]");
  const statusSelect = editor.querySelector("[data-editor-status]");
  const taskTypeSelect = editor.querySelector("[data-editor-task-type]");
  const cognitiveLoadSelect = editor.querySelector("[data-editor-cognitive-load]");
  const emotionalLoadSelect = editor.querySelector("[data-editor-emotional-load]");
  const text = textInput.value.trim();

  if (!text) {
    textInput.focus();
    return;
  }

  const { week, date, value } = parseKey(editorKey);
  const day = findDay(week, date);
  if (!day) return;

  const selectedTime = timeSelect ? timeSelect.value : getNextAvailableTime(day);
  const status = statusSelect.value === "Сделано" ? "done" : statusSelect.value === "В работе" ? "in_progress" : "todo";
  const payload = {
    title: text,
    planned_date: toBacklogIsoDate(day.date),
    planned_time: selectedTime,
    status,
    task_type: taskTypeSelect.value,
    cognitive_load: Number(cognitiveLoadSelect.value),
    emotional_load: Number(emotionalLoadSelect.value),
    completed_at: status === "done" ? `${toBacklogIsoDate(day.date)}T18:00:00.000Z` : null
  };

  if (activeEditorState?.mode === "edit") {
    const taskIndex = day.items.findIndex((entry) => entry.id === value);
    if (taskIndex < 0) return;

    const hasConflict = day.items.some((entry, index) => entry.time === selectedTime && index !== taskIndex);
    if (hasConflict) {
      timeSelect?.focus();
      return;
    }

    await cloudRepository.updateTask(value, payload);
  } else {
    const hasConflict = day.items.some((entry) => entry.time === selectedTime);
    if (hasConflict) {
      timeSelect?.focus();
      return;
    }
    await cloudRepository.createTask(payload);
  }

  activeEditorState = null;
  await renderBacklog(weekSelect.value);
}

async function deleteTask(taskKey) {
  const { day, id } = findTaskByKey(taskKey);
  if (!day) return;
  await cloudRepository.deleteTask(id);
  activeEditorState = null;
  await renderBacklog(weekSelect.value);
}

async function moveTaskToDay(taskKey, targetDayKey) {
  const { week, date: sourceDate, value: id } = parseKey(taskKey);
  const { date: targetDate } = parseKey(targetDayKey);
  const sourceDay = findDay(week, sourceDate);
  const targetDay = findDay(week, targetDate);
  if (!sourceDay || !targetDay) return false;

  const sourceIndex = sourceDay.items.findIndex((entry) => entry.id === id);
  if (sourceIndex < 0) return false;

  const task = sourceDay.items[sourceIndex];
  const keepTime = !targetDay.items.some((entry) => entry.time === task.time);
  const nextTime = keepTime ? task.time : getNextAvailableTime(targetDay);
  await cloudRepository.updateTask(id, {
    planned_date: toBacklogIsoDate(targetDate),
    planned_time: nextTime,
    completed_at: task.status === "Сделано" ? `${toBacklogIsoDate(targetDate)}T18:00:00.000Z` : null
  });
  return true;
}

async function renderBacklog(week) {
  const renderVersion = loadGuard.start();
  const data = backlogData[week];
  if (!data) return;
  let cloudData;
  let checkins;
  try {
    cloudData = await loadCloudWeek(week);
    checkins = await loadDayPulseData(week);
  } catch (error) {
    if (loadGuard.isCurrent(renderVersion)) {
      backlogBoard.textContent = error?.message || "Не удалось загрузить план недели.";
    }
    console.error("Failed to load cloud backlog", error);
    return;
  }
  if (!loadGuard.isCurrent(renderVersion)) {
    return;
  }
  applyCloudWeek(week, cloudData);
  dayPulseCheckins = checkins;

  const pulseMetricsByDay = buildDayPulseMetricsMap(week, data.days);
  renderBacklogSummary(week);
  backlogBoard.innerHTML = "";

  const table = document.createElement("div");
  table.className = "backlog-table";

  data.days.forEach((day) => {
    sortDayItems(day);

    const column = document.createElement("section");
    column.className = "backlog-day-column";
    column.dataset.dayDrop = makeCreateKey(week, day.date);
    column.innerHTML = `
      <div class="backlog-column-header">
        <div class="backlog-day-title">
          <strong>${day.date}</strong>
          <span>${day.weekday}</span>
        </div>
      </div>
      <div class="backlog-day-list" data-day-drop="${makeCreateKey(week, day.date)}">
        ${renderDayPulseCard(week, day, pulseMetricsByDay.get(day.date))}
        ${renderDayCreateArea(week, day)}
        ${day.items.map((item) => renderTaskCard(week, day, item)).join("")}
      </div>
    `;
    table.appendChild(column);
  });

  backlogBoard.appendChild(table);
  bindBoardActions();

  const activeInput = backlogBoard.querySelector("[data-editor-text]");
  if (activeInput) {
    activeInput.focus();
    activeInput.setSelectionRange(activeInput.value.length, activeInput.value.length);
  }
}

function bindBoardActions() {
  backlogBoard.querySelectorAll("[data-task-card]").forEach((card) => {
    const openEditor = () => {
      activeEditorState = { mode: "edit", key: card.dataset.taskCard };
      void renderBacklog(weekSelect.value);
    };
    card.addEventListener("dblclick", (event) => {
      if (event.target.closest("select, button, input, a")) return;
      openEditor();
    });
    card.addEventListener("keydown", (event) => {
      if (event.target === card && event.key === "Enter") {
        event.preventDefault();
        openEditor();
      }
    });
    card.addEventListener("mousedown", () => {
      card.setAttribute("draggable", "true");
    });

    card.addEventListener("dragstart", (event) => {
      if (event.target.closest("select") || event.target.closest("button")) {
        event.preventDefault();
        return;
      }

      draggedTaskKey = card.dataset.taskCard;
      card.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedTaskKey);
    });

    card.addEventListener("dragend", () => {
      draggedTaskKey = null;
      card.classList.remove("is-dragging");
      backlogBoard.querySelectorAll(".is-drop-target").forEach((element) => {
        element.classList.remove("is-drop-target");
      });
    });
  });

  backlogBoard.querySelectorAll("[data-day-add]").forEach((button) => {
    button.addEventListener("click", () => {
      activeEditorState = { mode: "create", key: button.dataset.dayAdd };
      void renderBacklog(weekSelect.value);
      backlogBoard.querySelector("[data-editor-text]")?.focus();
    });
  });

  function bindDropZone(element) {
    element.addEventListener("dragover", (event) => {
      if (!draggedTaskKey) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });

    element.addEventListener("dragenter", (event) => {
      if (!draggedTaskKey) return;
      event.preventDefault();
      element.classList.add("is-drop-target");
    });

    element.addEventListener("dragleave", (event) => {
      if (event.relatedTarget && element.contains(event.relatedTarget)) return;
      element.classList.remove("is-drop-target");
    });

    element.addEventListener("drop", (event) => {
      if (!draggedTaskKey) return;
      event.preventDefault();
      const moved = moveTaskToDay(draggedTaskKey, element.dataset.dayDrop);
      draggedTaskKey = null;
      activeEditorState = null;
      void moved.then((didMove) => didMove && renderBacklog(weekSelect.value))
        .catch((error) => { backlogBoard.textContent = error.message; });
    });
  }

  backlogBoard.querySelectorAll(".backlog-day-column, [data-day-drop]").forEach(bindDropZone);

  backlogBoard.querySelectorAll("[data-editor-cancel]").forEach((button) => {
    button.addEventListener("click", () => {
      activeEditorState = null;
      void renderBacklog(weekSelect.value);
    });
  });

  backlogBoard.querySelectorAll("[data-editor-save]").forEach((button) => {
    button.addEventListener("click", () => {
      void saveEditor(button.dataset.editorSave).catch((error) => { backlogBoard.textContent = error.message; });
    });
  });

  backlogBoard.querySelectorAll("[data-task-status]").forEach((select) => {
    select.addEventListener("change", () => {
      const taskKey = select.dataset.taskStatus;

      if (select.value === "__delete__") {
        void deleteTask(taskKey).catch((error) => { backlogBoard.textContent = error.message; });
        return;
      }

      const { task } = findTaskByKey(taskKey);
      if (!task) return;
      const status = select.value === "Сделано" ? "done" : select.value === "В работе" ? "in_progress" : "todo";
      const plannedDate = toBacklogIsoDate(parseKey(taskKey).date);
      void cloudRepository.updateTask(task.id, {
        status,
        completed_at: status === "done" ? `${plannedDate}T18:00:00.000Z` : null
      }).then(() => renderBacklog(weekSelect.value))
        .catch((error) => { backlogBoard.textContent = error.message; });
    });
  });

  backlogBoard.querySelectorAll("[data-day-pulse-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.dayPulseToggle;
      if (expandedPulseCards.has(key)) {
        expandedPulseCards.delete(key);
      } else {
        expandedPulseCards.add(key);
      }
      void renderBacklog(weekSelect.value);
    });
  });
}

weekSelect.addEventListener("change", (event) => {
  activeEditorState = null;
  draggedTaskKey = null;
  window.appStorage.setItem(userBacklogWeekStorageKey, event.target.value);
  renderDailyFocus(event.target.value);
  void renderBacklog(event.target.value);
});

logoutButton?.addEventListener("click", async () => {
  await signOutCurrentUser().catch(() => null);
  window.appStorage.removeItem(AUTH_KEY);
  window.location.replace(landingPath());
});

renderDailyFocus(defaultWeek);
void renderBacklog(defaultWeek);
