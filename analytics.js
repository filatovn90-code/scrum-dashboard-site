const AUTH_KEY = "scrum-dashboard-auth-user";

if (!window.appStorage.getItem(AUTH_KEY)) {
  window.location.replace("index.html");
}

const activeUser = window.appStorage.getItem(AUTH_KEY);
const logoutButton = document.getElementById("logoutButton");
const analyticsWeekPicker = document.getElementById("analyticsWeekPicker");
const analyticsWeeksTrigger = document.getElementById("analyticsWeeksTrigger");
const analyticsWeeksTriggerLabel = document.getElementById("analyticsWeeksTriggerLabel");
const analyticsWeeksMenu = document.getElementById("analyticsWeeksMenu");
const analyticsWeeksOptions = document.getElementById("analyticsWeeksOptions");
const analyticsOverview = document.getElementById("analyticsOverview");
const weekdayChart = document.getElementById("weekdayChart");
const energyTypeChart = document.getElementById("energyTypeChart");

const BACKLOG_STORAGE_KEY = "scrum-master-backlog-data";
const userBacklogStorageKey = `${BACKLOG_STORAGE_KEY}:${activeUser}`;
const userBacklogWeekStorageKey = `scrum-master-backlog-week:${activeUser}`;
const userAnalyticsWeeksStorageKey = `scrum-master-analytics-weeks:${activeUser}`;

const weekdayOrder = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница"];
const energyTypeOrder = ["Deep Work", "High Energy", "Low Energy"];
const monthNames = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

const fallbackBacklogData = {
  "Неделя 20.04 - 24.04": {
    days: [
      {
        date: "20.04",
        weekday: "Понедельник",
        items: [
          { text: "Написать расписание встреч по планированию", taskType: "Deep Work" },
          { text: "Заполнить еженедельный отчет", taskType: "Low Energy" },
          { text: "Подготовиться к встрече завтра с ИТ", taskType: "High Energy" }
        ]
      },
      {
        date: "21.04",
        weekday: "Вторник",
        items: [
          { text: "Подготовиться к встрече с ИТ", taskType: "High Energy" },
          { text: "Сделать презентацию для встречи в среду", taskType: "Deep Work" }
        ]
      }
    ]
  }
};

function loadBacklogData() {
  const userRaw = window.appStorage.getItem(userBacklogStorageKey);
  const legacyRaw = window.appStorage.getItem(BACKLOG_STORAGE_KEY);
  const raw = userRaw || legacyRaw;

  if (!raw) {
    return fallbackBacklogData;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return fallbackBacklogData;
  }
}

function monthNameForWeek(week) {
  const match = week.match(/(\d{2})\.(\d{2})/);
  if (!match) {
    return "Без месяца";
  }

  return monthNames[Number(match[2]) - 1] || "Без месяца";
}

function weekStartValue(label) {
  const match = label.match(/(\d{2})\.(\d{2})/);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const [, day, month] = match;
  return new Date(2026, Number(month) - 1, Number(day)).getTime();
}

function compactWeekLabel(week) {
  const match = week.match(/(\d{2}\.\d{2})\s*-\s*(\d{2}\.\d{2})/);
  if (!match) {
    return week;
  }

  return `${match[1]} - ${match[2]}`;
}

function pluralizeWeeks(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return "неделя";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "недели";
  return "недель";
}

function pluralizeTasks(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return "задача";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "задачи";
  return "задач";
}

function getBarHeight(value, maxValue) {
  if (!maxValue) {
    return 12;
  }

  return Math.max(12, Math.round((value / maxValue) * 100));
}

const backlogData = loadBacklogData();
const weekNames = Object.keys(backlogData).sort((a, b) => weekStartValue(a) - weekStartValue(b));
const storedSingleWeek = window.appStorage.getItem(userBacklogWeekStorageKey);

function loadSelectedWeeks() {
  try {
    const stored = JSON.parse(window.appStorage.getItem(userAnalyticsWeeksStorageKey) || "null");
    if (Array.isArray(stored)) {
      const filtered = stored.filter((week) => weekNames.includes(week));
      if (filtered.length) {
        return filtered;
      }
    }
  } catch {
    // ignore parse errors
  }

  if (storedSingleWeek && weekNames.includes(storedSingleWeek)) {
    return [storedSingleWeek];
  }

  return weekNames.length ? [weekNames[0]] : [];
}

let activeWeeks = loadSelectedWeeks();

function saveSelectedWeeks() {
  window.appStorage.setItem(userAnalyticsWeeksStorageKey, JSON.stringify(activeWeeks));
}

function updateTriggerLabel() {
  if (!activeWeeks.length) {
    analyticsWeeksTriggerLabel.textContent = "Выбрать недели";
    return;
  }

  if (activeWeeks.length === 1) {
    analyticsWeeksTriggerLabel.textContent = compactWeekLabel(activeWeeks[0]);
    return;
  }

  analyticsWeeksTriggerLabel.textContent = `${activeWeeks.length} ${pluralizeWeeks(activeWeeks.length)}`;
}

function setMenuState(isOpen) {
  analyticsWeeksMenu.hidden = !isOpen;
  analyticsWeeksTrigger.setAttribute("aria-expanded", String(isOpen));
  analyticsWeekPicker.classList.toggle("is-open", isOpen);
}

function toggleWeekSelection(week, checked) {
  if (checked) {
    if (!activeWeeks.includes(week)) {
      activeWeeks = [...activeWeeks, week].sort((a, b) => weekStartValue(a) - weekStartValue(b));
    }
  } else {
    const nextWeeks = activeWeeks.filter((item) => item !== week);
    if (nextWeeks.length) {
      activeWeeks = nextWeeks;
    }
  }

  renderWeekPicker();
  saveSelectedWeeks();
  renderAnalytics();
}

function renderWeekPicker() {
  analyticsWeeksOptions.innerHTML = "";

  const weeksByMonth = weekNames.reduce((groups, week) => {
    const month = monthNameForWeek(week);
    if (!groups[month]) {
      groups[month] = [];
    }
    groups[month].push(week);
    return groups;
  }, {});

  Object.entries(weeksByMonth).forEach(([month, weeks]) => {
    const group = document.createElement("section");
    group.className = "analytics-multi-group";

    const title = document.createElement("p");
    title.className = "analytics-multi-group-title";
    title.textContent = month;
    group.appendChild(title);

    const list = document.createElement("div");
    list.className = "analytics-multi-group-list";

    weeks.forEach((week) => {
      const optionId = `analytics-week-${week.replace(/[^0-9]/g, "")}`;
      const label = document.createElement("label");
      label.className = "analytics-multi-option";
      label.setAttribute("for", optionId);

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = optionId;
      checkbox.checked = activeWeeks.includes(week);
      checkbox.addEventListener("change", () => {
        toggleWeekSelection(week, checkbox.checked);
      });

      const copy = document.createElement("span");
      copy.className = "analytics-multi-option-copy";
      copy.textContent = compactWeekLabel(week);

      label.appendChild(checkbox);
      label.appendChild(copy);
      list.appendChild(label);
    });

    group.appendChild(list);
    analyticsWeeksOptions.appendChild(group);
  });

  updateTriggerLabel();
}

function buildSummary(weeks) {
  const weekdayCounts = Object.fromEntries(weekdayOrder.map((day) => [day, 0]));
  const energyTypeCounts = Object.fromEntries(energyTypeOrder.map((type) => [type, 0]));
  let totalTasks = 0;

  weeks.forEach((week) => {
    (week.days || []).forEach((day) => {
      const tasks = day.items || [];
      totalTasks += tasks.length;

      if (weekdayCounts[day.weekday] !== undefined) {
        weekdayCounts[day.weekday] += tasks.length;
      }

      tasks.forEach((task) => {
        const taskType = task.taskType || "Low Energy";
        if (energyTypeCounts[taskType] !== undefined) {
          energyTypeCounts[taskType] += 1;
        }
      });
    });
  });

  const busiestDayEntry = Object.entries(weekdayCounts).sort((left, right) => right[1] - left[1])[0] || ["Нет данных", 0];
  const dominantTypeEntry = Object.entries(energyTypeCounts).sort((left, right) => right[1] - left[1])[0] || ["Нет данных", 0];

  return {
    totalTasks,
    weekdayCounts,
    energyTypeCounts,
    busiestDay: {
      label: busiestDayEntry[0],
      count: busiestDayEntry[1]
    },
    dominantType: {
      label: dominantTypeEntry[0],
      count: dominantTypeEntry[1]
    }
  };
}

function renderOverview(summary) {
  const cards = [
    { label: "Всего задач", value: summary.totalTasks, note: `${summary.totalTasks} ${pluralizeTasks(summary.totalTasks)}` },
    { label: "Самый загруженный день", value: summary.busiestDay.label, note: `${summary.busiestDay.count} ${pluralizeTasks(summary.busiestDay.count)}` }
  ];

  analyticsOverview.innerHTML = cards.map((card) => `
    <article class="analytics-card">
      <p class="analytics-card-label">${card.label}</p>
      <strong class="analytics-card-value">${card.value}</strong>
      <span class="analytics-card-note">${card.note}</span>
    </article>
  `).join("");
}

function renderColumnChart(container, rows) {
  const maxValue = Math.max(...rows.map((row) => row.count), 0);
  const steps = 4;
  const roundedMax = maxValue > 0 ? Math.max(4, Math.ceil(maxValue / 2) * 2) : 4;
  const axisValues = Array.from({ length: steps + 1 }, (_, index) => {
    return Math.round((roundedMax / steps) * (steps - index));
  });

  container.innerHTML = `
    <div class="analytics-weekday-chart">
      <div class="analytics-weekday-scale">
        ${axisValues.map((value) => `
          <span class="analytics-weekday-scale-value">${value}</span>
        `).join("")}
      </div>
      <div class="analytics-weekday-plot">
        <div class="analytics-weekday-grid">
          ${axisValues.map(() => '<span class="analytics-weekday-grid-line"></span>').join("")}
        </div>
        <div class="analytics-weekday-bars">
          ${rows.map((row) => `
            <article class="analytics-weekday-bar-card">
              <strong class="analytics-weekday-bar-value">${row.count}</strong>
              <div class="analytics-weekday-bar-track">
                <span class="analytics-weekday-bar-fill" style="height: ${getBarHeight(row.count, roundedMax)}%"></span>
              </div>
              <span class="analytics-weekday-bar-label">${row.label}</span>
            </article>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function energyTypeClass(taskType) {
  if (taskType === "Deep Work") return "task-type-deep";
  if (taskType === "High Energy") return "task-type-high";
  return "task-type-low";
}

function energyTypeColor(taskType) {
  if (taskType === "Deep Work") return "#5b84c4";
  if (taskType === "High Energy") return "#c96060";
  return "#6faa76";
}

function renderEnergyWheel(container, rows) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  if (!total) {
    container.innerHTML = '<p class="analytics-empty">В выбранных неделях пока нет задач для Energy Type.</p>';
    return;
  }

  let currentAngle = 0;
  const segments = rows.map((row) => {
    const share = row.count / total;
    const start = currentAngle;
    const end = currentAngle + share * 360;
    currentAngle = end;
    return `${energyTypeColor(row.label)} ${start}deg ${end}deg`;
  }).join(", ");

  container.innerHTML = `
    <div class="analytics-wheel-layout">
      <div class="analytics-wheel-card">
        <div class="analytics-wheel" style="background: conic-gradient(${segments});">
          <div class="analytics-wheel-center">
            <strong>${total}</strong>
            <span>задач</span>
          </div>
        </div>

        <div class="analytics-wheel-legend">
          ${rows.map((row) => {
            const percent = total ? Math.round((row.count / total) * 100) : 0;
            return `
              <div class="analytics-wheel-legend-item">
                <span class="analytics-wheel-dot ${energyTypeClass(row.label)}"></span>
                <div class="analytics-wheel-legend-text">
                  <strong>${row.label}</strong>
                  <span>${row.count} • ${percent}%</span>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderAnalytics() {
  const selectedWeekData = activeWeeks
    .map((week) => backlogData[week])
    .filter(Boolean);
  const summary = buildSummary(selectedWeekData);

  renderOverview(summary);

  renderColumnChart(
    weekdayChart,
    weekdayOrder.map((day) => ({
      label: day,
      count: summary.weekdayCounts[day] || 0
    }))
  );

  renderEnergyWheel(
    energyTypeChart,
    energyTypeOrder.map((type) => ({
      label: type,
      count: summary.energyTypeCounts[type] || 0
    }))
  );
}

analyticsWeeksTrigger?.addEventListener("click", () => {
  const isOpen = analyticsWeeksTrigger.getAttribute("aria-expanded") === "true";
  setMenuState(!isOpen);
});

document.addEventListener("click", (event) => {
  if (!analyticsWeekPicker?.contains(event.target)) {
    setMenuState(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuState(false);
  }
});

logoutButton?.addEventListener("click", () => {
  window.appStorage.removeItem(AUTH_KEY);
  window.location.replace("index.html");
});

renderWeekPicker();
renderAnalytics();
