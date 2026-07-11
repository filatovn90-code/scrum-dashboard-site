const AUTH_KEY = "scrum-dashboard-auth-user";

if (!window.appStorage.getItem(AUTH_KEY)) {
  window.location.replace("index.html");
}

const activeUser = window.appStorage.getItem(AUTH_KEY);

const TIMELINE_STORAGE_KEY = "scrum-master-calendar-data";
const TIMELINE_WEEK_STORAGE_KEY = "scrum-master-calendar-week";
const TIMELINE_DAY_STORAGE_KEY = "scrum-master-calendar-day";
const userTimelineStorageKey = `${TIMELINE_STORAGE_KEY}:${activeUser}`;
const userTimelineWeekStorageKey = `${TIMELINE_WEEK_STORAGE_KEY}:${activeUser}`;
const TIMELINE_YEAR = 2026;

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

const seededTimelineData = {
  "Неделя 04.05 - 08.05": {
    days: [
      {
        date: "04.05",
        weekday: "Понедельник",
        deadlines: [
          { id: "may4-overview", title: "Подготовить квартальный обзор", time: "18:00" }
        ]
      },
      {
        date: "05.05",
        weekday: "Вторник",
        deadlines: [
          { id: "may5-planning", title: "Планирование квартала", time: "10:00" }
        ]
      },
      {
        date: "06.05",
        weekday: "Среда",
        deadlines: []
      },
      {
        date: "07.05",
        weekday: "Четверг",
        deadlines: [
          { id: "may7-sprint", title: "Sprint Planning", time: "12:00" }
        ]
      },
      {
        date: "08.05",
        weekday: "Пятница",
        deadlines: [
          { id: "may8-radar", title: "Проверить материалы по Agile Radar", time: "16:30" }
        ]
      }
    ]
  },
  "Неделя 11.05 - 15.05": {
    days: [
      { date: "11.05", weekday: "Понедельник", deadlines: [] },
      { date: "12.05", weekday: "Вторник", deadlines: [] },
      {
        date: "13.05",
        weekday: "Среда",
        deadlines: [{ id: "may13-jira", title: "Финализировать Jira hygiene report", time: "17:00" }]
      },
      { date: "14.05", weekday: "Четверг", deadlines: [{ id: "may14-ttm", title: "Сдать LT / TTM сводку", time: "17:30" }] },
      { date: "15.05", weekday: "Пятница", deadlines: [] }
    ]
  }
};

const weekSelect = document.getElementById("timelineWeekSelect");
const prevWeekButton = document.getElementById("timelinePrevWeek");
const nextWeekButton = document.getElementById("timelineNextWeek");
const timelineBoard = document.getElementById("timelineBoard");
const selectedDayTitle = document.getElementById("timelineSelectedDay");
const selectedList = document.getElementById("timelineSelectedList");
const weekMeta = document.getElementById("timelineWeekMeta");
const summaryTitle = document.getElementById("timelineSummaryTitle");
const summaryList = document.getElementById("timelineSummaryList");
const deadlineForm = document.getElementById("timelineDeadlineForm");
const deadlineTitleInput = document.getElementById("timelineDeadlineTitle");
const deadlineTimeInput = document.getElementById("timelineDeadlineTime");
const deadlineSubmitButton = document.getElementById("timelineDeadlineSubmit");
const deadlineCancelButton = document.getElementById("timelineDeadlineCancel");
const logoutButton = document.getElementById("logoutButton");

const weekdayNames = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
const monthNames = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

let timelineData = loadTimelineData();
let weekNames = Object.keys(timelineData).sort((a, b) => weekStartValue(a) - weekStartValue(b));
let activeWeek = resolveDefaultWeek();
let selectedDay = resolveSelectedDay(activeWeek);
let editingDeadline = null;

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

function weekLabel(startDate, endDate) {
  return `Неделя ${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function createEmptyWeek(startDate, endLimit) {
  const days = [];

  for (let offset = 0; offset < 5; offset += 1) {
    const date = addDays(startDate, offset);
    if (date > endLimit || date.getFullYear() !== TIMELINE_YEAR) {
      break;
    }

    days.push({
      date: formatDate(date),
      weekday: weekdayNames[date.getDay()],
      deadlines: []
    });
  }

  const endDate = addDays(startDate, days.length - 1);
  return {
    [weekLabel(startDate, endDate)]: { days }
  };
}

function generateWeeksUntilYearEnd() {
  const generated = {};
  const start = new Date(TIMELINE_YEAR, 3, 20);
  const yearEnd = new Date(TIMELINE_YEAR, 11, 31);
  let cursor = new Date(start);

  while (cursor <= yearEnd) {
    Object.assign(generated, createEmptyWeek(cursor, yearEnd));
    cursor = addDays(cursor, 7);
  }

  return generated;
}

function weekStartValue(label) {
  const match = label.match(/(\d{2})\.(\d{2})/);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const [, day, month] = match;
  return new Date(TIMELINE_YEAR, Number(month) - 1, Number(day)).getTime();
}

function shortWeekLabel(label) {
  const match = label.match(/(\d{2}\.\d{2})\s*-\s*(\d{2}\.\d{2})/);
  if (!match) {
    return label;
  }

  return `${match[1]} - ${match[2]}`;
}

function monthNameForWeek(label) {
  const match = label.match(/(\d{2})\.(\d{2})/);
  if (!match) {
    return "Без месяца";
  }

  return monthNames[Number(match[2]) - 1] || "Без месяца";
}

function normalizeWeek(week) {
  return {
    days: (week.days || []).map((day) => ({
      date: day.date,
      weekday: day.weekday,
      deadlines: (day.deadlines || []).map((deadline, index) => ({
        id: deadline.id || `deadline-${day.date}-${index}-${Date.now()}`,
        title: deadline.title || "",
        time: deadline.time || ""
      }))
    }))
  };
}

function mergeWeekData(template, stored) {
  const merged = {};

  Object.entries(template).forEach(([week, value]) => {
    merged[week] = stored?.[week] ? normalizeWeek(stored[week]) : JSON.parse(JSON.stringify(value));
  });

  Object.entries(stored || {}).forEach(([week, value]) => {
    if (!merged[week]) {
      merged[week] = normalizeWeek(value);
    }
  });

  return merged;
}

function convertLegacyCalendarData(legacy) {
  const converted = {};

  Object.values(legacy || {}).forEach((month) => {
    if (!month || typeof month !== "object" || !Array.isArray(month.events)) {
      return;
    }

    month.events.forEach((event) => {
      const date = new Date(month.year, month.monthIndex, event.day);
      if (Number.isNaN(date.getTime()) || date.getFullYear() !== TIMELINE_YEAR) {
        return;
      }

      const weekday = date.getDay();
      if (weekday === 0 || weekday === 6) {
        return;
      }

      const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
      const monday = addDays(date, mondayOffset);
      const friday = addDays(monday, 4);
      const label = weekLabel(monday, friday);

      if (!converted[label]) {
        converted[label] = {
          days: Array.from({ length: 5 }, (_, index) => {
            const dayDate = addDays(monday, index);
            return {
              date: formatDate(dayDate),
              weekday: weekdayNames[dayDate.getDay()],
              deadlines: []
            };
          })
        };
      }

      const targetDay = converted[label].days.find((dayItem) => dayItem.date === formatDate(date));
      if (!targetDay) {
        return;
      }

      targetDay.deadlines.push({
        id: event.id || `legacy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: event.title || "Дедлайн",
        time: event.time || ""
      });
    });
  });

  return converted;
}

function loadTimelineData() {
  const template = mergeWeekData(generateWeeksUntilYearEnd(), seededTimelineData);
  const raw = window.appStorage.getItem(userTimelineStorageKey);
  const legacyRaw = window.appStorage.getItem(TIMELINE_STORAGE_KEY);

  if (!raw && legacyRaw) {
    try {
      const parsedLegacy = JSON.parse(legacyRaw);
      const legacyConverted = Object.values(parsedLegacy || {}).some((entry) => Array.isArray(entry?.events))
        ? convertLegacyCalendarData(parsedLegacy)
        : parsedLegacy;
      window.appStorage.setItem(userTimelineStorageKey, JSON.stringify(legacyConverted));
    } catch {
      // ignore copy failure
    }
  }

  const resolvedRaw = raw || window.appStorage.getItem(userTimelineStorageKey);
  if (!resolvedRaw) {
    return template;
  }

  try {
    const stored = JSON.parse(resolvedRaw);
    const normalizedStored = Object.values(stored || {}).some((entry) => Array.isArray(entry?.events))
      ? convertLegacyCalendarData(stored)
      : stored;
    return mergeWeekData(template, normalizedStored);
  } catch {
    return template;
  }
}

function saveTimelineData() {
  window.appStorage.setItem(userTimelineStorageKey, JSON.stringify(timelineData));
}

function getCurrentWeekLabel() {
  const now = new Date(2026, 4, 4);
  return weekNames.find((label) => {
    const week = timelineData[label];
    return week?.days.some((day) => day.date === formatDate(now));
  }) || weekNames[0];
}

function resolveDefaultWeek() {
  const storedWeek = window.appStorage.getItem(userTimelineWeekStorageKey);
  return weekNames.includes(storedWeek) ? storedWeek : getCurrentWeekLabel();
}

function focusDayStorageKey(week) {
  return `${TIMELINE_DAY_STORAGE_KEY}:${activeUser}:${week}`;
}

function resolveSelectedDay(week) {
  const days = timelineData[week]?.days || [];
  if (!days.length) {
    return "";
  }

  const storedDay = window.appStorage.getItem(focusDayStorageKey(week));
  return days.some((day) => day.date === storedDay) ? storedDay : days[0].date;
}

function findDay(week, date) {
  return timelineData[week]?.days.find((day) => day.date === date);
}

function sortDeadlines(deadlines) {
  return [...deadlines].sort((left, right) => {
    const leftTime = left.time || "99:99";
    const rightTime = right.time || "99:99";
    if (leftTime !== rightTime) {
      return leftTime.localeCompare(rightTime);
    }
    return left.title.localeCompare(right.title, "ru");
  });
}

function getWeekDeadlineCount(week) {
  return timelineData[week].days.reduce((total, day) => total + day.deadlines.length, 0);
}

function refreshWeekOptions() {
  weekNames = Object.keys(timelineData).sort((a, b) => weekStartValue(a) - weekStartValue(b));
  weekSelect.innerHTML = "";

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
      option.selected = week === activeWeek;
      optgroup.appendChild(option);
    });

    weekSelect.appendChild(optgroup);
  });
}

function resetDeadlineForm() {
  editingDeadline = null;
  deadlineForm.reset();
  deadlineSubmitButton.textContent = "Добавить дедлайн";
  deadlineCancelButton.hidden = true;
}

function renderSelectedDayPanel() {
  const day = findDay(activeWeek, selectedDay);
  if (!day) {
    selectedDayTitle.textContent = "";
    selectedList.innerHTML = "";
    return;
  }

  selectedDayTitle.textContent = `${day.weekday}, ${day.date}`;
  weekMeta.innerHTML = `
    <span class="week-timeline-meta-chip">${day.deadlines.length} дедлайнов</span>
  `;

  const deadlines = sortDeadlines(day.deadlines);
  selectedList.innerHTML = deadlines.length
    ? deadlines.map((deadline) => `
        <article class="week-deadline-item">
          <div class="week-deadline-copy">
            <strong>${deadline.title}</strong>
            <span>${deadline.time || "Без времени"}</span>
          </div>
          <div class="calendar-event-actions">
            <button type="button" class="calendar-event-action" data-deadline-edit="${deadline.id}" data-deadline-day="${day.date}">Ред.</button>
            <button type="button" class="calendar-event-action is-danger" data-deadline-delete="${deadline.id}" data-deadline-day="${day.date}">Удал.</button>
          </div>
        </article>
      `).join("")
    : '<p class="calendar-selected-empty">На этот день пока нет дедлайнов.</p>';
}

function renderWeekSummary() {
  const week = timelineData[activeWeek];
  summaryTitle.textContent = activeWeek;

  const allDeadlines = week.days.flatMap((day) =>
    sortDeadlines(day.deadlines).map((deadline) => ({
      ...deadline,
      dayDate: day.date,
      dayName: day.weekday
    }))
  );

  summaryList.innerHTML = allDeadlines.length
    ? allDeadlines.map((deadline) => `
        <article class="week-summary-item">
          <div class="week-summary-date">
            <strong>${deadline.dayDate}</strong>
            <span>${deadline.dayName}</span>
          </div>
          <div class="week-summary-copy">
            <strong>${deadline.title}</strong>
            <span>${deadline.time || "Без времени"}</span>
          </div>
        </article>
      `).join("")
    : '<p class="calendar-selected-empty">На этой неделе пока нет дедлайнов.</p>';
}

function renderTimelineBoard() {
  const week = timelineData[activeWeek];
  timelineBoard.innerHTML = week.days.map((day) => {
    const deadlines = sortDeadlines(day.deadlines);
    const isSelected = day.date === selectedDay;

    return `
      <section class="week-timeline-day${isSelected ? " is-selected" : ""}" data-day-select="${day.date}">
        <div class="week-timeline-day-header">
          <div class="week-timeline-day-title">
            <strong>${day.date}</strong>
            <span>${day.weekday}</span>
          </div>
          <button type="button" class="backlog-day-add-button week-timeline-add-button" data-day-add="${day.date}">Добавить дедлайн</button>
        </div>
        <div class="week-timeline-day-list">
          ${deadlines.length
            ? deadlines.map((deadline) => `
                <article class="week-timeline-card" data-day-select="${day.date}">
                  <div class="week-timeline-card-time">${deadline.time || "Без времени"}</div>
                  <div class="week-timeline-card-copy">
                    <strong>${deadline.title}</strong>
                  </div>
                </article>
              `).join("")
            : '<div class="week-timeline-empty">Дедлайнов нет</div>'}
        </div>
      </section>
    `;
  }).join("");
}

function bindTimelineActions() {
  timelineBoard.querySelectorAll("[data-day-select]").forEach((element) => {
    element.addEventListener("click", () => {
      selectedDay = element.dataset.daySelect;
      window.appStorage.setItem(focusDayStorageKey(activeWeek), selectedDay);
      resetDeadlineForm();
      renderTimeline(activeWeek);
    });
  });

  timelineBoard.querySelectorAll("[data-day-add]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      selectedDay = button.dataset.dayAdd;
      window.appStorage.setItem(focusDayStorageKey(activeWeek), selectedDay);
      resetDeadlineForm();
      renderTimeline(activeWeek);
      deadlineTitleInput.focus();
    });
  });

  document.querySelectorAll("[data-deadline-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const day = findDay(activeWeek, button.dataset.deadlineDay);
      const deadline = day?.deadlines.find((item) => item.id === button.dataset.deadlineEdit);
      if (!deadline) {
        return;
      }

      selectedDay = button.dataset.deadlineDay;
      editingDeadline = { day: button.dataset.deadlineDay, id: deadline.id };
      deadlineTitleInput.value = deadline.title;
      deadlineTimeInput.value = deadline.time;
      deadlineSubmitButton.textContent = "Сохранить";
      deadlineCancelButton.hidden = false;
      renderTimeline(activeWeek);
      deadlineTitleInput.focus();
    });
  });

  document.querySelectorAll("[data-deadline-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const day = findDay(activeWeek, button.dataset.deadlineDay);
      if (!day) {
        return;
      }

      day.deadlines = day.deadlines.filter((item) => item.id !== button.dataset.deadlineDelete);
      if (editingDeadline && editingDeadline.id === button.dataset.deadlineDelete) {
        resetDeadlineForm();
      }
      saveTimelineData();
      renderTimeline(activeWeek);
    });
  });
}

function renderTimeline(week) {
  activeWeek = week;
  selectedDay = findDay(week, selectedDay) ? selectedDay : resolveSelectedDay(week);
  weekSelect.value = week;
  renderTimelineBoard();
  renderSelectedDayPanel();
  renderWeekSummary();
  bindTimelineActions();
}

function moveWeek(direction) {
  const index = weekNames.indexOf(activeWeek);
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= weekNames.length) {
    return;
  }

  resetDeadlineForm();
  window.appStorage.setItem(userTimelineWeekStorageKey, weekNames[nextIndex]);
  renderTimeline(weekNames[nextIndex]);
}

deadlineForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = deadlineTitleInput.value.trim();
  const time = deadlineTimeInput.value;

  if (!title) {
    deadlineTitleInput.focus();
    return;
  }

  const day = findDay(activeWeek, selectedDay);
  if (!day) {
    return;
  }

  if (editingDeadline) {
    const current = day.deadlines.find((item) => item.id === editingDeadline.id);
    if (current) {
      current.title = title;
      current.time = time;
    }
  } else {
    day.deadlines.push({
      id: `deadline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      time
    });
  }

  saveTimelineData();
  resetDeadlineForm();
  renderTimeline(activeWeek);
});

deadlineCancelButton.addEventListener("click", () => {
  resetDeadlineForm();
});

weekSelect.addEventListener("change", (event) => {
  resetDeadlineForm();
  window.appStorage.setItem(userTimelineWeekStorageKey, event.target.value);
  renderTimeline(event.target.value);
});

prevWeekButton?.addEventListener("click", () => moveWeek(-1));
nextWeekButton?.addEventListener("click", () => moveWeek(1));

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

refreshWeekOptions();
renderTimeline(activeWeek);
