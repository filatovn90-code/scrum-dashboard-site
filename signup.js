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
import { applyTranslations, onLocaleChange, t } from "./i18n.js";
import { resolvePostAuthPath } from "./onboarding-helpers.js";
import { appPath } from "./route-paths.js";

const form = document.getElementById("signupPageForm");
const emailInput = document.getElementById("signupPageEmail");
const passwordInput = document.getElementById("signupPagePassword");
const repeatInput = document.getElementById("signupPagePasswordRepeat");
const submitButton = document.getElementById("signupPageSubmit");
const statusBox = document.getElementById("signupPageStatus");

redirectIfAuthenticated({ redirectTo: appPath() }).catch(() => null);

onLocaleChange(() => applyTranslations(document));

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = String(emailInput?.value || "").trim();
  const password = String(passwordInput?.value || "");
  const repeatPassword = String(repeatInput?.value || "");

  if (!email) {
    setStatus(t("validation.requiredEmail"), true);
    return;
  }

  if (!password) {
    setStatus(t("validation.requiredPassword"), true);
    return;
  }

  if (password !== repeatPassword) {
    setStatus(t("validation.passwordMismatch"), true);
    return;
  }

  setStatus(t("auth.creatingAccount"));
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
      setStatus(t("authErrors.signupEmailNotConfirmed"), true);
      return;
    }

    const activeSession = data?.session || await waitForSessionPersistence();
    const authUser = activeSession?.user || data?.user;

    if (!authUser) {
      throw new Error("SESSION_PERSISTENCE_FAILED");
    }

    await ensureProfile().catch(() => null);
    setStatus(t("auth.accountCreated"));
    window.location.replace(resolvePostAuthPath(authUser));
  } catch (error) {
    if (canUseLocalAuthFallback() && canUseLocalFallback(error)) {
      try {
        const localResult = await createLocalAccount(email, password);
        setStatus(t("auth.accountCreated"));
        window.location.replace(resolvePostAuthPath(localResult?.user));
        return;
      } catch (localError) {
        setStatus(getReadableAuthError(localError), true);
        return;
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

function canUseLocalFallback(error) {
  const normalized = String(error?.message || "").trim().toLowerCase();
  return normalized.includes("failed to fetch")
    || normalized.includes("networkerror")
    || normalized.includes("email rate limit exceeded")
    || normalized.includes("email address not authorized");
}

function getReadableAuthError(error) {
  const rawMessage = String(error?.message || "").trim();
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("failed to fetch") || normalized.includes("networkerror")) {
    return t("authErrors.remoteUnavailable");
  }

  if (normalized.includes("user already registered")) {
    return t("authErrors.userAlreadyRegistered");
  }

  if (normalized.includes("email not confirmed")) {
    return t("authErrors.signupEmailNotConfirmed");
  }

  if (normalized.includes("email rate limit exceeded")) {
    return t("authErrors.emailRateLimit");
  }

  if (normalized.includes("password should be at least")) {
    return t("authErrors.weakPassword");
  }

  if (normalized.includes("session_persistence_failed")) {
    return t("authErrors.sessionPersistenceSignup");
  }

  return rawMessage || t("validation.signUpFailed");
}
