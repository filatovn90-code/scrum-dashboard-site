const AUTH_KEY = "scrum-dashboard-auth-user";

if (!window.localStorage.getItem(AUTH_KEY)) {
  window.location.replace("index.html");
}

const seededCalendarData = {
  "Апрель 2026": {
    monthLabel: "Апрель 2026",
    year: 2026,
    monthIndex: 3,
    events: [
      { id: "apr-03-sync", day: 3, type: "event", title: "Синхронизация с Product Manager", time: "11:00" },
      { id: "apr-08-review", day: 8, type: "review", title: "Sprint Review", time: "16:00" },
      { id: "apr-12-deadline", day: 12, type: "deadline", title: "Подготовить квартальный обзор", time: "18:00" },
      { id: "apr-16-retro", day: 16, type: "review", title: "Ретроспектива команды", time: "15:30" },
      { id: "apr-21-radar", day: 21, type: "event", title: "Встреча по Agile Radar", time: "13:00" },
      { id: "apr-28-jira", day: 28, type: "deadline", title: "Финализировать Jira hygiene report", time: "17:00" }
    ]
  },
  "Май 2026": {
    monthLabel: "Май 2026",
    year: 2026,
    monthIndex: 4,
    events: [
      { id: "may-05-plan", day: 5, type: "event", title: "Планирование квартала", time: "10:00" },
      { id: "may-07-sprint", day: 7, type: "review", title: "Sprint Planning", time: "12:00" },
      { id: "may-14-lt-ttm", day: 14, type: "deadline", title: "Сдать LT / TTM сводку", time: "17:30" },
      { id: "may-19-1on1", day: 19, type: "event", title: "1:1 с лидом разработки", time: "14:00" },
      { id: "may-22-retro", day: 22, type: "review", title: "Ретро по квартальным инициативам", time: "16:00" },
      { id: "may-29-epics", day: 29, type: "deadline", title: "Проверить эпики перед новым циклом", time: "15:00" }
    ]
  }
};

const CALENDAR_STORAGE_KEY = "scrum-master-calendar-data";

const monthSelect = document.getElementById("calendarMonthSelect");
const monthTitle = document.getElementById("calendarMonthTitle");
const currentDateLabel = document.getElementById("calendarCurrentDate");
const weekdaysRow = document.getElementById("calendarWeekdays");
const calendarGrid = document.getElementById("calendarGrid");
const prevMonthButton = document.getElementById("calendarPrevMonth");
const nextMonthButton = document.getElementById("calendarNextMonth");
const selectedDateTitle = document.getElementById("calendarSelectedDate");
const selectedEvents = document.getElementById("calendarSelectedEvents");
const monthEventsTitle = document.getElementById("calendarMonthEventsTitle");
const monthEventsList = document.getElementById("calendarMonthEvents");
const eventForm = document.getElementById("calendarEventForm");
const eventTitleInput = document.getElementById("calendarEventTitle");
const eventTimeInput = document.getElementById("calendarEventTime");
const eventTypeSelect = document.getElementById("calendarEventType");
const eventCancelButton = document.getElementById("calendarEventCancel");
const eventSubmitButton = eventForm.querySelector(".calendar-event-submit");

const weekdayShort = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const weekdayLong = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
const today = { year: 2026, monthIndex: 3, day: 26 };

let calendarData = loadCalendarData();
let monthNames = getMonthNames(calendarData);
let activeMonth = monthNames[0];
let selectedDay = today.day;
let editingEvent = null;

function cloneSeedData() {
  return JSON.parse(JSON.stringify(seededCalendarData));
}

function normalizeMonth(month, fallbackLabel) {
  const monthLabel = month.monthLabel || fallbackLabel;
  return {
    monthLabel,
    year: month.year,
    monthIndex: month.monthIndex,
    events: (month.events || []).map((event, index) => ({
      id: event.id || `${month.year}-${month.monthIndex + 1}-${event.day}-${index}-${Date.now()}`,
      day: event.day,
      type: event.type || "event",
      title: event.title || "",
      time: event.time || "09:00"
    }))
  };
}

function loadCalendarData() {
  const seeded = cloneSeedData();
  const raw = window.localStorage.getItem(CALENDAR_STORAGE_KEY);

  if (!raw) {
    return Object.fromEntries(
      Object.entries(seeded).map(([label, month]) => [label, normalizeMonth(month, label)])
    );
  }

  try {
    const stored = JSON.parse(raw);
    const merged = { ...seeded, ...stored };
    return Object.fromEntries(
      Object.entries(merged).map(([label, month]) => [label, normalizeMonth(month, label)])
    );
  } catch {
    return Object.fromEntries(
      Object.entries(seeded).map(([label, month]) => [label, normalizeMonth(month, label)])
    );
  }
}

function saveCalendarData() {
  window.localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(calendarData));
}

function getMonthNames(data) {
  return Object.keys(data).sort((left, right) => {
    const a = data[left];
    const b = data[right];
    return new Date(a.year, a.monthIndex, 1) - new Date(b.year, b.monthIndex, 1);
  });
}

function refreshMonthOptions() {
  monthNames = getMonthNames(calendarData);
  monthSelect.innerHTML = "";

  monthNames.forEach((month) => {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month;
    option.selected = month === activeMonth;
    monthSelect.appendChild(option);
  });
}

function getCurrentDateText() {
  const date = new Date(today.year, today.monthIndex, today.day);
  const weekday = weekdayLong[date.getDay()];
  const monthName = date.toLocaleString("ru-RU", { month: "long" });
  return `${weekday}, ${today.day} ${monthName}`;
}

function getMonthMatrix(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();
  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
  const cells = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    const day = prevMonthLastDay - firstWeekday + index + 1;
    cells.push({ day, outside: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, outside: false });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ day: cells.length - (firstWeekday + daysInMonth) + 1, outside: true });
  }

  return cells;
}

function eventClass(type) {
  if (type === "deadline") return "is-deadline";
  if (type === "review") return "is-review";
  return "is-event";
}

function typeLabel(type) {
  if (type === "deadline") return "Дедлайн";
  if (type === "review") return "Ритуал";
  return "Событие";
}

function weekLabelForDay(year, monthIndex, day) {
  const date = new Date(year, monthIndex, day);
  const weekday = (date.getDay() + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - weekday);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const startDay = String(monday.getDate()).padStart(2, "0");
  const endDay = String(friday.getDate()).padStart(2, "0");
  const endMonth = String(friday.getMonth() + 1).padStart(2, "0");

  return `Неделя ${startDay} - ${endDay}.${endMonth}`;
}

function sortEvents(events) {
  return [...events].sort((left, right) => {
    if (left.day !== right.day) return left.day - right.day;
    return left.time.localeCompare(right.time);
  });
}

function resetEventForm() {
  editingEvent = null;
  eventForm.reset();
  eventTypeSelect.value = "event";
  eventSubmitButton.textContent = "Добавить событие";
  eventCancelButton.hidden = true;
}

function startEditingEvent(monthLabel, eventId) {
  const month = calendarData[monthLabel];
  const event = month?.events.find((item) => item.id === eventId);
  if (!event) {
    return;
  }

  activeMonth = monthLabel;
  selectedDay = event.day;
  editingEvent = { monthLabel, eventId };
  eventTitleInput.value = event.title;
  eventTimeInput.value = event.time;
  eventTypeSelect.value = event.type;
  eventSubmitButton.textContent = "Сохранить";
  eventCancelButton.hidden = false;
  renderCalendar(activeMonth);
  eventTitleInput.focus();
}

function deleteEvent(monthLabel, eventId) {
  const month = calendarData[monthLabel];
  if (!month) {
    return;
  }

  month.events = month.events.filter((event) => event.id !== eventId);
  if (editingEvent && editingEvent.monthLabel === monthLabel && editingEvent.eventId === eventId) {
    resetEventForm();
  }

  saveCalendarData();
  renderCalendar(activeMonth);
}

function bindEventActions() {
  document.querySelectorAll("[data-event-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      startEditingEvent(button.dataset.monthLabel, button.dataset.eventEdit);
    });
  });

  document.querySelectorAll("[data-event-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteEvent(button.dataset.monthLabel, button.dataset.eventDelete);
    });
  });
}

function renderSelectedDayPanel() {
  const month = calendarData[activeMonth];
  const date = new Date(month.year, month.monthIndex, selectedDay);
  const weekday = weekdayLong[date.getDay()];
  const monthName = date.toLocaleString("ru-RU", { month: "long" });
  const events = sortEvents(month.events.filter((event) => event.day === selectedDay));

  selectedDateTitle.textContent = `${weekday}, ${selectedDay} ${monthName}`;
  selectedEvents.innerHTML = events.length
    ? events.map((event) => `
        <article class="calendar-selected-event ${eventClass(event.type)}">
          <span class="calendar-selected-event-time">${event.time}</span>
          <div class="calendar-selected-event-copy">
            <strong>${event.title}</strong>
            <span>${typeLabel(event.type)}</span>
          </div>
          <div class="calendar-event-actions">
            <button type="button" class="calendar-event-action" data-month-label="${activeMonth}" data-event-edit="${event.id}">Ред.</button>
            <button type="button" class="calendar-event-action is-danger" data-month-label="${activeMonth}" data-event-delete="${event.id}">Удал.</button>
          </div>
        </article>
      `).join("")
    : '<p class="calendar-selected-empty">На этот день пока нет событий.</p>';
}

function renderMonthEventsSidebar() {
  const month = calendarData[activeMonth];
  const events = sortEvents(month.events);

  monthEventsTitle.textContent = month.monthLabel;
  if (!events.length) {
    monthEventsList.innerHTML = '<p class="calendar-selected-empty">На этот месяц пока ничего не запланировано.</p>';
    return;
  }

  const grouped = events.reduce((acc, event) => {
    const label = weekLabelForDay(month.year, month.monthIndex, event.day);
    if (!acc[label]) {
      acc[label] = [];
    }
    acc[label].push(event);
    return acc;
  }, {});

  monthEventsList.innerHTML = Object.entries(grouped).map(([weekLabel, weekEvents]) => `
    <section class="calendar-month-week-group">
      <h4 class="calendar-month-week-title">${weekLabel}</h4>
      <div class="calendar-month-week-events">
        ${weekEvents.map((event) => `
          <article class="calendar-month-event ${eventClass(event.type)}">
            <div class="calendar-month-event-date">
              <strong>${String(event.day).padStart(2, "0")}</strong>
              <span>${event.time}</span>
            </div>
            <div class="calendar-month-event-copy">
              <strong>${event.title}</strong>
              <span>${typeLabel(event.type)}</span>
            </div>
            <div class="calendar-event-actions calendar-event-actions-side">
              <button type="button" class="calendar-event-action" data-month-label="${activeMonth}" data-event-edit="${event.id}">Ред.</button>
              <button type="button" class="calendar-event-action is-danger" data-month-label="${activeMonth}" data-event-delete="${event.id}">Удал.</button>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function renderCalendar(monthLabel) {
  const month = calendarData[monthLabel];
  const cells = getMonthMatrix(month.year, month.monthIndex);
  const eventMap = new Map();

  month.events.forEach((event) => {
    if (!eventMap.has(event.day)) {
      eventMap.set(event.day, []);
    }
    eventMap.get(event.day).push(event);
  });

  activeMonth = monthLabel;
  refreshMonthOptions();
  monthSelect.value = monthLabel;
  monthTitle.textContent = month.monthLabel;
  currentDateLabel.textContent = getCurrentDateText();
  calendarGrid.innerHTML = "";

  const daysInMonth = new Date(month.year, month.monthIndex + 1, 0).getDate();
  if (selectedDay > daysInMonth) {
    selectedDay = daysInMonth;
  }

  cells.forEach((cell) => {
    const dayEvents = !cell.outside ? (eventMap.get(cell.day) || []) : [];
    const strongestEvent = dayEvents[0];
    const isToday = !cell.outside
      && month.year === today.year
      && month.monthIndex === today.monthIndex
      && cell.day === today.day;
    const isSelected = !cell.outside && cell.day === selectedDay;

    const button = document.createElement("button");
    button.type = "button";
    button.disabled = cell.outside;
    button.className = `calendar-classic-day${cell.outside ? " is-outside" : ""}${isToday ? " is-today" : ""}${isSelected ? " is-selected" : ""}${strongestEvent ? ` ${eventClass(strongestEvent.type)}` : ""}`;
    button.innerHTML = `
      <span class="calendar-classic-day-number">${cell.day}</span>
      ${dayEvents.length ? '<span class="calendar-classic-day-dot"></span>' : ""}
    `;

    if (!cell.outside) {
      button.addEventListener("click", () => {
        selectedDay = cell.day;
        renderCalendar(activeMonth);
      });
    }

    calendarGrid.appendChild(button);
  });

  renderSelectedDayPanel();
  renderMonthEventsSidebar();
  bindEventActions();
}

function moveMonth(direction) {
  const currentIndex = monthNames.indexOf(activeMonth);
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= monthNames.length) {
    return;
  }

  resetEventForm();
  renderCalendar(monthNames[nextIndex]);
}

eventForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = eventTitleInput.value.trim();
  const time = eventTimeInput.value;
  const type = eventTypeSelect.value;

  if (!title || !time) {
    if (!title) {
      eventTitleInput.focus();
    } else {
      eventTimeInput.focus();
    }
    return;
  }

  if (editingEvent) {
    const month = calendarData[editingEvent.monthLabel];
    const currentEvent = month?.events.find((item) => item.id === editingEvent.eventId);
    if (currentEvent) {
      currentEvent.day = selectedDay;
      currentEvent.title = title;
      currentEvent.time = time;
      currentEvent.type = type;
    }
  } else {
    calendarData[activeMonth].events.push({
      id: `event-${Date.now()}`,
      day: selectedDay,
      type,
      title,
      time
    });
  }

  saveCalendarData();
  resetEventForm();
  renderCalendar(activeMonth);
});

eventCancelButton.addEventListener("click", () => {
  resetEventForm();
});

monthSelect.addEventListener("change", (event) => {
  resetEventForm();
  renderCalendar(event.target.value);
});

prevMonthButton.addEventListener("click", () => {
  moveMonth(-1);
});

nextMonthButton.addEventListener("click", () => {
  moveMonth(1);
});

weekdayShort.forEach((weekday) => {
  const cell = document.createElement("div");
  cell.className = "calendar-weekday";
  cell.textContent = weekday;
  weekdaysRow.appendChild(cell);
});

refreshMonthOptions();
renderCalendar(activeMonth);
