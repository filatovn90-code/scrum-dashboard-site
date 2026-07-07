import {
  getSupabase,
  rememberLegacyAuthUser,
  signInLocalAccount
} from "./supabase-client.js";
import { redirectIfAuthenticated } from "./auth-helpers.js";
import { appPath } from "./route-paths.js";

const form = document.getElementById("loginPageForm");
const emailInput = document.getElementById("loginPageEmail");
const passwordInput = document.getElementById("loginPagePassword");
const submitButton = document.getElementById("loginPageSubmit");
const statusBox = document.getElementById("loginPageStatus");

redirectIfAuthenticated({ redirectTo: appPath() }).catch(() => null);

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  setStatus("Проверяю данные...");
  submitButton.disabled = true;

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    if (data?.user) {
      rememberLegacyAuthUser(data.user);
    }

    setStatus("Вход выполнен. Перенаправляю в приложение...");
    window.location.replace(appPath());
  } catch (error) {
    try {
      const localAuth = await signInLocalAccount(email, password);
      if (localAuth?.user) {
        setStatus("Вход выполнен. Перенаправляю в приложение...");
        window.location.replace(appPath());
        return;
      }
    } catch {
      // Keep the original auth error below.
    }

    setStatus(getReadableAuthError(error), true);
  } finally {
    submitButton.disabled = false;
  }
});

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.classList.toggle("is-error", isError);
}

function getReadableAuthError(error) {
  const rawMessage = String(error?.message || "").trim();
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("failed to fetch") || normalized.includes("networkerror")) {
    return "Не удалось связаться с сервером входа. Если аккаунт уже был создан локально, попробуйте войти еще раз. Если нет — сначала создайте аккаунт.";
  }

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("email not confirmed")
  ) {
    return "Аккаунт не найден или пароль неверный. Если вы еще не регистрировались в текущей версии сайта, сначала создайте аккаунт.";
  }

  return rawMessage || "Не удалось выполнить вход.";
}
