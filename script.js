const STORAGE_KEY = "scrum-dashboard-data-v2";
const AUTH_KEY = "scrum-dashboard-auth-user";

const USERS = {
  "Филатов": "filatov2026",
  "Оберемко": "oberemko2026",
  "Кошелева": "kosheleva2026",
  "Администратор": "scrum2026!"
};

const DEFAULT_QUARTER = "Q2 2026";
const ASSIGNEE_OPTIONS = ["Все", "Филатов", "Оберемко", "Кошелева"];

const seedData = {
  metricsByQuarter: {
    "Q1 2026": [
      { id: "q1-predictability", name: "Квартальная предсказуемость по КРам", value: "72%", target: "80%" },
      { id: "q1-radar", name: "Agile Radar", value: "3.8/5", target: "4.2/5" },
      { id: "q1-jira", name: "Гигиена Jira", value: "79%", target: "90%" },
      { id: "q1-effort", name: "Трудозатраты", value: "84%", target: "90%" },
      { id: "q1-planning", name: "Подготовка к планированию по чек-листу", value: "68%", target: "85%" },
      { id: "q1-utilization", name: "Утилизация ресурсов на цели МП", value: "74%", target: "85%" },
      { id: "q1-ttm", name: "TTM", value: "29 дн", target: "20 дн" },
      { id: "q1-lt", name: "LT", value: "18 дн", target: "12 дн" },
      { id: "q1-epics", name: "Качество эпиков", value: "71%", target: "85%" }
    ],
    "Q2 2026": [
      { id: "q2-predictability", name: "Квартальная предсказуемость по КРам", value: "81%", target: "85%" },
      { id: "q2-radar", name: "Agile Radar", value: "4.1/5", target: "4.3/5" },
      { id: "q2-jira", name: "Гигиена Jira", value: "86%", target: "92%" },
      { id: "q2-effort", name: "Трудозатраты", value: "88%", target: "90%" },
      { id: "q2-planning", name: "Подготовка к планированию по чек-листу", value: "83%", target: "90%" },
      { id: "q2-utilization", name: "Утилизация ресурсов на цели МП", value: "79%", target: "85%" },
      { id: "q2-ttm", name: "TTM", value: "24 дн", target: "18 дн" },
      { id: "q2-lt", name: "LT", value: "14 дн", target: "10 дн" },
      { id: "q2-epics", name: "Качество эпиков", value: "84%", target: "90%" }
    ],
    "Q3 2026": [
      { id: "q3-predictability", name: "Квартальная предсказуемость по КРам", value: "85%", target: "88%" },
      { id: "q3-radar", name: "Agile Radar", value: "4.2/5", target: "4.4/5" },
      { id: "q3-jira", name: "Гигиена Jira", value: "89%", target: "93%" },
      { id: "q3-effort", name: "Трудозатраты", value: "90%", target: "92%" },
      { id: "q3-planning", name: "Подготовка к планированию по чек-листу", value: "87%", target: "92%" },
      { id: "q3-utilization", name: "Утилизация ресурсов на цели МП", value: "82%", target: "87%" },
      { id: "q3-ttm", name: "TTM", value: "21 дн", target: "17 дн" },
      { id: "q3-lt", name: "LT", value: "12 дн", target: "9 дн" },
      { id: "q3-epics", name: "Качество эпиков", value: "88%", target: "91%" }
    ],
    "Q4 2026": [
      { id: "q4-predictability", name: "Квартальная предсказуемость по КРам", value: "88%", target: "90%" },
      { id: "q4-radar", name: "Agile Radar", value: "4.4/5", target: "4.5/5" },
      { id: "q4-jira", name: "Гигиена Jira", value: "92%", target: "95%" },
      { id: "q4-effort", name: "Трудозатраты", value: "91%", target: "93%" },
      { id: "q4-planning", name: "Подготовка к планированию по чек-листу", value: "90%", target: "95%" },
      { id: "q4-utilization", name: "Утилизация ресурсов на цели МП", value: "85%", target: "90%" },
      { id: "q4-ttm", name: "TTM", value: "18 дн", target: "15 дн" },
      { id: "q4-lt", name: "LT", value: "10 дн", target: "8 дн" },
      { id: "q4-epics", name: "Качество эпиков", value: "91%", target: "93%" }
    ]
  },
  goalsByQuarter: {
    "Q1 2026": [
      { id: "q1-goal-1", title: "Квартальная предсказуемость по КРам", owner: "Филатов", acceptance: "План-факт по КРам стабилен и отклонение не превышает согласованный порог." },
      { id: "q1-goal-2", title: "Agile Radar", owner: "Оберемко", acceptance: "Диагностика проведена, зоны роста согласованы и зафиксированы действия." },
      { id: "q1-goal-3", title: "Гигиена Jira", owner: "Кошелева", acceptance: "Обязательные поля заполнены, статусы актуальны, просроченные элементы разобраны." }
    ],
    "Q2 2026": [
      { id: "q2-goal-1", title: "Квартальная предсказуемость по КРам", owner: "Филатов", acceptance: "Не менее 85% квартальных обязательств выполняются в согласованный срок." },
      { id: "q2-goal-2", title: "Agile Radar", owner: "Оберемко", acceptance: "Команда прошла оценку, выбраны 2-3 приоритетные зоны улучшения и назначены владельцы." },
      { id: "q2-goal-3", title: "Гигиена Jira", owner: "Кошелева", acceptance: "Бэклог очищен, задачи актуальны, SLA по обновлению статусов соблюдается." },
      { id: "q2-goal-4", title: "Трудозатраты", owner: "Филатов", acceptance: "Данные по трудозатратам прозрачны и пригодны для еженедельного анализа." },
      { id: "q2-goal-5", title: "Подготовка к планированию по чек-листу", owner: "Оберемко", acceptance: "Чек-лист закрывается до планирования, критичных хвостов не остается." },
      { id: "q2-goal-6", title: "Утилизация ресурсов на цели МП", owner: "Кошелева", acceptance: "Распределение емкости команды на цели МП прозрачно и подтверждено стейкхолдерами." },
      { id: "q2-goal-7", title: "TTM", owner: "Филатов", acceptance: "Среднее время вывода инициативы сокращено до целевого уровня квартала." },
      { id: "q2-goal-8", title: "LT", owner: "Оберемко", acceptance: "Lead Time стабилизирован и не выходит за согласованный диапазон." },
      { id: "q2-goal-9", title: "Качество эпиков", owner: "Кошелева", acceptance: "Эпики имеют четкие границы, критерии успеха и готовы к декомпозиции." }
    ],
    "Q3 2026": [
      { id: "q3-goal-1", title: "Квартальная предсказуемость по КРам", owner: "Филатов", acceptance: "Выполнение квартальных КРов предсказуемо, риски эскалируются заранее." },
      { id: "q3-goal-2", title: "Подготовка к планированию по чек-листу", owner: "Оберемко", acceptance: "Планирование стартует только после прохождения полного чек-листа готовности." },
      { id: "q3-goal-3", title: "Качество эпиков", owner: "Кошелева", acceptance: "Каждый эпик содержит цель, scope, зависимости и критерии завершения." }
    ],
    "Q4 2026": [
      { id: "q4-goal-1", title: "Agile Radar", owner: "Оберемко", acceptance: "Повторная оценка показывает прогресс по выбранным зонам развития." },
      { id: "q4-goal-2", title: "Гигиена Jira", owner: "Кошелева", acceptance: "Jira поддерживается в актуальном состоянии без накопленного операционного долга." },
      { id: "q4-goal-3", title: "Трудозатраты", owner: "Филатов", acceptance: "Анализ трудозатрат подтверждает управляемость загрузки и отсутствие критичных перекосов." }
    ]
  }
};

let state = loadState();
let activeUser = localStorage.getItem(AUTH_KEY) || "";

const goalGrid = document.getElementById("goalGrid");
const metricsGrid = document.getElementById("metricsGrid");
const quarterSelect = document.getElementById("quarterSelect");
const goalQuarterSelect = document.getElementById("goalQuarterSelect");
const assigneeSelect = document.getElementById("assigneeSelect");
const protectedNavLinks = Array.from(document.querySelectorAll('.site-nav .nav-link')).filter((link) => link.getAttribute("href") !== "index.html");
const loginToggle = document.getElementById("loginToggle");
const editModeBanner = document.getElementById("editModeBanner");
const editModeText = document.getElementById("editModeText");
const authModal = document.getElementById("authModal");
const authBackdrop = document.getElementById("authBackdrop");
const authForm = document.getElementById("authForm");
const authUser = document.getElementById("authUser");
const authPassword = document.getElementById("authPassword");
const authCancel = document.getElementById("authCancel");
const authError = document.getElementById("authError");
const goalCreateForm = document.getElementById("goalCreateForm");
const newGoalTitle = document.getElementById("newGoalTitle");
const newGoalQuarter = document.getElementById("newGoalQuarter");
const newGoalOwner = document.getElementById("newGoalOwner");
const newGoalAcceptance = document.getElementById("newGoalAcceptance");

function cloneSeedData() {
  return JSON.parse(JSON.stringify(seedData));
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!stored || !stored.metricsByQuarter || !stored.goalsByQuarter) {
      return cloneSeedData();
    }
    return stored;
  } catch {
    return cloneSeedData();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function isAuthenticated() {
  return Boolean(activeUser);
}

function isEditingEnabled() {
  return activeUser === "Филатов";
}

function getQuarterList() {
  return Object.keys(state.metricsByQuarter);
}

function createChip(container, value, label) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "filter-chip";
  chip.dataset.value = value;
  chip.textContent = label;
  container.appendChild(chip);
}

function getSelectedValues(container) {
  return Array.from(container.querySelectorAll(".filter-chip.is-active")).map((chip) => chip.dataset.value);
}

function setSelectedValues(container, values) {
  container.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.classList.toggle("is-active", values.includes(chip.dataset.value));
  });
}

function renderMetrics(quarter) {
  const metrics = state.metricsByQuarter[quarter] || [];
  metricsGrid.innerHTML = "";

  metrics.forEach((metric) => {
    const card = document.createElement("article");
    card.className = "metric-card";

    if (isEditingEnabled()) {
      card.innerHTML = `
        <h3>${metric.name}</h3>
        <form class="metric-edit-form" data-metric-id="${metric.id}" data-quarter="${quarter}">
          <div class="metric-values metric-values-editable">
            <input class="metric-input" name="value" value="${escapeHtml(metric.value)}" aria-label="Текущее значение ${metric.name}">
            <input class="metric-input" name="target" value="${escapeHtml(metric.target || "")}" aria-label="Целевое значение ${metric.name}">
          </div>
          <button class="form-action-button metric-save-button" type="submit">Сохранить</button>
        </form>
      `;
    } else {
      card.innerHTML = `
        <h3>${metric.name}</h3>
        <div class="metric-values">
          <div><div class="metric-value">${metric.value}</div></div>
          <div><div class="metric-value metric-value-target">${metric.target || "-"}</div></div>
        </div>
      `;
    }

    metricsGrid.appendChild(card);
  });

  metricsGrid.querySelectorAll(".metric-edit-form").forEach((form) => {
    form.addEventListener("submit", handleMetricSave);
  });
}

function renderGoals(selectedQuarters, selectedAssignees) {
  goalGrid.innerHTML = "";

  const quarters = selectedQuarters.length ? selectedQuarters : Object.keys(state.goalsByQuarter);
  const assignees = selectedAssignees.length ? selectedAssignees : ["Все"];

  const goals = quarters
    .flatMap((quarter) => (state.goalsByQuarter[quarter] || []).map((goal) => ({ ...goal, quarter })))
    .filter((goal) => assignees.includes("Все") || assignees.includes(goal.owner));

  goals.forEach((goal) => {
    const card = document.createElement("article");
    card.className = "goal-card";

    if (isEditingEnabled()) {
      card.innerHTML = `
        <form class="goal-edit-form" data-goal-id="${goal.id}" data-quarter="${goal.quarter}">
          <div class="goal-edit-grid">
            <input class="goal-edit-input goal-edit-title" name="title" value="${escapeHtml(goal.title)}" aria-label="Название цели">
            <select class="goal-edit-select" name="quarter" aria-label="Квартал цели">
              ${getQuarterList()
                .map((quarter) => `<option value="${quarter}"${quarter === goal.quarter ? " selected" : ""}>${quarter}</option>`)
                .join("")}
            </select>
            <select class="goal-edit-select" name="owner" aria-label="Ответственный">
              ${ASSIGNEE_OPTIONS.filter((name) => name !== "Все")
                .map((owner) => `<option value="${owner}"${owner === goal.owner ? " selected" : ""}>${owner}</option>`)
                .join("")}
            </select>
            <input class="goal-edit-input" name="acceptance" value="${escapeHtml(goal.acceptance || "")}" aria-label="Критерии приемки">
          </div>
          <div class="goal-edit-actions">
            <button class="form-action-button" type="submit">Сохранить</button>
            <button class="ghost-button" type="button" data-action="delete-goal" data-goal-id="${goal.id}" data-quarter="${goal.quarter}">Удалить</button>
          </div>
        </form>
      `;
    } else {
      card.innerHTML = `
        <h3>${goal.title}</h3>
        <p class="goal-acceptance">${goal.acceptance || ""}</p>
        <div class="goal-meta">
          <span>${goal.owner}</span>
        </div>
      `;
    }

    goalGrid.appendChild(card);
  });

  goalGrid.querySelectorAll(".goal-edit-form").forEach((form) => {
    form.addEventListener("submit", handleGoalSave);
  });

  goalGrid.querySelectorAll('[data-action="delete-goal"]').forEach((button) => {
    button.addEventListener("click", handleGoalDelete);
  });
}

function bindQuarterChips() {
  goalQuarterSelect.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("is-active");
      if (!getSelectedValues(goalQuarterSelect).length) {
        chip.classList.add("is-active");
      }
      syncGoals();
    });
  });
}

function bindAssigneeChips() {
  assigneeSelect.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const value = chip.dataset.value;
      if (value === "Все") {
        setSelectedValues(assigneeSelect, ["Все"]);
      } else {
        assigneeSelect.querySelector('[data-value="Все"]')?.classList.remove("is-active");
        chip.classList.toggle("is-active");
        const selected = getSelectedValues(assigneeSelect).filter((item) => item !== "Все");
        if (!selected.length) {
          setSelectedValues(assigneeSelect, ["Все"]);
        }
      }
      syncGoals();
    });
  });
}

function syncGoals() {
  renderGoals(getSelectedValues(goalQuarterSelect), getSelectedValues(assigneeSelect));
}

function handleMetricSave(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const quarter = form.dataset.quarter;
  const metricId = form.dataset.metricId;
  const value = form.elements.value.value.trim();
  const target = form.elements.target.value.trim();
  const metrics = state.metricsByQuarter[quarter] || [];
  const metric = metrics.find((item) => item.id === metricId);

  if (!metric) {
    return;
  }

  metric.value = value || "-";
  metric.target = target || "-";
  saveState();
  renderMetrics(quarterSelect.value);
}

function handleGoalSave(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const goalId = form.dataset.goalId;
  const sourceQuarter = form.dataset.quarter;
  const title = form.elements.title.value.trim();
  const quarter = form.elements.quarter.value;
  const owner = form.elements.owner.value;
  const acceptance = form.elements.acceptance.value.trim();

  if (!title) {
    return;
  }

  const sourceGoals = state.goalsByQuarter[sourceQuarter] || [];
  const goalIndex = sourceGoals.findIndex((goal) => goal.id === goalId);

  if (goalIndex === -1) {
    return;
  }

  const updatedGoal = {
    id: goalId,
    title,
    owner,
    acceptance
  };

  sourceGoals.splice(goalIndex, 1);
  state.goalsByQuarter[quarter] = state.goalsByQuarter[quarter] || [];
  state.goalsByQuarter[quarter].push(updatedGoal);

  saveState();
  refreshGoalFilters();
  syncGoals();
}

function handleGoalDelete(event) {
  const button = event.currentTarget;
  const quarter = button.dataset.quarter;
  const goalId = button.dataset.goalId;
  const goals = state.goalsByQuarter[quarter] || [];

  state.goalsByQuarter[quarter] = goals.filter((goal) => goal.id !== goalId);
  saveState();
  syncGoals();
}

function handleGoalCreate(event) {
  event.preventDefault();

  const title = newGoalTitle.value.trim();
  const quarter = newGoalQuarter.value;
  const owner = newGoalOwner.value;
  const acceptance = newGoalAcceptance.value.trim();

  if (!title || !acceptance) {
    return;
  }

  state.goalsByQuarter[quarter] = state.goalsByQuarter[quarter] || [];
  state.goalsByQuarter[quarter].push({
    id: `goal-${Date.now()}`,
    title,
    owner,
    acceptance
  });

  saveState();
  goalCreateForm.reset();
  newGoalQuarter.value = quarter;
  newGoalOwner.value = owner;
  refreshGoalFilters();
  syncGoals();
}

function openAuthModal() {
  authError.hidden = true;
  authPassword.value = "";
  authUser.value = activeUser || Object.keys(USERS)[0];
  authModal.hidden = false;
}

function closeAuthModal() {
  authModal.hidden = true;
  authError.hidden = true;
  authPassword.value = "";
}

function handleAuthSubmit(event) {
  event.preventDefault();

  const user = authUser.value;
  const password = authPassword.value;

  if (USERS[user] !== password) {
    authError.hidden = false;
    return;
  }

  activeUser = user;
  localStorage.setItem(AUTH_KEY, activeUser);
  closeAuthModal();
  updateAuthUi();
  renderAll();
}

function logout() {
  activeUser = "";
  localStorage.removeItem(AUTH_KEY);
  updateAuthUi();
  renderAll();
}

function updateAuthUi() {
  if (!isAuthenticated()) {
    loginToggle.textContent = "Вход";
    editModeBanner.hidden = true;
    goalCreateForm.hidden = true;
  } else if (isEditingEnabled()) {
    loginToggle.textContent = "Выход";
    editModeText.textContent = `Режим редактирования: ${activeUser}`;
    editModeBanner.hidden = false;
    goalCreateForm.hidden = false;
  } else {
    loginToggle.textContent = "Выход";
    editModeBanner.hidden = true;
    goalCreateForm.hidden = true;
  }

  protectedNavLinks.forEach((link) => {
    link.hidden = !isAuthenticated();
  });
}

function refreshGoalFilters() {
  const currentQuarterSelection = getSelectedValues(goalQuarterSelect);
  goalQuarterSelect.innerHTML = "";
  getQuarterList().forEach((quarter) => createChip(goalQuarterSelect, quarter, quarter));
  bindQuarterChips();
  setSelectedValues(goalQuarterSelect, currentQuarterSelection.length ? currentQuarterSelection : [DEFAULT_QUARTER]);
}

function renderAll() {
  renderMetrics(quarterSelect.value);
  syncGoals();
}

function populateQuarterSelects() {
  const quarters = getQuarterList();
  quarterSelect.innerHTML = "";
  newGoalQuarter.innerHTML = "";

  quarters.forEach((quarter) => {
    const option = document.createElement("option");
    option.value = quarter;
    option.textContent = quarter;
    option.selected = quarter === DEFAULT_QUARTER;
    quarterSelect.appendChild(option);

    const createOption = option.cloneNode(true);
    newGoalQuarter.appendChild(createOption);
  });
}

function populateAssigneeSelects() {
  assigneeSelect.innerHTML = "";
  newGoalOwner.innerHTML = "";
  ASSIGNEE_OPTIONS.forEach((assignee) => {
    createChip(assigneeSelect, assignee, assignee);
    if (assignee !== "Все") {
      const option = document.createElement("option");
      option.value = assignee;
      option.textContent = assignee;
      newGoalOwner.appendChild(option);
    }
  });
}

function populateAuthUsers() {
  authUser.innerHTML = "";
  Object.keys(USERS).forEach((user) => {
    const option = document.createElement("option");
    option.value = user;
    option.textContent = user;
    authUser.appendChild(option);
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

populateQuarterSelects();
populateAssigneeSelects();
populateAuthUsers();
refreshGoalFilters();
bindAssigneeChips();

quarterSelect.value = DEFAULT_QUARTER;
newGoalQuarter.value = DEFAULT_QUARTER;
newGoalOwner.value = "Филатов";

setSelectedValues(goalQuarterSelect, [DEFAULT_QUARTER]);
setSelectedValues(assigneeSelect, ["Все"]);

quarterSelect.addEventListener("change", (event) => {
  renderMetrics(event.target.value);
});

goalCreateForm.addEventListener("submit", handleGoalCreate);
loginToggle.addEventListener("click", () => {
  if (isEditingEnabled()) {
    logout();
  } else {
    openAuthModal();
  }
});
authForm.addEventListener("submit", handleAuthSubmit);
authCancel.addEventListener("click", closeAuthModal);
authBackdrop.addEventListener("click", closeAuthModal);

updateAuthUi();
renderAll();
