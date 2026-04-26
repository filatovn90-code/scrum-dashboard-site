const AUTH_KEY = "scrum-dashboard-auth-user";

if (!window.localStorage.getItem(AUTH_KEY)) {
  window.location.replace("index.html");
}

const seededBacklogData = {
  "Неделя 20.04 - 24.04": {
    totalMeetingHours: "8 ч 30 мин",
    days: [
      {
        date: "20.04",
        weekday: "Понедельник",
        items: [
          { time: "09:00", text: "Написать расписание встреч по планированию", status: "В работе", stress: "Средний" },
          { time: "14:30", text: "Заполнить еженедельный отчет", status: "Сделано", stress: "Низкий" },
          { time: "14:45", text: "Подготовиться к встрече завтра с ИТ", status: "Сделано", stress: "Низкий" },
          { time: "15:15", text: "Дать ОС по сбору ЛМГ", status: "Сделано", stress: "Низкий" }
        ]
      },
      {
        date: "21.04",
        weekday: "Вторник",
        items: [
          { time: "09:15", text: "Подготовиться к встрече с ИТ", status: "Сделано", stress: "Низкий" },
          { time: "09:30", text: "Сделать презентацию для встречи в среду", status: "Сделано", stress: "Средний" },
          { time: "10:15", text: "Перенести данные для викли", status: "Сделано", stress: "Низкий" },
          { time: "10:45", text: "Написать минутки после встречи с ИТ", status: "Сделано", stress: "Низкий" }
        ]
      },
      {
        date: "22.04",
        weekday: "Среда",
        items: [
          { time: "09:15", text: "Поставить встречу по анализу TTM и LT", status: "Запланировано", stress: "Средний" },
          { time: "09:30", text: "Перенести общие встречи по планированию", status: "Запланировано", stress: "Низкий" },
          { time: "10:00", text: "Протестировать календарь Димы", status: "В работе", stress: "Средний" },
          { time: "12:30", text: "Написать минутки по встрече с Discovery", status: "Запланировано", stress: "Средний" },
          { time: "12:45", text: "Перенести первую встречу по планированию", status: "Запланировано", stress: "Низкий" }
        ]
      },
      {
        date: "23.04",
        weekday: "Четверг",
        items: [
          { time: "09:00", text: "Проверить бэклог перед планированием", status: "Запланировано", stress: "Низкий" },
          { time: "10:30", text: "Подготовить синк по Agile Radar", status: "В работе", stress: "Высокий" },
          { time: "13:15", text: "Разобрать блокеры по Jira hygiene", status: "Запланировано", stress: "Средний" }
        ]
      },
      {
        date: "24.04",
        weekday: "Пятница",
        items: [
          { time: "09:15", text: "Сверить загрузку команды на цели МП", status: "Запланировано", stress: "Средний" },
          { time: "11:00", text: "Подготовить материалы к ретро", status: "Запланировано", stress: "Низкий" },
          { time: "15:00", text: "Обновить квартальные метрики", status: "Запланировано", stress: "Средний" }
        ]
      }
    ]
  }
};

const weekSelect = document.getElementById("weekSelect");
const backlogSummary = document.getElementById("backlogSummary");
const backlogBoard = document.getElementById("backlogBoard");
const BACKLOG_STORAGE_KEY = "scrum-master-backlog-data";
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

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
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

function loadBacklogData(template) {
  const raw = window.localStorage.getItem(BACKLOG_STORAGE_KEY);
  if (!raw) {
    return JSON.parse(JSON.stringify(template));
  }

  try {
    const stored = JSON.parse(raw);
    return mergeWeekData(template, stored);
  } catch {
    return JSON.parse(JSON.stringify(template));
  }
}

function saveBacklogData() {
  window.localStorage.setItem(BACKLOG_STORAGE_KEY, JSON.stringify(backlogData));
}

function parseKey(key) {
  const [week, date, time] = key.split("::");
  return { week, date, time };
}

function makeSlotKey(week, date, time) {
  return `${week}::${date}::${time}`;
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
  const { week, date, time } = parseKey(key);
  const day = findDay(week, date);
  const task = day?.items.find((entry) => entry.time === time);
  return { day, task, week, date, time };
}

function sortDayItems(day) {
  day.items.sort((a, b) => timeline.indexOf(a.time) - timeline.indexOf(b.time));
}

const defaultBacklogData = mergeWeekData(generateWeeksUntilYearEnd(), seededBacklogData);
const backlogData = loadBacklogData(defaultBacklogData);
const weekNames = Object.keys(backlogData).sort((a, b) => weekStartValue(a) - weekStartValue(b));
const defaultWeek = weekNames[0];

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

function renderTaskEditor(slotKey, defaults) {
  return `
    <div class="backlog-slot-cell is-editor">
      <div class="inline-task-editor" data-editor="${slotKey}">
        <input class="inline-task-input" type="text" placeholder="Задача" value="${defaults.text}" data-editor-text>
        <div class="inline-task-row">
          <select data-editor-status>
            <option value="Запланировано" ${defaults.status === "Запланировано" ? "selected" : ""}>Запланировано</option>
            <option value="В работе" ${defaults.status === "В работе" ? "selected" : ""}>В работе</option>
            <option value="Сделано" ${defaults.status === "Сделано" ? "selected" : ""}>Сделано</option>
          </select>
          <select data-editor-stress>
            <option value="Низкий" ${defaults.stress === "Низкий" ? "selected" : ""}>Низкий</option>
            <option value="Средний" ${defaults.stress === "Средний" ? "selected" : ""}>Средний</option>
            <option value="Высокий" ${defaults.stress === "Высокий" ? "selected" : ""}>Высокий</option>
          </select>
        </div>
        <div class="inline-task-actions">
          <button type="button" class="inline-action-button is-primary" data-editor-save="${slotKey}">Сохранить</button>
          <button type="button" class="inline-action-button" data-editor-cancel="${slotKey}">Отмена</button>
        </div>
      </div>
    </div>
  `;
}

function renderEmptySlot(week, day, time) {
  const slotKey = makeSlotKey(week, day.date, time);

  if (isCreateEditor(slotKey)) {
    return renderTaskEditor(slotKey, {
      text: "",
      status: "Запланировано",
      stress: "Низкий"
    });
  }

  return `
    <button
      type="button"
      class="backlog-slot-cell is-empty is-clickable"
      data-slot-empty="${slotKey}"
      aria-label="Добавить задачу на ${day.date} в ${time}"
    >
      <span class="empty-slot-plus">+</span>
      <span class="empty-slot-label">Добавить</span>
    </button>
  `;
}

function renderTaskCard(week, day, item) {
  const taskKey = makeSlotKey(week, day.date, item.time);

  if (isEditEditor(taskKey)) {
    return renderTaskEditor(taskKey, {
      text: item.text,
      status: item.status,
      stress: item.stress
    });
  }

  const cardStateClass = item.status === "Сделано" ? "is-done" : "";
  const doneMark = item.status === "Сделано"
    ? '<span class="task-done-mark" aria-label="Задача выполнена">✓</span>'
    : "";

  return `
    <div class="backlog-slot-cell is-task" draggable="true" data-task-card="${taskKey}">
      <div class="task-card ${cardStateClass}">
        ${doneMark}
        <span class="task-drag-hint" aria-hidden="true">::</span>
        <p>${item.text}</p>
        <div class="task-card-actions">
          <select class="task-status-select ${statusClass(item.status)}" data-task-status="${taskKey}">
            <option value="Запланировано" ${item.status === "Запланировано" ? "selected" : ""}>Запланировано</option>
            <option value="В работе" ${item.status === "В работе" ? "selected" : ""}>В работе</option>
            <option value="Сделано" ${item.status === "Сделано" ? "selected" : ""}>Сделано</option>
            <option value="__edit__">Редактировать</option>
            <option value="__delete__">Удалить</option>
          </select>
        </div>
      </div>
    </div>
  `;
}

function moveTaskToSlot(fromKey, toKey) {
  const from = parseKey(fromKey);
  const to = parseKey(toKey);

  if (from.week !== to.week || fromKey === toKey) {
    return false;
  }

  const sourceDay = findDay(from.week, from.date);
  const targetDay = findDay(to.week, to.date);
  if (!sourceDay || !targetDay) {
    return false;
  }

  const sourceIndex = sourceDay.items.findIndex((entry) => entry.time === from.time);
  if (sourceIndex < 0) {
    return false;
  }

  const targetOccupied = targetDay.items.some((entry) => entry.time === to.time);
  if (targetOccupied) {
    return false;
  }

  const [task] = sourceDay.items.splice(sourceIndex, 1);
  targetDay.items.push({ ...task, time: to.time });
  sortDayItems(sourceDay);
  sortDayItems(targetDay);
  saveBacklogData();
  return true;
}

function saveEditor(slotKey) {
  const editor = backlogBoard.querySelector(`[data-editor="${slotKey}"]`);
  if (!editor) {
    return;
  }

  const textInput = editor.querySelector("[data-editor-text]");
  const statusSelect = editor.querySelector("[data-editor-status]");
  const stressSelect = editor.querySelector("[data-editor-stress]");
  const text = textInput.value.trim();

  if (!text) {
    textInput.focus();
    return;
  }

  const { week, date, time } = parseKey(slotKey);
  const day = findDay(week, date);
  if (!day) {
    return;
  }

  const taskPayload = {
    time,
    text,
    status: statusSelect.value,
    stress: stressSelect.value
  };

  if (activeEditorState?.mode === "edit") {
    const index = day.items.findIndex((entry) => entry.time === time);
    if (index >= 0) {
      day.items[index] = taskPayload;
    }
  } else {
    day.items.push(taskPayload);
  }

  sortDayItems(day);
  saveBacklogData();
  activeEditorState = null;
  renderBacklog(weekSelect.value);
}

function deleteTask(taskKey) {
  const { day, time } = findTaskByKey(taskKey);
  if (!day) {
    return;
  }

  day.items = day.items.filter((entry) => entry.time !== time);
  saveBacklogData();
  activeEditorState = null;
  renderBacklog(weekSelect.value);
}

function renderBacklog(week) {
  const data = backlogData[week];
  backlogSummary.innerHTML = "";

  backlogBoard.innerHTML = "";

  const table = document.createElement("div");
  table.className = "backlog-table";

  const timeColumn = document.createElement("section");
  timeColumn.className = "backlog-time-column";
  timeColumn.innerHTML = `
    <div class="backlog-column-header">
      <span class="backlog-time-header">Время</span>
    </div>
    <div class="backlog-time-list">
      ${timeline.map((time) => `<div class="backlog-time-cell">${time}</div>`).join("")}
    </div>
  `;
  table.appendChild(timeColumn);

  data.days.forEach((day) => {
    const column = document.createElement("section");
    column.className = "backlog-day-column";
    column.innerHTML = `
      <div class="backlog-column-header">
        <div class="backlog-day-title">
          <strong>${day.date}</strong>
          <span>${day.weekday}</span>
        </div>
      </div>
      <div class="backlog-day-list">
        ${timeline.map((time) => {
          const item = day.items.find((entry) => entry.time === time);
          return item ? renderTaskCard(week, day, item) : renderEmptySlot(week, day, time);
        }).join("")}
      </div>
    `;
    table.appendChild(column);
  });

  backlogBoard.appendChild(table);
  bindBoardActions();
}

function bindBoardActions() {
  backlogBoard.querySelectorAll("[data-task-card]").forEach((card) => {
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
      backlogBoard.querySelectorAll(".is-drop-target").forEach((slot) => {
        slot.classList.remove("is-drop-target");
      });
    });
  });

  backlogBoard.querySelectorAll("[data-slot-empty]").forEach((button) => {
    button.addEventListener("click", () => {
      activeEditorState = { mode: "create", key: button.dataset.slotEmpty };
      renderBacklog(weekSelect.value);

      const input = backlogBoard.querySelector("[data-editor-text]");
      if (input) {
        input.focus();
      }
    });

    button.addEventListener("dragover", (event) => {
      if (!draggedTaskKey) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });

    button.addEventListener("dragenter", (event) => {
      if (!draggedTaskKey) {
        return;
      }

      event.preventDefault();
      button.classList.add("is-drop-target");
    });

    button.addEventListener("dragleave", (event) => {
      if (event.relatedTarget && button.contains(event.relatedTarget)) {
        return;
      }

      button.classList.remove("is-drop-target");
    });

    button.addEventListener("drop", (event) => {
      if (!draggedTaskKey) {
        return;
      }

      event.preventDefault();
      const moved = moveTaskToSlot(draggedTaskKey, button.dataset.slotEmpty);
      draggedTaskKey = null;
      activeEditorState = null;
      if (moved) {
        renderBacklog(weekSelect.value);
      }
    });
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

      const { day, time } = findTaskByKey(taskKey);
      const task = day?.items.find((entry) => entry.time === time);

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
  renderBacklog(event.target.value);
});

renderBacklog(defaultWeek);
