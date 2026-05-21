const AUTH_KEY = "scrum-dashboard-auth-user";
const activeUser = window.appStorage.getItem(AUTH_KEY);

if (!activeUser) {
  window.location.replace("index.html");
}

const STORAGE_KEY = `scrum-dashboard-anime:${activeUser}`;

const logoutButton = document.getElementById("logoutButton");
const addForm = document.getElementById("animeAddForm");
const titleInput = document.getElementById("animeTitleInput");
const noteInput = document.getElementById("animeNoteInput");
const plannedList = document.getElementById("animePlannedList");
const watchedList = document.getElementById("animeWatchedList");
const plannedCount = document.getElementById("animePlannedCount");
const watchedCount = document.getElementById("animeWatchedCount");

let state = loadState();

logoutButton?.addEventListener("click", () => {
  window.appStorage.removeItem(AUTH_KEY);
  window.location.replace("index.html");
});

addForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const note = noteInput.value.trim();

  if (!title) {
    return;
  }

  state.planned.unshift({
    id: `anime-${Date.now()}`,
    title,
    note
  });

  saveState();
  addForm.reset();
  render();
});

function loadState() {
  try {
    const parsed = JSON.parse(window.appStorage.getItem(STORAGE_KEY) || "null");
    if (!parsed || !Array.isArray(parsed.planned) || !Array.isArray(parsed.watched)) {
      return { planned: [], watched: [] };
    }
    return parsed;
  } catch {
    return { planned: [], watched: [] };
  }
}

function saveState() {
  window.appStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function moveToWatched(id) {
  const index = state.planned.findIndex((item) => item.id === id);
  if (index === -1) {
    return;
  }

  const [item] = state.planned.splice(index, 1);
  state.watched.unshift(item);
  saveState();
  render();
}

function moveToPlanned(id) {
  const index = state.watched.findIndex((item) => item.id === id);
  if (index === -1) {
    return;
  }

  const [item] = state.watched.splice(index, 1);
  state.planned.unshift(item);
  saveState();
  render();
}

function removeAnime(id, listName) {
  state[listName] = state[listName].filter((item) => item.id !== id);
  saveState();
  render();
}

function renderList(container, items, mode) {
  if (!items.length) {
    container.innerHTML = `<div class="books-empty">Пока пусто</div>`;
    return;
  }

  container.innerHTML = items.map((item) => `
    <article class="books-card">
      <div class="books-card-copy">
        <h4>${escapeHtml(item.title)}</h4>
        <p>${item.note ? escapeHtml(item.note) : "Без комментария"}</p>
      </div>
      <div class="books-card-actions">
        ${
          mode === "planned"
            ? `<button class="ghost-button" type="button" data-action="move-watched" data-id="${item.id}">В просмотрено</button>`
            : `<button class="ghost-button" type="button" data-action="move-planned" data-id="${item.id}">Вернуть</button>`
        }
        <button class="ghost-button books-delete-button" type="button" data-action="delete" data-list="${mode}" data-id="${item.id}">Удалить</button>
      </div>
    </article>
  `).join("");
}

function bindActions() {
  document.querySelectorAll('[data-action="move-watched"]').forEach((button) => {
    button.addEventListener("click", () => moveToWatched(button.dataset.id));
  });

  document.querySelectorAll('[data-action="move-planned"]').forEach((button) => {
    button.addEventListener("click", () => moveToPlanned(button.dataset.id));
  });

  document.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener("click", () => removeAnime(button.dataset.id, button.dataset.list));
  });
}

function render() {
  plannedCount.textContent = String(state.planned.length);
  watchedCount.textContent = String(state.watched.length);

  renderList(plannedList, state.planned, "planned");
  renderList(watchedList, state.watched, "watched");
  bindActions();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

render();
