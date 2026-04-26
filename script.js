const goalsByQuarter = {
  "Q1 2026": [
    { title: "Квартальная предсказуемость по КРам", description: "", owner: "Филатов", acceptance: "План-факт по КРам стабилен и отклонение не превышает согласованный порог." },
    { title: "Agile Radar", description: "", owner: "Оберемко", acceptance: "Диагностика проведена, зоны роста согласованы и зафиксированы действия." },
    { title: "Гигиена Jira", description: "", owner: "Кошелева", acceptance: "Обязательные поля заполнены, статусы актуальны, просроченные элементы разобраны." },
    { title: "Трудозатраты", description: "", owner: "Филатов", acceptance: "Учет трудозатрат ведется регулярно, отклонения видны и обсуждаются." },
    { title: "Подготовка к планированию по чек-листу", description: "", owner: "Оберемко", acceptance: "Перед планированием все пункты чек-листа выполнены без критичных пробелов." },
    { title: "Утилизация ресурсов на цели МП", description: "", owner: "Кошелева", acceptance: "Ресурсы команды распределены по целям МП и подтверждены на планировании." }
  ],
  "Q2 2026": [
    { title: "Квартальная предсказуемость по КРам", description: "", owner: "Филатов", acceptance: "Не менее 85% квартальных обязательств выполняются в согласованный срок." },
    { title: "Agile Radar", description: "", owner: "Оберемко", acceptance: "Команда прошла оценку, выбраны 2-3 приоритетные зоны улучшения и назначены владельцы." },
    { title: "Гигиена Jira", description: "", owner: "Кошелева", acceptance: "Бэклог очищен, задачи актуальны, SLA по обновлению статусов соблюдается." },
    { title: "Трудозатраты", description: "", owner: "Филатов", acceptance: "Данные по трудозатратам прозрачны и пригодны для еженедельного анализа." },
    { title: "Подготовка к планированию по чек-листу", description: "", owner: "Оберемко", acceptance: "Чек-лист закрывается до планирования, критичных хвостов не остается." },
    { title: "Утилизация ресурсов на цели МП", description: "", owner: "Кошелева", acceptance: "Распределение емкости команды на цели МП прозрачно и подтверждено стейкхолдерами." },
    { title: "TTM", description: "", owner: "Филатов", acceptance: "Среднее время вывода инициативы сокращено до целевого уровня квартала." },
    { title: "LT", description: "", owner: "Оберемко", acceptance: "Lead Time стабилизирован и не выходит за согласованный диапазон." },
    { title: "Качество эпиков", description: "", owner: "Кошелева", acceptance: "Эпики имеют четкие границы, критерии успеха и готовы к декомпозиции." }
  ],
  "Q3 2026": [
    { title: "Квартальная предсказуемость по КРам", description: "", owner: "Филатов", acceptance: "Выполнение квартальных КРов предсказуемо, риски эскалируются заранее." },
    { title: "Подготовка к планированию по чек-листу", description: "", owner: "Оберемко", acceptance: "Планирование стартует только после прохождения полного чек-листа готовности." },
    { title: "Качество эпиков", description: "", owner: "Кошелева", acceptance: "Каждый эпик содержит цель, scope, зависимости и критерии завершения." },
    { title: "TTM", description: "", owner: "Филатов", acceptance: "Time to Market сокращен относительно прошлого квартала и удерживается по тренду." },
    { title: "LT", description: "", owner: "Оберемко", acceptance: "Lead Time измеряется регулярно и используется в управлении потоком." }
  ],
  "Q4 2026": [
    { title: "Agile Radar", description: "", owner: "Оберемко", acceptance: "Повторная оценка показывает прогресс по выбранным зонам развития." },
    { title: "Гигиена Jira", description: "", owner: "Кошелева", acceptance: "Jira поддерживается в актуальном состоянии без накопленного операционного долга." },
    { title: "Трудозатраты", description: "", owner: "Филатов", acceptance: "Анализ трудозатрат подтверждает управляемость загрузки и отсутствие критичных перекосов." },
    { title: "Качество эпиков", description: "", owner: "Кошелева", acceptance: "Эпики принимаются в работу только при соблюдении agreed definition of ready." }
  ]
};

const metricsByQuarter = {
  "Q1 2026": [
    { name: "Квартальная предсказуемость по КРам", value: "72%", target: "80%" },
    { name: "Agile Radar", value: "3.8/5", target: "4.2/5" },
    { name: "Гигиена Jira", value: "79%", target: "90%" },
    { name: "Трудозатраты", value: "84%", target: "90%" },
    { name: "Подготовка к планированию по чек-листу", value: "68%", target: "85%" },
    { name: "Утилизация ресурсов на цели МП", value: "74%", target: "85%" },
    { name: "TTM", value: "29 дн", target: "20 дн" },
    { name: "LT", value: "18 дн", target: "12 дн" },
    { name: "Качество эпиков", value: "71%", target: "85%" }
  ],
  "Q2 2026": [
    { name: "Квартальная предсказуемость по КРам", value: "81%", target: "85%" },
    { name: "Agile Radar", value: "4.1/5", target: "4.3/5" },
    { name: "Гигиена Jira", value: "86%", target: "92%" },
    { name: "Трудозатраты", value: "88%", target: "90%" },
    { name: "Подготовка к планированию по чек-листу", value: "83%", target: "90%" },
    { name: "Утилизация ресурсов на цели МП", value: "79%", target: "85%" },
    { name: "TTM", value: "24 дн", target: "18 дн" },
    { name: "LT", value: "14 дн", target: "10 дн" },
    { name: "Качество эпиков", value: "84%", target: "90%" }
  ],
  "Q3 2026": [
    { name: "Квартальная предсказуемость по КРам", value: "85%", target: "88%" },
    { name: "Agile Radar", value: "4.2/5", target: "4.4/5" },
    { name: "Гигиена Jira", value: "89%", target: "93%" },
    { name: "Трудозатраты", value: "90%", target: "92%" },
    { name: "Подготовка к планированию по чек-листу", value: "87%", target: "92%" },
    { name: "Утилизация ресурсов на цели МП", value: "82%", target: "87%" },
    { name: "TTM", value: "21 дн", target: "17 дн" },
    { name: "LT", value: "12 дн", target: "9 дн" },
    { name: "Качество эпиков", value: "88%", target: "91%" }
  ],
  "Q4 2026": [
    { name: "Квартальная предсказуемость по КРам", value: "88%", target: "90%" },
    { name: "Agile Radar", value: "4.4/5", target: "4.5/5" },
    { name: "Гигиена Jira", value: "92%", target: "95%" },
    { name: "Трудозатраты", value: "91%", target: "93%" },
    { name: "Подготовка к планированию по чек-листу", value: "90%", target: "95%" },
    { name: "Утилизация ресурсов на цели МП", value: "85%", target: "90%" },
    { name: "TTM", value: "18 дн", target: "15 дн" },
    { name: "LT", value: "10 дн", target: "8 дн" },
    { name: "Качество эпиков", value: "91%", target: "93%" }
  ]
};

const EDIT_PASSWORD = "scrum2026!";
const METRICS_STORAGE_KEY = "scrum-master-dashboard-data";
const GOALS_STORAGE_KEY = "scrum-master-dashboard-goals";
const assigneeOptions = ["Все", "Филатов", "Оберемко", "Кошелева"];
const defaultQuarter = "Q2 2026";

const goalGrid = document.getElementById("goalGrid");
const metricsGrid = document.getElementById("metricsGrid");
const quarterSelect = document.getElementById("quarterSelect");
const goalQuarterSelect = document.getElementById("goalQuarterSelect");
const assigneeSelect = document.getElementById("assigneeSelect");
const goalCreateForm = document.getElementById("goalCreateForm");
const goalCreateQuarterInput = document.getElementById("goalCreateQuarterInput");
const goalTitleInput = document.getElementById("goalTitleInput");
const goalAcceptanceInput = document.getElementById("goalAcceptanceInput");
const goalOwnerInput = document.getElementById("goalOwnerInput");
const editModeButton = document.getElementById("editModeButton");
const passwordModal = document.getElementById("passwordModal");
const passwordForm = document.getElementById("passwordForm");
const passwordInput = document.getElementById("passwordInput");
const passwordError = document.getElementById("passwordError");
const cancelPasswordButton = document.getElementById("cancelPasswordButton");

let isEditMode = false;
const goalDraftQuarterByKey = {};

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function loadStoredData(key, fallback) {
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return cloneData(fallback);
  }

  try {
    return JSON.parse(raw);
  } catch {
    return cloneData(fallback);
  }
}

let dashboardMetrics = loadStoredData(METRICS_STORAGE_KEY, metricsByQuarter);
let dashboardGoals = loadStoredData(GOALS_STORAGE_KEY, goalsByQuarter);

function saveMetrics() {
  window.localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(dashboardMetrics));
}

function saveGoals() {
  window.localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(dashboardGoals));
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

function updateEditButton() {
  editModeButton.textContent = isEditMode ? "Выход" : "Ред.";
  editModeButton.classList.toggle("is-active", isEditMode);
  editModeButton.setAttribute(
    "aria-label",
    isEditMode ? "Выйти из режима редактирования" : "Войти в режим редактирования"
  );
  goalCreateForm.hidden = !isEditMode;
  if (isEditMode) {
    goalCreateQuarterInput.value = getSelectedValues(goalQuarterSelect)[0] || defaultQuarter;
  }
}

function openPasswordModal() {
  passwordModal.hidden = false;
  passwordError.hidden = true;
  passwordInput.value = "";
  passwordInput.focus();
}

function closePasswordModal() {
  passwordModal.hidden = true;
}

function renderGoals(selectedQuarters, selectedAssignees) {
  goalGrid.innerHTML = "";

  const quarterFilter = selectedQuarters.length ? selectedQuarters : Object.keys(dashboardGoals);
  const assigneeFilter = selectedAssignees.length ? selectedAssignees : ["Все"];

  const goalsToRender = quarterFilter
    .flatMap((quarter) =>
      (dashboardGoals[quarter] || []).map((goal, index) => ({
        goal,
        quarter,
        goalIndex: index
      }))
    )
    .filter(({ goal }) => assigneeFilter.includes("Все") || assigneeFilter.includes(goal.owner));

  goalsToRender.forEach(({ goal, quarter, goalIndex }) => {
    const goalKey = `${quarter}__${goalIndex}`;
    const selectedQuarter = goalDraftQuarterByKey[goalKey] || quarter;
    const card = document.createElement("article");
    card.className = "goal-card";

    if (isEditMode) {
      card.innerHTML = `
        <input class="goal-edit-input" data-goal-title-key="${goalKey}" type="text" value="${goal.title ?? ""}" aria-label="Название цели">
        <input class="goal-edit-input" data-goal-acceptance-key="${goalKey}" type="text" value="${goal.acceptance ?? ""}" aria-label="Критерии приемки">
        <select class="goal-edit-select" data-goal-owner-key="${goalKey}" aria-label="Ответственный">
          ${assigneeOptions
            .filter((option) => option !== "Все")
            .map((option) => `<option value="${option}" ${option === goal.owner ? "selected" : ""}>${option}</option>`)
            .join("")}
        </select>
        <select class="goal-edit-select" data-goal-quarter-key="${goalKey}" aria-label="Квартал">
          ${Object.keys(dashboardGoals)
            .map((goalQuarter) => `<option value="${goalQuarter}" ${goalQuarter === selectedQuarter ? "selected" : ""}>${goalQuarter}</option>`)
            .join("")}
        </select>
        <div class="goal-card-actions">
          <button class="metric-save-button goal-save-button" data-goal-save-key="${goalKey}" type="button">Сохранить</button>
          <button class="danger-button goal-delete-button" data-goal-delete-key="${goalKey}" type="button">Удалить</button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <h3>${goal.title}</h3>
        ${goal.description ? `<p>${goal.description}</p>` : ""}
        <p class="goal-acceptance">${goal.acceptance ?? ""}</p>
        <div class="goal-meta">
          <span>${goal.owner}</span>
        </div>
      `;
    }

    goalGrid.appendChild(card);
  });

  if (!isEditMode) {
    return;
  }

  goalGrid.querySelectorAll("[data-goal-quarter-key]").forEach((select) => {
    select.addEventListener("change", () => {
      goalDraftQuarterByKey[select.dataset.goalQuarterKey] = select.value;
    });
  });

  goalGrid.querySelectorAll(".goal-save-button").forEach((button) => {
    button.addEventListener("click", () => {
      const goalKey = button.dataset.goalSaveKey;
      const [sourceQuarter, rawIndex] = goalKey.split("__");
      const index = Number(rawIndex);
      const titleInput = goalGrid.querySelector(`[data-goal-title-key="${goalKey}"]`);
      const acceptanceInput = goalGrid.querySelector(`[data-goal-acceptance-key="${goalKey}"]`);
      const ownerSelect = goalGrid.querySelector(`[data-goal-owner-key="${goalKey}"]`);
      const quarterSelectInput = goalGrid.querySelector(`[data-goal-quarter-key="${goalKey}"]`);

      if (!titleInput || !ownerSelect || !dashboardGoals[sourceQuarter]?.[index]) {
        return;
      }

      const updatedGoal = {
        ...dashboardGoals[sourceQuarter][index],
        title: titleInput.value.trim() || "Новая цель",
        acceptance: acceptanceInput ? acceptanceInput.value.trim() : "",
        owner: ownerSelect.value
      };
      const nextQuarter = quarterSelectInput ? quarterSelectInput.value : sourceQuarter;

      if (nextQuarter !== sourceQuarter) {
        dashboardGoals[sourceQuarter].splice(index, 1);
        if (!dashboardGoals[nextQuarter]) {
          dashboardGoals[nextQuarter] = [];
        }
        dashboardGoals[nextQuarter].push(updatedGoal);
        delete goalDraftQuarterByKey[goalKey];
      } else {
        dashboardGoals[sourceQuarter][index] = updatedGoal;
      }

      saveGoals();
      renderGoals(getSelectedValues(goalQuarterSelect), getSelectedValues(assigneeSelect));
    });
  });

  goalGrid.querySelectorAll(".goal-delete-button").forEach((button) => {
    button.addEventListener("click", () => {
      const goalKey = button.dataset.goalDeleteKey;
      const [sourceQuarter, rawIndex] = goalKey.split("__");
      const index = Number(rawIndex);

      if (!dashboardGoals[sourceQuarter]?.[index]) {
        return;
      }

      dashboardGoals[sourceQuarter].splice(index, 1);
      delete goalDraftQuarterByKey[goalKey];
      saveGoals();
      renderGoals(getSelectedValues(goalQuarterSelect), getSelectedValues(assigneeSelect));
    });
  });
}

function renderMetrics(quarter) {
  const metrics = dashboardMetrics[quarter] || [];
  metricsGrid.innerHTML = "";

  metrics.forEach((metric, index) => {
    const card = document.createElement("article");
    card.className = "metric-card";

    if (isEditMode) {
      card.innerHTML = `
        <h3>${metric.name}</h3>
        <input class="metric-edit-input" data-metric-index="${index}" type="text" value="${metric.value}" aria-label="Значение метрики ${metric.name}">
        <input class="metric-edit-input" data-metric-target-index="${index}" type="text" value="${metric.target ?? ""}" aria-label="Целевое значение метрики ${metric.name}">
        <button class="metric-save-button" data-metric-index="${index}" type="button">Сохранить</button>
      `;
    } else {
      card.innerHTML = `
        <h3>${metric.name}</h3>
        <div class="metric-values">
          <div><div class="metric-value">${metric.value}</div></div>
          <div><div class="metric-value metric-value-target">${metric.target ?? "-"}</div></div>
        </div>
      `;
    }

    metricsGrid.appendChild(card);
  });

  if (!isEditMode) {
    return;
  }

  metricsGrid.querySelectorAll(".metric-save-button").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.metricIndex);
      const input = metricsGrid.querySelector(`.metric-edit-input[data-metric-index="${index}"]`);
      const targetInput = metricsGrid.querySelector(`.metric-edit-input[data-metric-target-index="${index}"]`);
      if (!input || !dashboardMetrics[quarter]?.[index]) {
        return;
      }

      dashboardMetrics[quarter][index].value = input.value.trim() || "-";
      dashboardMetrics[quarter][index].target = targetInput ? (targetInput.value.trim() || "-") : "-";
      saveMetrics();
      renderMetrics(quarter);
    });
  });
}

function bindQuarterChips() {
  goalQuarterSelect.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("is-active");
      if (!getSelectedValues(goalQuarterSelect).length) {
        chip.classList.add("is-active");
      }
      renderGoals(getSelectedValues(goalQuarterSelect), getSelectedValues(assigneeSelect));
      if (isEditMode) {
        goalCreateQuarterInput.value = getSelectedValues(goalQuarterSelect)[0] || defaultQuarter;
      }
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
      renderGoals(getSelectedValues(goalQuarterSelect), getSelectedValues(assigneeSelect));
    });
  });
}

Object.keys(metricsByQuarter).forEach((quarter) => {
  const option = document.createElement("option");
  option.value = quarter;
  option.textContent = quarter;
  option.selected = quarter === defaultQuarter;
  quarterSelect.appendChild(option);
});

Object.keys(goalsByQuarter).forEach((quarter) => {
  createChip(goalQuarterSelect, quarter, quarter);

  const createOption = document.createElement("option");
  createOption.value = quarter;
  createOption.textContent = quarter;
  createOption.selected = quarter === defaultQuarter;
  goalCreateQuarterInput.appendChild(createOption);
});

assigneeOptions.forEach((assignee) => {
  createChip(assigneeSelect, assignee, assignee);
});

assigneeOptions
  .filter((assignee) => assignee !== "Все")
  .forEach((assignee) => {
    const option = document.createElement("option");
    option.value = assignee;
    option.textContent = assignee;
    goalOwnerInput.appendChild(option);
  });

bindQuarterChips();
bindAssigneeChips();

quarterSelect.addEventListener("change", (event) => {
  renderMetrics(event.target.value);
});

goalCreateForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = goalTitleInput.value.trim();
  const acceptance = goalAcceptanceInput.value.trim();
  const owner = goalOwnerInput.value;
  const quarter = goalCreateQuarterInput.value;

  if (!title) {
    goalTitleInput.focus();
    return;
  }

  if (!dashboardGoals[quarter]) {
    dashboardGoals[quarter] = [];
  }

  dashboardGoals[quarter].push({
    title,
    description: "",
    owner,
    acceptance
  });

  saveGoals();
  goalTitleInput.value = "";
  goalAcceptanceInput.value = "";
  goalOwnerInput.value = assigneeOptions[1];
  goalCreateQuarterInput.value = quarter;
  setSelectedValues(goalQuarterSelect, [quarter]);
  setSelectedValues(assigneeSelect, ["Все"]);
  renderGoals([quarter], ["Все"]);
});

editModeButton.addEventListener("click", () => {
  if (isEditMode) {
    isEditMode = false;
    updateEditButton();
    renderMetrics(quarterSelect.value);
    renderGoals(getSelectedValues(goalQuarterSelect), getSelectedValues(assigneeSelect));
    return;
  }

  openPasswordModal();
});

cancelPasswordButton.addEventListener("click", closePasswordModal);

passwordForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (passwordInput.value !== EDIT_PASSWORD) {
    passwordError.hidden = false;
    return;
  }

  isEditMode = true;
  closePasswordModal();
  updateEditButton();
  renderMetrics(quarterSelect.value);
  renderGoals(getSelectedValues(goalQuarterSelect), getSelectedValues(assigneeSelect));
});

setSelectedValues(goalQuarterSelect, [defaultQuarter]);
setSelectedValues(assigneeSelect, ["Все"]);
updateEditButton();
renderGoals([defaultQuarter], ["Все"]);
renderMetrics(defaultQuarter);
goalOwnerInput.value = assigneeOptions[1];
goalCreateQuarterInput.value = defaultQuarter;
