import {
  cacheRemoteSession,
  getSupabase,
  waitForSessionPersistence,
  rememberLegacyAuthUser,
  signInLocalAccount
} from "./supabase-client.js";
import { resolvePostAuthPath } from "./onboarding-helpers.js";
import { redirectIfAuthenticated } from "./auth-helpers.js";
import { todayPath } from "./route-paths.js";

const form = document.getElementById("loginPageForm");
const emailInput = document.getElementById("loginPageEmail");
const passwordInput = document.getElementById("loginPagePassword");
const submitButton = document.getElementById("loginPageSubmit");
const statusBox = document.getElementById("loginPageStatus");

redirectIfAuthenticated({ redirectTo: todayPath() }).catch(() => null);

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

    if (data?.session) {
      cacheRemoteSession(data.session);
    }

    const activeSession = data?.session || await waitForSessionPersistence();
    const authUser = activeSession?.user || data?.user;

    setStatus("Вход выполнен. Перенаправляю в приложение...");
    window.location.replace(resolvePostAuthPath(authUser));
  } catch (error) {
    try {
      const localAuth = await signInLocalAccount(email, password);
      if (localAuth?.user) {
        setStatus("Вход выполнен. Перенаправляю в приложение...");
        window.location.replace(resolvePostAuthPath(localAuth.user));
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
    return "Не удалось связаться с сервером входа. Проверьте, что Supabase-проект активен и сайт открыт по публичной ссылке.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Почта для этого аккаунта еще не подтверждена. Откройте письмо от Supabase и подтвердите email. Если нужен вход сразу после регистрации, отключите Confirm email в настройках Supabase.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "Аккаунт не найден или пароль неверный. Если аккаунт только что создан, проверьте, не требуется ли подтверждение почты.";
  }

  return rawMessage || "Не удалось выполнить вход.";
}
