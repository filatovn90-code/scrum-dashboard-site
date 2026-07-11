import {
  createLocalAccount,
  ensureProfile,
  getSupabase,
  rememberLegacyAuthUser
} from "./supabase-client.js";
import { resolvePostAuthPath, startOnboardingForUser } from "./onboarding-helpers.js";
import { redirectIfAuthenticated } from "./auth-helpers.js";
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

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const repeatPassword = repeatInput.value;

  if (!email) {
    setStatus("Введите email.", true);
    return;
  }

  if (password !== repeatPassword) {
    setStatus("Пароли не совпадают.", true);
    return;
  }

  setStatus("Создаю аккаунт...");
  submitButton.disabled = true;

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      throw error;
    }

    if (data?.user) {
      rememberLegacyAuthUser(data.user);
    }

    if (!data?.session && data?.user) {
      setStatus("Аккаунт создан, но email еще не подтвержден. Откройте письмо от Supabase и подтвердите почту. Если для прототипа нужен вход сразу после регистрации, отключите Confirm email в настройках Supabase.", true);
      return;
    }

    await ensureProfile().catch(() => null);
    setStatus("Аккаунт создан. Перенаправляю в приложение...");
    startOnboardingForUser(data.user);
    window.location.replace(resolvePostAuthPath(data.user));
  } catch (error) {
    if (canUseLocalFallback(error)) {
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
    submitButton.disabled = false;
  }
});

function setStatus(message, isError = false) {
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
    return "Аккаунт создан, но email еще не подтвержден. Подтвердите почту по письму от Supabase или отключите Confirm email в Supabase, если нужен вход сразу после регистрации.";
  }

  if (normalized.includes("email rate limit exceeded")) {
    return "Слишком много попыток регистрации подряд. Подождите несколько минут или используйте другой email.";
  }

  if (normalized.includes("password should be at least")) {
    return "Пароль слишком короткий. Используйте более длинный пароль.";
  }

  if (normalized.includes("локально")) {
    return rawMessage;
  }

  return rawMessage || (mode === "signup"
    ? "Не удалось создать аккаунт."
    : "Не удалось выполнить вход.");
}
