const AUTH_KEY = "scrum-dashboard-auth-user";

if (!window.appStorage.getItem(AUTH_KEY)) {
  window.location.replace("index.html");
}

const activeUser = window.appStorage.getItem(AUTH_KEY);

const seededBacklogData = {
  "Неделя 20.04 - 24.04": {
    totalMeetingHours: "8 ч 30 мин",
    days: [
      {
        date: "20.04",
        weekday: "Понедельник",
        items: [
          { id: "20-0900", time: "09:00", text: "Написать расписание встреч по планированию", status: "В работе", stress: "Средний" },
          { id: "20-1430", time: "14:30", text: "Заполнить еженедельный отчет", status: "Сделано", stress: "Низкий" },
          { id: "20-1445", time: "14:45", text: "Подготовиться к встрече завтра с ИТ", status: "Сделано", stress: "Низкий" },
          { id: "20-1515", time: "15:15", text: "Дать ОС по сбору ЛМГ", status: "Сделано", stress: "Низкий" }
        ]
      },
      {
        date: "21.04",
        weekday: "Вторник",
        items: [
          { id: "21-0915", time: "09:15", text: "Подготовиться к встрече с ИТ", status: "Сделано", stress: "Низкий" },
          { id: "21-0930", time: "09:30", text: "Сделать презентацию для встречи в среду", status: "Сделано", stress: "Средний" },
          { id: "21-1015", time: "10:15", text: "Перенести данные для викли", status: "Сделано", stress: "Низкий" },
          { id: "21-1045", time: "10:45", text: "Написать минутки после встречи с ИТ", status: "Сделано", stress: "Низкий" }
        ]
      },
      {
        date: "22.04",
        weekday: "Среда",
        items: [
          { id: "22-0915", time: "09:15", text: "Поставить встречу по анализу TTM и LT", status: "Запланировано", stress: "Средний" },
          { id: "22-0930", time: "09:30", text: "Перенести общие встречи по планированию", status: "Запланировано", stress: "Низкий" },
          { id: "22-1000", time: "10:00", text: "Протестировать календарь Димы", status: "В работе", stress: "Средний" },
          { id: "22-1230", time: "12:30", text: "Написать минутки по встрече с Discovery", status: "Запланировано", stress: "Средний" },
          { id: "22-1245", time: "12:45", text: "Перенести первую встречу по планированию", status: "Запланировано", stress: "Низкий" }
        ]
      },
      {
        date: "23.04",
        weekday: "Четверг",
        items: [
          { id: "23-0900", time: "09:00", text: "Проверить бэклог перед планированием", status: "Запланировано", stress: "Низкий" },
          { id: "23-1030", time: "10:30", text: "Подготовить синк по Agile Radar", status: "В работе", stress: "Высокий" },
          { id: "23-1315", time: "13:15", text: "Разобрать блокеры по Jira hygiene", status: "Запланировано", stress: "Средний" }
        ]
      },
      {
        date: "24.04",
        weekday: "Пятница",
        items: [
          { id: "24-0915", time: "09:15", text: "Сверить загрузку команды на цели МП", status: "Запланировано", stress: "Средний" },
          { id: "24-1100", time: "11:00", text: "Подготовить материалы к ретро", status: "Запланировано", stress: "Низкий" },
          { id: "24-1500", time: "15:00", text: "Обновить квартальные метрики", status: "Запланировано", stress: "Средний" }
        ]
      }
    ]
  }
};

const weekSelect = document.getElementById("weekSelect");
const focusTodayPanel = document.getElementById("focusTodayPanel");
const backlogSummary = document.getElementById("backlogSummary");
const backlogBoard = document.getElementById("backlogBoard");
const logoutButton = document.getElementById("logoutButton");
const activeUserLabels = Array.from(document.querySelectorAll("[data-active-user-name]"));

const BACKLOG_STORAGE_KEY = "scrum-master-backlog-data";
const userBacklogStorageKey = `${BACKLOG_STORAGE_KEY}:${activeUser}`;
const userBacklogWeekStorageKey = `scrum-master-backlog-week:${activeUser}`;
const DAILY_FOCUS_STORAGE_KEY = "scrum-master-daily-focus";
const DAILY_FOCUS_DAY_STORAGE_KEY = "scrum-master-daily-focus-day";
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

let activeEditorState = null;
let draggedTaskKey = null;

activeUserLabels.forEach((label) => {
  label.textContent = activeUser;
});

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
  if (!days.length) {
    return "";
  }

  const stored = window.appStorage.getItem(focusSelectedDayStorageKey(week));
  return days.some((day) => day.date === stored) ? stored : days[0].date;
}

function loadDailyFocus(week, date) {
  const fallback = [0, 1, 2].map(() => ({ text: "", done: false }));
  const raw = window.appStorage.getItem(focusStorageKey(week, date));

  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    return [0, 1, 2].map((index) => {
      const item = parsed[index];
      if (typeof item === "string") {
        return { text: item, done: false };
      }

      return {
        text: item?.text || "",
        done: Boolean(item?.done)
      };
    });
  } catch {
    return fallback;
  }
}

function saveDailyFocus(week, date, items) {
  const normalized = items
    .slice(0, 3)
    .map((item) => ({
      text: String(item?.text || "").trim(),
      done: Boolean(item?.done)
    }));
  window.appStorage.setItem(focusStorageKey(week, date), JSON.stringify(normalized));
}

function renderDailyFocus(week = weekSelect.value) {
  if (!focusTodayPanel) {
    return;
  }

  const days = getFocusDays(week);
  const selectedDate = getSelectedFocusDay(week);
  const focusItems = loadDailyFocus(week, selectedDate);
  const normalizedItems = [0, 1, 2].map((index) => focusItems[index] || { text: "", done: false });

  focusTodayPanel.innerHTML = `
    <div class="daily-focus-header">
      <h3 class="daily-focus-title">\u0424\u043e\u043a\u0443\u0441 \u043d\u0430 \u0441\u0435\u0433\u043e\u0434\u043d\u044f</h3>
    </div>
    <div class="daily-focus-list">
      ${normalizedItems.map((item, index) => `
        <div class="daily-focus-item ${item.text.trim() ? "" : "is-empty"} ${item.done ? "is-done" : ""}">
          <label class="daily-focus-check">
            <input type="checkbox" ${item.done ? "checked" : ""} data-focus-done="${index}">
            <span></span>
          </label>
          <input class="daily-focus-input" type="text" maxlength="160" value="${escapeHtml(item.text)}" placeholder="\u041f\u0443\u043d\u043a\u0442 ${index + 1}" data-focus-input="${index}">
        </div>
      `).join("")}
    </div>
  `;

  const focusHeader = focusTodayPanel.querySelector('.daily-focus-header');
  if (focusHeader) {
    const daySelectControl = document.createElement('select');
    daySelectControl.className = 'daily-focus-select';
    daySelectControl.id = 'focusDaySelect';
    daySelectControl.setAttribute('aria-label', '\u0412\u044b\u0431\u0440\u0430\u0442\u044c \u0434\u0435\u043d\u044c \u0444\u043e\u043a\u0443\u0441\u0430');
    daySelectControl.innerHTML = days.map((day) => (
      `<option value="${day.date}" ${day.date === selectedDate ? "selected" : ""}>${day.weekday} · ${day.date}</option>`
    )).join('');
    focusHeader.appendChild(daySelectControl);
  }

  const daySelect = document.getElementById('focusDaySelect');
  daySelect?.addEventListener('change', () => {
    window.appStorage.setItem(focusSelectedDayStorageKey(week), daySelect.value);
    renderDailyFocus(week);
  });

  function collectFocusState() {
    return normalizedItems.map((_, index) => {
      const textField = focusTodayPanel.querySelector(`[data-focus-input="${index}"]`);
      const doneField = focusTodayPanel.querySelector(`[data-focus-done="${index}"]`);

      return {
        text: textField?.value.trim() || '',
        done: Boolean(doneField?.checked)
      };
    });
  }

  focusTodayPanel.querySelectorAll('[data-focus-input]').forEach((input) => {
    input.addEventListener('change', () => {
      saveDailyFocus(week, daySelect?.value || selectedDate, collectFocusState());
      renderDailyFocus(week);
    });
  });

  focusTodayPanel.querySelectorAll('[data-focus-done]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      saveDailyFocus(week, daySelect?.value || selectedDate, collectFocusState());
      renderDailyFocus(week);
    });
  });
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
    [label]: {
      totalMeetingHours: "0 ч 00 мин",
      days
    }
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

function normalizeStoredData(template, stored) {
  const merged = mergeWeekData(template, stored);

  Object.values(merged).forEach((week) => {
    week.days.forEach((day) => {
      day.items = (day.items || []).map((item) => ({
        id: item.id || `task-${day.date}-${item.time}-${Math.random().toString(36).slice(2, 8)}`,
        time: item.time,
        text: item.text || "",
        status: item.status || "Запланировано",
        stress: item.stress || "Нет",
        taskType: item.taskType || "Low Energy",
        energyCost: item.energyCost || "M"
      }));
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
      // ignore copy issue
    }
  }

  const resolvedRaw = raw || legacyRaw;
  if (!resolvedRaw) {
    return normalizeStoredData(template);
  }

  try {
    const stored = JSON.parse(resolvedRaw);
    return normalizeStoredData(template, stored);
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
  return { day, task, week, date, id: value };
}

function statusSortOrder(status) {
  if (status === "Р’ СЂР°Р±РѕС‚Рµ") return 0;
  if (status === "Р—Р°РїР»Р°РЅРёСЂРѕРІР°РЅРѕ") return 1;
  if (status === "РЎРґРµР»Р°РЅРѕ") return 2;
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

function statusClass(status) {
  if (status === "Сделано") return "status-done";
  if (status === "В работе") return "status-progress";
  return "status-planned";
}

function stressClass(stress) {
  if (stress === "Высокий") return "stress-high";
  if (stress === "Средний") return "stress-medium";
  if (stress === "Нет") return "stress-none";
  return "stress-low";
}

function taskTypeClass(taskType) {
  if (taskType === "Deep Work") return "task-type-deep";
  if (taskType === "High Energy") return "task-type-high";
  return "task-type-low";
}

function energyCostClass(energyCost) {
  if (energyCost === "L") return "energy-cost-high";
  if (energyCost === "S") return "energy-cost-low";
  return "energy-cost-medium";
}

function renderTaskEditor(editorKey, day, defaults) {
  return `
    <div class="backlog-slot-cell is-editor">
      <div class="inline-task-editor" data-editor="${editorKey}">
        <input class="inline-task-input" type="text" placeholder="Задача" value="${defaults.text}" data-editor-text>
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
            <option value="Deep Work" ${defaults.taskType === "Deep Work" ? "selected" : ""}>🔵 Deep Work</option>
            <option value="High Energy" ${defaults.taskType === "High Energy" ? "selected" : ""}>🔴 High Energy</option>
            <option value="Low Energy" ${defaults.taskType === "Low Energy" ? "selected" : ""}>🟢 Low Energy</option>
          </select>
          <select data-editor-energy-cost>
            <option value="S" ${defaults.energyCost === "S" ? "selected" : ""}>S — Low load</option>
            <option value="M" ${defaults.energyCost === "M" ? "selected" : ""}>M — Medium load</option>
            <option value="L" ${defaults.energyCost === "L" ? "selected" : ""}>L — High load</option>
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
      stress: "Нет",
      taskType: "Low Energy",
      energyCost: "M",
      hideTime: true
    });
  }

  return `
    <button type="button" class="backlog-day-add-button" data-day-add="${createKey}">
      Добавить
    </button>
  `;
}

function renderTaskCard(week, day, item) {
  const taskKey = makeTaskKey(week, day.date, item.id);

  if (isEditEditor(taskKey)) {
    return renderTaskEditor(taskKey, day, {
      time: item.time,
      originalTime: item.time,
      text: item.text,
      status: item.status,
      stress: item.stress,
      taskType: item.taskType || "Low Energy",
      energyCost: item.energyCost || "M"
    });
  }

  const cardStateClass = item.status === "Сделано" ? "is-done" : "";
  const doneMark = item.status === "Сделано"
    ? '<span class="task-done-mark" aria-label="Задача выполнена">✓</span>'
    : "";
  const typeMarkup = `
        <div class="task-meta task-meta-labeled">
          <span class="task-meta-label">Energy Type</span>
          <span class="task-badge ${taskTypeClass(item.taskType || "Low Energy")}">${item.taskType || "Low Energy"}</span>
        </div>
      `;
  const energyCostMarkup = `
        <div class="task-meta task-meta-labeled">
          <span class="task-meta-label">Energy Cost</span>
          <span class="task-badge ${energyCostClass(item.energyCost || "M")}">${item.energyCost || "M"}</span>
        </div>
      `;

  return `
    <div class="backlog-slot-cell is-task" draggable="true" data-task-card="${taskKey}">
      <div class="task-card ${cardStateClass}">
        ${doneMark}
        <span class="task-drag-hint" aria-hidden="true">::</span>
        <p>${item.text}</p>
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
          ${typeMarkup}
          ${energyCostMarkup}
        </div>
      </div>
    </div>
  `;
}

function saveEditor(editorKey) {
  const editor = backlogBoard.querySelector(`[data-editor="${editorKey}"]`);
  if (!editor) {
    return;
  }

  const textInput = editor.querySelector("[data-editor-text]");
  const timeSelect = editor.querySelector("[data-editor-time]");
  const statusSelect = editor.querySelector("[data-editor-status]");
  const taskTypeSelect = editor.querySelector("[data-editor-task-type]");
  const energyCostSelect = editor.querySelector("[data-editor-energy-cost]");
  const text = textInput.value.trim();

  if (!text) {
    textInput.focus();
    return;
  }

  const { week, date, value } = parseKey(editorKey);
  const day = findDay(week, date);
  if (!day) {
    return;
  }

  const selectedTime = timeSelect ? timeSelect.value : getNextAvailableTime(day);

  if (activeEditorState?.mode === "edit") {
    const taskIndex = day.items.findIndex((entry) => entry.id === value);
    if (taskIndex < 0) {
      return;
    }

    const hasConflict = day.items.some((entry, index) => entry.time === selectedTime && index !== taskIndex);
    if (hasConflict) {
      timeSelect?.focus();
      return;
    }

    day.items[taskIndex] = {
      ...day.items[taskIndex],
      time: selectedTime,
      text,
      status: statusSelect.value,
      stress: day.items[taskIndex]?.stress || "Нет",
      taskType: taskTypeSelect.value,
      energyCost: energyCostSelect.value
    };
  } else {
    const hasConflict = day.items.some((entry) => entry.time === selectedTime);
    if (hasConflict) {
      timeSelect?.focus();
      return;
    }

    day.items.push({
      id: `task-${Date.now()}`,
      time: selectedTime,
      text,
      status: statusSelect.value,
      stress: "Нет",
      taskType: taskTypeSelect.value,
      energyCost: energyCostSelect.value
    });
  }

  sortDayItems(day);
  saveBacklogData();
  activeEditorState = null;
  renderBacklog(weekSelect.value);
}

function deleteTask(taskKey) {
  const { day, id } = findTaskByKey(taskKey);
  if (!day) {
    return;
  }

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

  if (!sourceDay || !targetDay) {
    return false;
  }

  const sourceIndex = sourceDay.items.findIndex((entry) => entry.id === id);
  if (sourceIndex < 0) {
    return false;
  }

  const [task] = sourceDay.items.splice(sourceIndex, 1);
  const keepTime = !targetDay.items.some((entry) => entry.time === task.time);
  const nextTime = keepTime ? task.time : getNextAvailableTime(targetDay);

  targetDay.items.push({ ...task, time: nextTime });
  sortDayItems(sourceDay);
  sortDayItems(targetDay);
  saveBacklogData();
  return true;
}

function renderBacklog(week) {
  const data = backlogData[week];
  backlogSummary.innerHTML = "";
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

      const input = backlogBoard.querySelector("[data-editor-text]");
      if (input) {
        input.focus();
      }
    });
  });

  function bindDropZone(element) {
    element.addEventListener("dragover", (event) => {
      if (!draggedTaskKey) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });

    element.addEventListener("dragenter", (event) => {
      if (!draggedTaskKey) {
        return;
      }

      event.preventDefault();
      element.classList.add("is-drop-target");
    });

    element.addEventListener("dragleave", (event) => {
      if (event.relatedTarget && element.contains(event.relatedTarget)) {
        return;
      }

      element.classList.remove("is-drop-target");
    });

    element.addEventListener("drop", (event) => {
      if (!draggedTaskKey) {
        return;
      }

      event.preventDefault();
      const moved = moveTaskToDay(draggedTaskKey, element.dataset.dayDrop);
      draggedTaskKey = null;
      activeEditorState = null;
      if (moved) {
        renderBacklog(weekSelect.value);
      }
    });
  }

  backlogBoard.querySelectorAll(".backlog-day-column").forEach((column) => {
    bindDropZone(column);
  });

  backlogBoard.querySelectorAll("[data-day-drop]").forEach((dayList) => {
    bindDropZone(dayList);
  });

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
      if (!task) {
        return;
      }

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

logoutButton?.addEventListener("click", () => {
  (async () => {
    try {
      const [{ signOutCurrentUser }, { landingPath }] = await Promise.all([
        import("./auth-helpers.js"),
        import("./route-paths.js")
      ]);
      await signOutCurrentUser().catch(() => null);
      window.appStorage.removeItem(AUTH_KEY);
      window.location.replace(landingPath());
    } catch {
      window.appStorage.removeItem(AUTH_KEY);
      window.location.replace("index.html");
    }
  })();
});

renderDailyFocus(defaultWeek);
renderBacklog(defaultWeek);
