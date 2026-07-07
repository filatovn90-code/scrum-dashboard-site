import { requireAuth, signOutCurrentUser } from "./auth-helpers.js";
import { getCurrentProfile, getSupabase } from "./supabase-client.js";
import { landingPath, loginPath, rootFile } from "./route-paths.js";

const sessionBadge = document.getElementById("appSessionBadge");
const logoutButton = document.getElementById("appLogoutButton");
const overviewGrid = document.getElementById("appOverviewGrid");
const checkinForm = document.getElementById("dailyCheckinForm");
const checkinStatus = document.getElementById("dailyCheckinStatus");
const recentCheckinsList = document.getElementById("recentCheckinsList");
const projectsStatus = document.getElementById("appProjectsStatus");
const projectsGrid = document.getElementById("appProjectsGrid");
const projectCreateForm = document.getElementById("projectCreateForm");
const projectCreateTitle = document.getElementById("projectCreateTitle");
const projectCreateDescription = document.getElementById("projectCreateDescription");
const toolsGrid = document.querySelector(".app-tools-grid");

let supabase;
let currentUser;
let currentProfile;
let projects = [];
let tasks = [];
let checkins = [];

bootstrap();

logoutButton?.addEventListener("click", async () => {
  await signOutCurrentUser().catch(() => null);
  window.location.replace(landingPath());
});

checkinForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveCheckin();
});

projectCreateForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await createProject();
});

async function bootstrap() {
  currentUser = await requireAuth({ redirectTo: loginPath() });
  if (!currentUser) {
    return;
  }

  supabase = await getSupabase();
  currentProfile = await getCurrentProfile().catch(() => null);
  sessionBadge.textContent = currentProfile?.email || currentUser.email || "Пользователь";
  renderToolLinks();

  await Promise.all([
    loadProjectsAndTasks(),
    loadCheckins()
  ]);
}

async function loadProjectsAndTasks() {
  projectsStatus.textContent = "Загружаю проекты...";

  try {
    const [{ data: projectRows, error: projectError }, { data: taskRows, error: taskError }] = await Promise.all([
      supabase
        .from("projects")
        .select("id, title, description, created_at, updated_at")
        .eq("user_id", currentUser.id)
        .order("updated_at", { ascending: false })
        .limit(12),
      supabase
        .from("tasks")
        .select("id, project_id, title, details, status, created_at, updated_at")
        .eq("user_id", currentUser.id)
        .order("updated_at", { ascending: false })
        .limit(60)
    ]);

    if (projectError) throw projectError;
    if (taskError) throw taskError;

    projects = projectRows || [];
    tasks = taskRows || [];
    renderOverview();
    renderProjects();
    projectsStatus.textContent = projects.length ? "Данные синхронизированы." : "Пока нет проектов. Можно создать первый.";
    projectsStatus.classList.remove("is-error");
  } catch (error) {
    projectsStatus.textContent = error.message || "Не удалось загрузить проекты.";
    projectsStatus.classList.add("is-error");
    renderProjects();
  }
}

async function loadCheckins() {
  try {
    const { data, error } = await supabase
      .from("daily_checkins")
      .select("id, checkin_date, energy_level, stress_level, focus_level, note, created_at, updated_at")
      .eq("user_id", currentUser.id)
      .order("checkin_date", { ascending: false })
      .limit(7);

    if (error) throw error;

    checkins = data || [];
    fillTodayCheckin();
    renderCheckins();
    renderOverview();
  } catch (error) {
    checkinStatus.textContent = error.message || "Не удалось загрузить check-in.";
    checkinStatus.classList.add("is-error");
  }
}

function renderOverview() {
  const todayCheckin = checkins.find((item) => item.checkin_date === todayIso());
  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress").length;

  const cards = [
    { label: "Проектов", value: String(projects.length), note: projects.length ? "Ваши активные контейнеры задач" : "Пока пусто" },
    { label: "Задач", value: String(tasks.length), note: `${inProgressTasks} в работе, ${completedTasks} завершено` },
    { label: "Check-in сегодня", value: todayCheckin ? "Есть" : "Нет", note: todayCheckin ? `Энергия ${todayCheckin.energy_level}/5` : "Можно заполнить прямо сейчас" },
    { label: "Профиль", value: currentProfile?.full_name || currentUser.email || "Без имени", note: currentProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone }
  ];

  overviewGrid.innerHTML = cards.map((card) => `
    <article class="health-summary-card">
      <p>${card.label}</p>
      <strong>${card.value}</strong>
      <span class="analytics-card-note">${card.note}</span>
    </article>
  `).join("");
}

function renderCheckins() {
  if (!checkins.length) {
    recentCheckinsList.innerHTML = '<div class="books-empty">Пока нет сохранённых check-in.</div>';
    return;
  }

  recentCheckinsList.innerHTML = checkins.map((item) => `
    <article class="recent-checkin-card">
      <div class="recent-checkin-head">
        <strong>${formatRuDate(item.checkin_date)}</strong>
        <span>Энергия ${item.energy_level}/5 • Стресс ${item.stress_level}/5 • Фокус ${item.focus_level}/5</span>
      </div>
      <p>${escapeHtml(item.note || "Без заметки")}</p>
    </article>
  `).join("");
}

function renderProjects() {
  if (!projects.length) {
    projectsGrid.innerHTML = '<article class="section"><p>Пока нет проектов.</p></article>';
    return;
  }

  projectsGrid.innerHTML = projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.project_id === project.id);

    return `
      <article class="section project-card">
        <div class="project-card-header">
          <div>
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.description || "Без описания")}</p>
          </div>
          <div class="project-card-actions">
            <button class="ghost-button" type="button" data-project-edit="${project.id}">Изменить</button>
            <button class="ghost-button books-delete-button" type="button" data-project-delete="${project.id}">Удалить</button>
          </div>
        </div>

        <form class="project-task-form" data-task-form="${project.id}">
          <input type="text" name="title" placeholder="Новая задача" required>
          <input type="text" name="details" placeholder="Детали">
          <select name="status">
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
          <button class="form-action-button" type="submit">Добавить задачу</button>
        </form>

        <div class="project-tasks">
          ${projectTasks.length ? projectTasks.map((task) => `
            <div class="project-task-row">
              <div class="project-task-copy">
                <strong>${escapeHtml(task.title)}</strong>
                <p>${escapeHtml(task.details || "Без деталей")}</p>
              </div>
              <div class="project-task-actions">
                <select data-task-status="${task.id}">
                  <option value="todo"${task.status === "todo" ? " selected" : ""}>To do</option>
                  <option value="in_progress"${task.status === "in_progress" ? " selected" : ""}>In progress</option>
                  <option value="done"${task.status === "done" ? " selected" : ""}>Done</option>
                </select>
                <button class="ghost-button" type="button" data-task-edit="${task.id}">Изменить</button>
                <button class="ghost-button books-delete-button" type="button" data-task-delete="${task.id}">Удалить</button>
              </div>
            </div>
          `).join("") : '<div class="books-empty">В этом проекте пока нет задач.</div>'}
        </div>
      </article>
    `;
  }).join("");

  bindProjectActions();
}

function bindProjectActions() {
  document.querySelectorAll("[data-task-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const title = String(formData.get("title") || "").trim();
      const details = String(formData.get("details") || "").trim();
      const status = String(formData.get("status") || "todo");
      const projectId = form.dataset.taskForm;

      if (!title) return;

      const { error } = await supabase.from("tasks").insert({
        user_id: currentUser.id,
        project_id: projectId,
        title,
        details,
        status
      });

      if (error) {
        setProjectsError(error.message || "Не удалось создать задачу.");
        return;
      }

      projectsStatus.textContent = "Задача создана.";
      projectsStatus.classList.remove("is-error");
      await loadProjectsAndTasks();
    });
  });

  document.querySelectorAll("[data-task-status]").forEach((select) => {
    select.addEventListener("change", async () => {
      const { error } = await supabase
        .from("tasks")
        .update({ status: select.value, updated_at: new Date().toISOString() })
        .eq("id", select.dataset.taskStatus)
        .eq("user_id", currentUser.id);

      if (error) {
        setProjectsError(error.message || "Не удалось обновить статус задачи.");
        return;
      }

      await loadProjectsAndTasks();
    });
  });

  document.querySelectorAll("[data-task-edit]").forEach((button) => {
    button.addEventListener("click", async () => {
      const task = tasks.find((item) => item.id === button.dataset.taskEdit);
      if (!task) return;

      const nextTitle = window.prompt("Название задачи", task.title);
      if (nextTitle === null) return;

      const nextDetails = window.prompt("Детали задачи", task.details || "");
      if (nextDetails === null) return;

      const { error } = await supabase
        .from("tasks")
        .update({
          title: nextTitle.trim() || task.title,
          details: nextDetails.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", task.id)
        .eq("user_id", currentUser.id);

      if (error) {
        setProjectsError(error.message || "Не удалось изменить задачу.");
        return;
      }

      await loadProjectsAndTasks();
    });
  });

  document.querySelectorAll("[data-task-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", button.dataset.taskDelete)
        .eq("user_id", currentUser.id);

      if (error) {
        setProjectsError(error.message || "Не удалось удалить задачу.");
        return;
      }

      await loadProjectsAndTasks();
    });
  });

  document.querySelectorAll("[data-project-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", button.dataset.projectDelete)
        .eq("user_id", currentUser.id);

      if (error) {
        setProjectsError(error.message || "Не удалось удалить проект.");
        return;
      }

      await loadProjectsAndTasks();
    });
  });

  document.querySelectorAll("[data-project-edit]").forEach((button) => {
    button.addEventListener("click", async () => {
      const project = projects.find((item) => item.id === button.dataset.projectEdit);
      if (!project) return;

      const nextTitle = window.prompt("Название проекта", project.title);
      if (nextTitle === null) return;

      const nextDescription = window.prompt("Описание проекта", project.description || "");
      if (nextDescription === null) return;

      const { error } = await supabase
        .from("projects")
        .update({
          title: nextTitle.trim() || project.title,
          description: nextDescription.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", project.id)
        .eq("user_id", currentUser.id);

      if (error) {
        setProjectsError(error.message || "Не удалось изменить проект.");
        return;
      }

      await loadProjectsAndTasks();
    });
  });
}

async function createProject() {
  const title = projectCreateTitle.value.trim();
  const description = projectCreateDescription.value.trim();
  if (!title) return;

  const { error } = await supabase.from("projects").insert({
    user_id: currentUser.id,
    title,
    description
  });

  if (error) {
    setProjectsError(error.message || "Не удалось создать проект.");
    return;
  }

  projectCreateForm.reset();
  projectsStatus.textContent = "Проект создан.";
  projectsStatus.classList.remove("is-error");
  await loadProjectsAndTasks();
}

async function saveCheckin() {
  const energy = Number(document.getElementById("checkinEnergy").value);
  const stress = Number(document.getElementById("checkinStress").value);
  const focus = Number(document.getElementById("checkinFocus").value);
  const note = document.getElementById("checkinNote").value.trim();

  checkinStatus.textContent = "Сохраняю check-in...";
  checkinStatus.classList.remove("is-error");

  const { error } = await supabase
    .from("daily_checkins")
    .upsert({
      user_id: currentUser.id,
      checkin_date: todayIso(),
      energy_level: energy,
      stress_level: stress,
      focus_level: focus,
      note,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,checkin_date" });

  if (error) {
    checkinStatus.textContent = error.message || "Не удалось сохранить check-in.";
    checkinStatus.classList.add("is-error");
    return;
  }

  checkinStatus.textContent = "Check-in сохранён.";
  await loadCheckins();
}

function fillTodayCheckin() {
  const todayCheckin = checkins.find((item) => item.checkin_date === todayIso());
  if (!todayCheckin) return;

  document.getElementById("checkinEnergy").value = String(todayCheckin.energy_level || 3);
  document.getElementById("checkinStress").value = String(todayCheckin.stress_level || 3);
  document.getElementById("checkinFocus").value = String(todayCheckin.focus_level || 3);
  document.getElementById("checkinNote").value = todayCheckin.note || "";
  checkinStatus.textContent = "Сегодняшний check-in уже есть. Можно обновить.";
  checkinStatus.classList.remove("is-error");
}

function renderToolLinks() {
  if (!toolsGrid) return;

  toolsGrid.innerHTML = `
    <a class="app-tool-card" href="${rootFile("backlog.html")}">
      <strong>Бэклог</strong>
      <span>Недели, задачи и energy type</span>
    </a>
    <a class="app-tool-card" href="${rootFile("calendar.html")}">
      <strong>Дедлайны недели</strong>
      <span>Таймлайн по неделям</span>
    </a>
    <a class="app-tool-card" href="${rootFile("analytics.html")}">
      <strong>Аналитика</strong>
      <span>Фокус, загрузка и energy type</span>
    </a>
  `;
}

function setProjectsError(message) {
  projectsStatus.textContent = message;
  projectsStatus.classList.add("is-error");
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatRuDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
