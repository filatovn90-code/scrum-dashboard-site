import { ensureProfile, getCurrentUser, getSupabase } from "./supabase-client.js";

const grid = document.getElementById("projectsGrid");
const badge = document.getElementById("projectsUserBadge");
const projectForm = document.getElementById("projectForm");
const projectTitleInput = document.getElementById("projectTitleInput");
const projectDescriptionInput = document.getElementById("projectDescriptionInput");
const logoutButton = document.getElementById("projectsLogoutButton");

let supabase;
let currentUser;
let projects = [];
let tasks = [];

logoutButton?.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    window.location.replace("auth.html");
  }
});

projectForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = projectTitleInput.value.trim();
  const description = projectDescriptionInput.value.trim();

  if (!title) {
    return;
  }

  const { error } = await supabase.from("projects").insert({
    user_id: currentUser.id,
    title,
    description
  });

  if (error) {
    alert(error.message);
    return;
  }

  projectForm.reset();
  await loadData();
});

async function bootstrap() {
  try {
    supabase = await getSupabase();
    currentUser = await getCurrentUser();

    if (!currentUser) {
      window.location.replace("auth.html");
      return;
    }

    await ensureProfile();
    badge.textContent = currentUser.email || "Пользователь";
    await loadData();
  } catch (error) {
    badge.textContent = "Ошибка подключения";
    grid.innerHTML = `<article class="section"><p>${escapeHtml(error.message || "Не удалось загрузить проекты.")}</p></article>`;
  }
}

async function loadData() {
  const [{ data: projectRows, error: projectError }, { data: taskRows, error: taskError }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("tasks").select("*").order("created_at", { ascending: false })
  ]);

  if (projectError) {
    throw projectError;
  }

  if (taskError) {
    throw taskError;
  }

  projects = projectRows || [];
  tasks = taskRows || [];
  render();
}

function render() {
  if (!projects.length) {
    grid.innerHTML = `<article class="section"><p>Пока нет проектов.</p></article>`;
    return;
  }

  grid.innerHTML = projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.project_id === project.id);

    return `
      <article class="section project-card">
        <div class="project-card-header">
          <div>
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.description || "Без описания")}</p>
          </div>
          <div class="project-card-actions">
            <button class="ghost-button" type="button" data-edit-project="${project.id}">Изменить</button>
            <button class="ghost-button books-delete-button" type="button" data-delete-project="${project.id}">Удалить</button>
          </div>
        </div>

        <form class="project-task-form" data-project-form="${project.id}">
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
                <button class="ghost-button" type="button" data-edit-task="${task.id}">Изменить</button>
                <button class="ghost-button books-delete-button" type="button" data-delete-task="${task.id}">Удалить</button>
              </div>
            </div>
          `).join("") : `<div class="books-empty">Пока нет задач</div>`}
        </div>
      </article>
    `;
  }).join("");

  bindProjectActions();
}

function bindProjectActions() {
  document.querySelectorAll("[data-project-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const projectId = form.dataset.projectForm;
      const formData = new FormData(form);
      const title = String(formData.get("title") || "").trim();
      const details = String(formData.get("details") || "").trim();
      const status = String(formData.get("status") || "todo");

      if (!title) {
        return;
      }

      const { error } = await supabase.from("tasks").insert({
        user_id: currentUser.id,
        project_id: projectId,
        title,
        details,
        status
      });

      if (error) {
        alert(error.message);
        return;
      }

      await loadData();
    });
  });

  document.querySelectorAll("[data-task-status]").forEach((select) => {
    select.addEventListener("change", async () => {
      const taskId = select.dataset.taskStatus;
      const { error } = await supabase
        .from("tasks")
        .update({ status: select.value })
        .eq("id", taskId)
        .eq("user_id", currentUser.id);

      if (error) {
        alert(error.message);
        return;
      }

      await loadData();
    });
  });

  document.querySelectorAll("[data-edit-task]").forEach((button) => {
    button.addEventListener("click", async () => {
      const task = tasks.find((item) => item.id === button.dataset.editTask);
      if (!task) {
        return;
      }

      const nextTitle = window.prompt("Название задачи", task.title);
      if (nextTitle === null) {
        return;
      }

      const nextDetails = window.prompt("Детали задачи", task.details || "");
      if (nextDetails === null) {
        return;
      }

      const { error } = await supabase
        .from("tasks")
        .update({
          title: nextTitle.trim() || task.title,
          details: nextDetails.trim()
        })
        .eq("id", task.id)
        .eq("user_id", currentUser.id);

      if (error) {
        alert(error.message);
        return;
      }

      await loadData();
    });
  });

  document.querySelectorAll("[data-delete-task]").forEach((button) => {
    button.addEventListener("click", async () => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", button.dataset.deleteTask)
        .eq("user_id", currentUser.id);

      if (error) {
        alert(error.message);
        return;
      }

      await loadData();
    });
  });

  document.querySelectorAll("[data-delete-project]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.deleteProject;
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUser.id);

      if (error) {
        alert(error.message);
        return;
      }

      await loadData();
    });
  });

  document.querySelectorAll("[data-edit-project]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.editProject;
      const project = projects.find((item) => item.id === id);
      if (!project) {
        return;
      }

      const nextTitle = window.prompt("Название проекта", project.title);
      if (nextTitle === null) {
        return;
      }

      const nextDescription = window.prompt("Описание проекта", project.description || "");
      if (nextDescription === null) {
        return;
      }

      const { error } = await supabase
        .from("projects")
        .update({
          title: nextTitle.trim() || project.title,
          description: nextDescription.trim()
        })
        .eq("id", id)
        .eq("user_id", currentUser.id);

      if (error) {
        alert(error.message);
        return;
      }

      await loadData();
    });
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

bootstrap();
