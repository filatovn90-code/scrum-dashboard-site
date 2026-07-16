import { signOutCurrentUser } from "./auth-helpers.js";
import { landingPath } from "./route-paths.js";
import {
  calculateTaskIntensity,
  getTaskTypeIcon,
  getTaskTypeLabel,
  normalizeTask
} from "./lib/workload.js";

const AUTH_KEY = "scrum-dashboard-auth-user";

if (!window.appStorage.getItem(AUTH_KEY)) {
  window.location.replace("index.html");
}

const activeUser = window.appStorage.getItem(AUTH_KEY);
const weekSelect = document.getElementById("weekSelect");
const focusTodayPanel = document.getElementById("focusTodayPanel");
const backlogSummary = document.getElementById("backlogSummary");
const backlogBoard = document.getElementById("backlogBoard");
const logoutButton = document.getElementById("logoutButton");

const BACKLOG_STORAGE_KEY = "scrum-master-backlog-data";
const DAILY_FOCUS_STORAGE_KEY = "scrum-master-daily-focus";
const DAILY_FOCUS_DAY_STORAGE_KEY = "scrum-master-daily-focus-day";
const userBacklogStorageKey = `${BACKLOG_STORAGE_KEY}:${activeUser}`;
const userBacklogWeekStorageKey = `scrum-master-backlog-week:${activeUser}`;
const BACKLOG_YEAR = 2026;

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

injectAiCoachLink();

function injectAiCoachLink() {
  const nav = document.querySelector(".site-nav");
  if (!nav || nav.querySelector('[href="ai-coach.html"]')) {
    return;
  }

  const link = document.createElement("a");
  link.className = "nav-link";
  link.href = "ai-coach.html";
  link.textContent = "AI Coach";
  nav.insertBefore(link, nav.children[1] || null);
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
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
  return new Date(BACKLOG_YEAR, Number(month) - 1, Number(day)).getTime();
}

function monthNameForWeek(week) {
  const match = week.match(/(\d{2})\.(\d{2})/);
  if (!match) {
    return "Без месяца";
  }

  return monthNames[Number(match[2]) - 1] || "Без месяца";
}

function shortWeekLabel(week) {
  const match = week.match(/(\d{2}\.\d{2})\s*-\s*(\d{2}\.\d{2})/);
  if (!match) {
    return week;
  }

  return `${match[1]} - ${match[2]}`;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function createEmptyWeek(startDate, endLimit) {
  const days = [];

  for (let offset = 0; offset < 5; offset += 1) {
    const date = addDays(startDate, offset);
    if (date > endLimit || date.getFullYear() !== BACKLOG_YEAR) {
      break;
    }

    days.push({
      date: formatDate(date),
      weekday: weekdayNames[date.getDay()],
      items: []
    });
  }

  const endDate = addDays(startDate, days.length - 1);
  const label = `Неделя ${formatDate(startDate)} - ${formatDate(endDate)}`;

  return {
    [label]: { days }
  };
}

function generateWeeksUntilYearEnd() {
  const generated = {};
  const seededStart = new Date(BACKLOG_YEAR, 3, 20);
  const yearEnd = new Date(BACKLOG_YEAR, 11, 31);
  let cursor = new Date(seededStart);

  while (cursor <= yearEnd) {
    Object.assign(generated, createEmptyWeek(cursor, yearEnd));
    cursor = addDays(cursor, 7);
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

function normalizeStoredData(template, stored) {
  const merged = mergeWeekData(template, stored);
  Object.values(merged).forEach((week) => {
    week.days.forEach((day) => {
      day.items = (day.items || []).map((item) => normalizeBacklogTaskItem(item, day.date));
    });
  });
  return merged;
}

function loadBacklogData(template) {
  const raw = window.appStorage.getItem(userBacklogStorageKey);
  const legacyRaw = window.appStorage.getItem(BACKLOG_STORAGE_KEY);

  if (!raw && legacyRaw) {
    try {
      window.appStorage.setItem(userBacklogStorageKey, legacyRaw);
    } catch {
      // noop
    }
  }

  const resolvedRaw = raw || legacyRaw;
  if (!resolvedRaw) {
    return normalizeStoredData(template);
  }

  try {
    return normalizeStoredData(template, JSON.parse(resolvedRaw));
  } catch {
    return normalizeStoredData(template);
  }
}

function saveBacklogData() {
  window.appStorage.setItem(userBacklogStorageKey, JSON.stringify(backlogData));
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

const defaultBacklogData = mergeWeekData(generateWeeksUntilYearEnd(), seededBacklogData);
const backlogData = loadBacklogData(defaultBacklogData);
const weekNames = Object.keys(backlogData).sort((a, b) => weekStartValue(a) - weekStartValue(b));
const storedWeek = window.appStorage.getItem(userBacklogWeekStorageKey);
const defaultWeek = weekNames.includes(storedWeek) ? storedWeek : weekNames[0];

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

function focusStorageKey(week, date) {
  return `${DAILY_FOCUS_STORAGE_KEY}:${activeUser}:${week}:${date}`;
}

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
  const raw = window.appStorage.getItem(focusStorageKey(week, date));
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return [0, 1, 2].map((index) => ({
      text: parsed[index]?.text || "",
      done: Boolean(parsed[index]?.done)
    }));
  } catch {
    return fallback;
  }
}

function saveDailyFocus(week, date, items) {
  const normalized = items.slice(0, 3).map((item) => ({
    text: String(item?.text || "").trim(),
    done: Boolean(item?.done)
  }));
  window.appStorage.setItem(focusStorageKey(week, date), JSON.stringify(normalized));
}

function renderDailyFocus(week = weekSelect.value) {
  if (!focusTodayPanel) return;

  const days = getFocusDays(week);
  const selectedDate = getSelectedFocusDay(week);
  const focusItems = loadDailyFocus(week, selectedDate);

  focusTodayPanel.innerHTML = `
    <div class="daily-focus-header">
      <h3 class="daily-focus-title">Фокус на сегодня</h3>
    </div>
    <div class="daily-focus-list">
      ${focusItems.map((item, index) => `
        <div class="daily-focus-item ${item.text.trim() ? "" : "is-empty"} ${item.done ? "is-done" : ""}">
          <label class="daily-focus-check">
            <input type="checkbox" ${item.done ? "checked" : ""} data-focus-done="${index}">
            <span></span>
          </label>
          <input class="daily-focus-input" type="text" maxlength="160" value="${escapeHtml(item.text)}" placeholder="Пункт ${index + 1}" data-focus-input="${index}">
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
      saveDailyFocus(week, daySelect?.value || selectedDate, collectFocusState());
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
        <p class="analytics-card-label">Всего задач</p>
        <strong class="analytics-card-value">${tasks.length}</strong>
        <span class="analytics-card-note">На выбранную неделю</span>
      </article>
      <article class="analytics-card">
        <p class="analytics-card-label">Deep Work</p>
        <strong class="analytics-card-value">${deepWorkCount}</strong>
        <span class="analytics-card-note">Задачи глубокой концентрации</span>
      </article>
      <article class="analytics-card">
        <p class="analytics-card-label">Когнитивно тяжелые</p>
        <strong class="analytics-card-value">${heavyCognitiveCount}</strong>
        <span class="analytics-card-note">С нагрузкой 4/5 и выше</span>
      </article>
      <article class="analytics-card">
        <p class="analytics-card-label">Эмоционально тяжелые</p>
        <strong class="analytics-card-value">${heavyEmotionalCount}</strong>
        <span class="analytics-card-note">С нагрузкой 4/5 и выше</span>
      </article>
    </div>
  `;
}

function renderTaskEditor(editorKey, day, defaults) {
  return `
    <div class="backlog-slot-cell is-editor">
      <div class="inline-task-editor" data-editor="${editorKey}">
        <input class="inline-task-input" type="text" placeholder="Задача" value="${escapeHtml(defaults.text)}" data-editor-text>
        <div class="inline-task-row ${defaults.hideTime ? "is-single" : ""}">
          ${defaults.hideTime ? "" : `
            <select data-editor-time>
              ${renderTimeOptions(day, defaults.time, defaults.originalTime || defaults.time)}
            </select>
          `}
          <select data-editor-status>
            <option value="Запланировано" ${defaults.status === "Запланировано" ? "selected" : ""}>Запланировано</option>
            <option value="В работе" ${defaults.status === "В работе" ? "selected" : ""}>В работе</option>
            <option value="Сделано" ${defaults.status === "Сделано" ? "selected" : ""}>Сделано</option>
          </select>
        </div>
        <div class="inline-task-row">
          <select data-editor-task-type>
            <option value="routine" ${defaults.task_type === "routine" ? "selected" : ""}>Рутина</option>
            <option value="deep_work" ${defaults.task_type === "deep_work" ? "selected" : ""}>Deep Work</option>
            <option value="communication" ${defaults.task_type === "communication" ? "selected" : ""}>Коммуникация</option>
            <option value="creative" ${defaults.task_type === "creative" ? "selected" : ""}>Творческая</option>
            <option value="learning" ${defaults.task_type === "learning" ? "selected" : ""}>Обучение</option>
            <option value="recovery" ${defaults.task_type === "recovery" ? "selected" : ""}>Восстановление</option>
          </select>
          <select data-editor-cognitive-load>
            ${[1, 2, 3, 4, 5].map((value) => `<option value="${value}" ${defaults.cognitive_load === value ? "selected" : ""}>Когнитивная ${value}/5</option>`).join("")}
          </select>
        </div>
        <div class="inline-task-row">
          <select data-editor-emotional-load>
            ${[1, 2, 3, 4, 5].map((value) => `<option value="${value}" ${defaults.emotional_load === value ? "selected" : ""}>Эмоциональная ${value}/5</option>`).join("")}
          </select>
        </div>
        <div class="inline-task-actions">
          <button type="button" class="inline-action-button is-primary" data-editor-save="${editorKey}">Сохранить</button>
          <button type="button" class="inline-action-button" data-editor-cancel="${editorKey}">Отмена</button>
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

  return `<button type="button" class="backlog-day-add-button" data-day-add="${createKey}">Добавить</button>`;
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
    <div class="backlog-slot-cell is-task" draggable="true" data-task-card="${taskKey}">
      <div class="task-card ${item.status === "Сделано" ? "is-done" : ""}">
        ${doneMark}
        <span class="task-drag-hint" aria-hidden="true">::</span>
        <p>${escapeHtml(item.text)}</p>
        <div class="task-card-actions task-card-actions-stacked">
          <div class="task-status-group">
            <span class="task-meta-label">Статус</span>
            <select class="task-status-select ${statusClass(item.status)}" data-task-status="${taskKey}">
              <option value="Запланировано" ${item.status === "Запланировано" ? "selected" : ""}>Запланировано</option>
              <option value="В работе" ${item.status === "В работе" ? "selected" : ""}>В работе</option>
              <option value="Сделано" ${item.status === "Сделано" ? "selected" : ""}>Сделано</option>
              <option value="__edit__">Редактировать</option>
              <option value="__delete__">Удалить</option>
            </select>
          </div>
          <div class="task-meta task-meta-labeled">
            <span class="task-meta-label">Тип задачи</span>
            <span class="task-badge">${getTaskTypeIcon(item.task_type)} ${getTaskTypeLabel(item.task_type)}</span>
          </div>
          <div class="task-meta task-meta-labeled">
            <span class="task-meta-label">Когнитивная</span>
            <span class="task-badge">${item.cognitive_load}/5</span>
          </div>
          <div class="task-meta task-meta-labeled">
            <span class="task-meta-label">Эмоциональная</span>
            <span class="task-badge">${item.emotional_load}/5</span>
          </div>
          <div class="task-meta task-meta-labeled">
            <span class="task-meta-label">Общая нагрузка</span>
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

function saveEditor(editorKey) {
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
  const nextTask = normalizeBacklogTaskItem({
    id: activeEditorState?.mode === "edit" ? value : `task-${Date.now()}`,
    time: selectedTime,
    text,
    status: statusSelect.value,
    task_type: taskTypeSelect.value,
    cognitive_load: Number(cognitiveLoadSelect.value),
    emotional_load: Number(emotionalLoadSelect.value)
  }, day.date);

  if (activeEditorState?.mode === "edit") {
    const taskIndex = day.items.findIndex((entry) => entry.id === value);
    if (taskIndex < 0) return;

    const hasConflict = day.items.some((entry, index) => entry.time === selectedTime && index !== taskIndex);
    if (hasConflict) {
      timeSelect?.focus();
      return;
    }

    day.items[taskIndex] = nextTask;
  } else {
    const hasConflict = day.items.some((entry) => entry.time === selectedTime);
    if (hasConflict) {
      timeSelect?.focus();
      return;
    }
    day.items.push(nextTask);
  }

  sortDayItems(day);
  saveBacklogData();
  activeEditorState = null;
  renderBacklog(weekSelect.value);
}

function deleteTask(taskKey) {
  const { day, id } = findTaskByKey(taskKey);
  if (!day) return;
  day.items = day.items.filter((entry) => entry.id !== id);
  saveBacklogData();
  activeEditorState = null;
  renderBacklog(weekSelect.value);
}

function moveTaskToDay(taskKey, targetDayKey) {
  const { week, date: sourceDate, value: id } = parseKey(taskKey);
  const { date: targetDate } = parseKey(targetDayKey);
  const sourceDay = findDay(week, sourceDate);
  const targetDay = findDay(week, targetDate);
  if (!sourceDay || !targetDay) return false;

  const sourceIndex = sourceDay.items.findIndex((entry) => entry.id === id);
  if (sourceIndex < 0) return false;

  const [task] = sourceDay.items.splice(sourceIndex, 1);
  const keepTime = !targetDay.items.some((entry) => entry.time === task.time);
  const nextTime = keepTime ? task.time : getNextAvailableTime(targetDay);
  targetDay.items.push(normalizeBacklogTaskItem({ ...task, time: nextTime }, targetDay.date));

  sortDayItems(sourceDay);
  sortDayItems(targetDay);
  saveBacklogData();
  return true;
}

function renderBacklog(week) {
  const data = backlogData[week];
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
        ${renderDayCreateArea(week, day)}
        ${day.items.map((item) => renderTaskCard(week, day, item)).join("")}
      </div>
    `;
    table.appendChild(column);
  });

  backlogBoard.appendChild(table);
  bindBoardActions();
}

function bindBoardActions() {
  backlogBoard.querySelectorAll("[data-task-card]").forEach((card) => {
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
      renderBacklog(weekSelect.value);
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
      if (moved) {
        renderBacklog(weekSelect.value);
      }
    });
  }

  backlogBoard.querySelectorAll(".backlog-day-column, [data-day-drop]").forEach(bindDropZone);

  backlogBoard.querySelectorAll("[data-editor-cancel]").forEach((button) => {
    button.addEventListener("click", () => {
      activeEditorState = null;
      renderBacklog(weekSelect.value);
    });
  });

  backlogBoard.querySelectorAll("[data-editor-save]").forEach((button) => {
    button.addEventListener("click", () => {
      saveEditor(button.dataset.editorSave);
    });
  });

  backlogBoard.querySelectorAll("[data-task-status]").forEach((select) => {
    select.addEventListener("change", () => {
      const taskKey = select.dataset.taskStatus;

      if (select.value === "__edit__") {
        activeEditorState = { mode: "edit", key: taskKey };
        renderBacklog(weekSelect.value);
        const input = backlogBoard.querySelector("[data-editor-text]");
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
        return;
      }

      if (select.value === "__delete__") {
        deleteTask(taskKey);
        return;
      }

      const { task } = findTaskByKey(taskKey);
      if (!task) return;
      task.status = select.value;
      saveBacklogData();
      renderBacklog(weekSelect.value);
    });
  });
}

weekSelect.addEventListener("change", (event) => {
  activeEditorState = null;
  draggedTaskKey = null;
  window.appStorage.setItem(userBacklogWeekStorageKey, event.target.value);
  renderDailyFocus(event.target.value);
  renderBacklog(event.target.value);
});

logoutButton?.addEventListener("click", async () => {
  await signOutCurrentUser().catch(() => null);
  window.appStorage.removeItem(AUTH_KEY);
  window.location.replace(landingPath());
});

renderDailyFocus(defaultWeek);
renderBacklog(defaultWeek);
