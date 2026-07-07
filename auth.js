import { ensureProfile, getCurrentSession, getSupabase } from "./supabase-client.js";

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const authStatus = document.getElementById("authStatus");
const logoutButton = document.getElementById("logoutSupabaseButton");

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;

  try {
    setStatus("Регистрирую пользователя...");
    const supabase = await getSupabase();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      throw error;
    }

    await ensureProfile().catch(() => null);
    setStatus("Регистрация выполнена. Если у вас включено подтверждение почты, проверьте email.");
  } catch (error) {
    setStatus(error.message || "Не удалось зарегистрироваться.", true);
  }
});

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    setStatus("Выполняю вход...");
    const supabase = await getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    await ensureProfile();
    setStatus("Вход выполнен. Можно открывать Projects.");
    await refreshSessionState();
  } catch (error) {
    setStatus(error.message || "Не удалось войти.", true);
  }
});

logoutButton?.addEventListener("click", async () => {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }

    setStatus("Вы вышли из аккаунта.");
    await refreshSessionState();
  } catch (error) {
    setStatus(error.message || "Не удалось выйти.", true);
  }
});

async function refreshSessionState() {
  try {
    const session = await getCurrentSession();

    if (!session?.user) {
      setStatus("Сессия не активна.");
      return;
    }

    setStatus(`Вы вошли как ${session.user.email}.`);
  } catch (error) {
    setStatus(error.message || "Не удалось получить статус сессии.", true);
  }
}

function setStatus(message, isError = false) {
  authStatus.textContent = message;
  authStatus.classList.toggle("is-error", isError);
}

refreshSessionState();
