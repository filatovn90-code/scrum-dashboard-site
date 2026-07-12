import {
  canUseLocalAuthFallback,
  cacheRemoteSession,
  getSupabase,
  rememberLegacyAuthUser,
  signInLocalAccount,
  waitForSessionPersistence
} from "./supabase-client.js";
import { redirectIfAuthenticated } from "./auth-helpers.js";
import { resolvePostAuthPath } from "./onboarding-helpers.js";
import { todayPath } from "./route-paths.js";

const form = document.getElementById("loginPageForm");
const emailInput = document.getElementById("loginPageEmail");
const passwordInput = document.getElementById("loginPagePassword");
const submitButton = document.getElementById("loginPageSubmit");
const statusBox = document.getElementById("loginPageStatus");

redirectIfAuthenticated({ redirectTo: todayPath() }).catch(() => null);

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = String(emailInput?.value || "").trim();
  const password = String(passwordInput?.value || "");

  if (!email || !password) {
    setStatus("Введите email и пароль.", true);
    return;
  }

  setStatus("Проверяю данные...");
  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    if (data?.user) {
      rememberLegacyAuthUser(data.user);
    }

    if (data?.session) {
      cacheRemoteSession(data.session);
    }

    const activeSession = data?.session || await waitForSessionPersistence();
    const authUser = activeSession?.user || data?.user;

    if (!authUser) {
      throw new Error("Не удалось сохранить сессию после входа.");
    }

    setStatus("Вход выполнен. Перенаправляю в приложение...");
    window.location.replace(resolvePostAuthPath(authUser));
    return;
  } catch (error) {
    if (canUseLocalAuthFallback()) {
      try {
        const localAuth = await signInLocalAccount(email, password);
        if (localAuth?.user) {
          setStatus("Вход выполнен. Перенаправляю в приложение...");
          window.location.replace(resolvePostAuthPath(localAuth.user));
          return;
        }
      } catch {
        // Keep the original remote auth error below.
      }
    }

    setStatus(getReadableAuthError(error), true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
});

function setStatus(message, isError = false) {
  if (!statusBox) {
    return;
  }

  statusBox.textContent = message;
  statusBox.classList.toggle("is-error", isError);
}

function getReadableAuthError(error) {
  const rawMessage = String(error?.message || "").trim();
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("failed to fetch") || normalized.includes("networkerror")) {
    return "Не удалось связаться с сервером входа. Проверьте, что Supabase-проект активен и сайт открыт по публичной ссылке.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Почта для этого аккаунта еще не подтверждена. Откройте письмо от Supabase и подтвердите email.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "Аккаунт не найден или пароль неверный.";
  }

  if (normalized.includes("не удалось сохранить сессию")) {
    return "Вход прошел, но сессия не сохранилась. Обычно это связано с настройками домена, Redirect URL или переменных окружения.";
  }

  return rawMessage || "Не удалось выполнить вход.";
}
