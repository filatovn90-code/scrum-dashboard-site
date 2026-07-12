import {
  cacheRemoteSession,
  canUseLocalAuthFallback,
  createLocalAccount,
  ensureProfile,
  getSupabase,
  rememberLegacyAuthUser,
  waitForSessionPersistence
} from "./supabase-client.js";
import { redirectIfAuthenticated } from "./auth-helpers.js";
import { resolvePostAuthPath, startOnboardingForUser } from "./onboarding-helpers.js";
import { todayPath } from "./route-paths.js";

const form = document.getElementById("signupPageForm");
const emailInput = document.getElementById("signupPageEmail");
const passwordInput = document.getElementById("signupPagePassword");
const repeatInput = document.getElementById("signupPagePasswordRepeat");
const submitButton = document.getElementById("signupPageSubmit");
const statusBox = document.getElementById("signupPageStatus");

redirectIfAuthenticated({ redirectTo: todayPath() }).catch(() => null);

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = String(emailInput?.value || "").trim();
  const password = String(passwordInput?.value || "");
  const repeatPassword = String(repeatInput?.value || "");

  if (!email) {
    setStatus("Введите email.", true);
    return;
  }

  if (!password) {
    setStatus("Введите пароль.", true);
    return;
  }

  if (password !== repeatPassword) {
    setStatus("Пароли не совпадают.", true);
    return;
  }

  setStatus("Создаю аккаунт...");
  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      throw error;
    }

    if (data?.user) {
      rememberLegacyAuthUser(data.user);
    }

    if (data?.session) {
      cacheRemoteSession(data.session);
    }

    if (!data?.session && data?.user) {
      setStatus("Аккаунт создан, но почта еще не подтверждена. Откройте письмо от Supabase и подтвердите email.", true);
      return;
    }

    const activeSession = data?.session || await waitForSessionPersistence();
    const authUser = activeSession?.user || data?.user;

    if (!authUser) {
      throw new Error("Не удалось сохранить сессию после регистрации.");
    }

    await ensureProfile().catch(() => null);
    startOnboardingForUser(authUser);
    setStatus("Аккаунт создан. Перенаправляю в приложение...");
    window.location.replace(resolvePostAuthPath(authUser));
    return;
  } catch (error) {
    if (canUseLocalAuthFallback() && canUseLocalFallback(error)) {
      try {
        const localResult = await createLocalAccount(email, password);
        startOnboardingForUser(localResult?.user);
        setStatus("Аккаунт создан. Перенаправляю в приложение...");
        window.location.replace(resolvePostAuthPath(localResult?.user));
        return;
      } catch (localError) {
        setStatus(getReadableAuthError(localError, "signup"), true);
        return;
      }
    }

    setStatus(getReadableAuthError(error, "signup"), true);
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

function canUseLocalFallback(error) {
  const normalized = String(error?.message || "").trim().toLowerCase();
  return normalized.includes("failed to fetch")
    || normalized.includes("networkerror")
    || normalized.includes("email rate limit exceeded")
    || normalized.includes("email address not authorized");
}

function getReadableAuthError(error, mode) {
  const rawMessage = String(error?.message || "").trim();
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("failed to fetch") || normalized.includes("networkerror")) {
    return "Не удалось связаться с сервером регистрации. Проверьте, что Supabase-проект активен и сайт открыт по публичной ссылке.";
  }

  if (normalized.includes("user already registered")) {
    return "Такой email уже зарегистрирован. Попробуйте войти.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Аккаунт создан, но email еще не подтвержден. Подтвердите почту по письму от Supabase.";
  }

  if (normalized.includes("email rate limit exceeded")) {
    return "Слишком много попыток регистрации подряд. Подождите несколько минут или используйте другой email.";
  }

  if (normalized.includes("password should be at least")) {
    return "Пароль слишком короткий. Используйте более длинный пароль.";
  }

  if (normalized.includes("не удалось сохранить сессию")) {
    return "Регистрация прошла, но сессия не сохранилась. Обычно это связано с настройками домена, Redirect URL или переменных окружения.";
  }

  return rawMessage || (mode === "signup"
    ? "Не удалось создать аккаунт."
    : "Не удалось выполнить вход.");
}
