const AUTH_KEY = "scrum-dashboard-auth-user";
const activeUser = window.appStorage.getItem(AUTH_KEY);

if (!activeUser) {
  window.location.replace("index.html");
}

const STORAGE_KEY = `scrum-dashboard-books:${activeUser}`;

const logoutButton = document.getElementById("logoutButton");
const addForm = document.getElementById("booksAddForm");
const titleInput = document.getElementById("booksTitleInput");
const authorInput = document.getElementById("booksAuthorInput");
const unreadList = document.getElementById("booksUnreadList");
const readList = document.getElementById("booksReadList");
const unreadCount = document.getElementById("booksUnreadCount");
const readCount = document.getElementById("booksReadCount");

const defaultState = {
  unread: [],
  read: []
};

let state = loadState();

logoutButton?.addEventListener("click", () => {
  window.appStorage.removeItem(AUTH_KEY);
  window.location.replace("index.html");
});

addForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const author = authorInput.value.trim();

  if (!title) {
    return;
  }

  state.unread.unshift({
    id: `book-${Date.now()}`,
    title,
    author
  });

  saveState();
  addForm.reset();
  render();
});

function loadState() {
  try {
    const parsed = JSON.parse(window.appStorage.getItem(STORAGE_KEY) || "null");
    if (!parsed || !Array.isArray(parsed.unread) || !Array.isArray(parsed.read)) {
      return {
        unread: [],
        read: []
      };
    }
    return parsed;
  } catch {
    return {
      unread: [],
      read: []
    };
  }
}

function saveState() {
  window.appStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function moveToRead(id) {
  const index = state.unread.findIndex((book) => book.id === id);
  if (index === -1) {
    return;
  }

  const [book] = state.unread.splice(index, 1);
  state.read.unshift(book);
  saveState();
  render();
}

function moveToUnread(id) {
  const index = state.read.findIndex((book) => book.id === id);
  if (index === -1) {
    return;
  }

  const [book] = state.read.splice(index, 1);
  state.unread.unshift(book);
  saveState();
  render();
}

function removeBook(id, listName) {
  state[listName] = state[listName].filter((book) => book.id !== id);
  saveState();
  render();
}

function renderList(container, items, mode) {
  if (!items.length) {
    container.innerHTML = `<div class="books-empty">Пока пусто</div>`;
    return;
  }

  container.innerHTML = items.map((book) => `
    <article class="books-card">
      <div class="books-card-copy">
        <h4>${escapeHtml(book.title)}</h4>
        <p>${book.author ? escapeHtml(book.author) : "Автор не указан"}</p>
      </div>
      <div class="books-card-actions">
        ${
          mode === "unread"
            ? `<button class="ghost-button" type="button" data-action="move-read" data-id="${book.id}">В прочитано</button>`
            : `<button class="ghost-button" type="button" data-action="move-unread" data-id="${book.id}">Вернуть</button>`
        }
        <button class="ghost-button books-delete-button" type="button" data-action="delete" data-list="${mode}" data-id="${book.id}">Удалить</button>
      </div>
    </article>
  `).join("");
}

function bindActions() {
  document.querySelectorAll('[data-action="move-read"]').forEach((button) => {
    button.addEventListener("click", () => moveToRead(button.dataset.id));
  });

  document.querySelectorAll('[data-action="move-unread"]').forEach((button) => {
    button.addEventListener("click", () => moveToUnread(button.dataset.id));
  });

  document.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener("click", () => removeBook(button.dataset.id, button.dataset.list));
  });
}

function render() {
  unreadCount.textContent = String(state.unread.length);
  readCount.textContent = String(state.read.length);

  renderList(unreadList, state.unread, "unread");
  renderList(readList, state.read, "read");
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
