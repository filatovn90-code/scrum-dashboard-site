import {
  cacheRemoteSession,
  canUseLocalAuthFallback,
  getSupabase,
  rememberLegacyAuthUser,
  signInLocalAccount,
  waitForSessionPersistence
} from "./supabase-client.js";
import { redirectIfAuthenticated } from "./auth-helpers.js";
import { applyTranslations, onLocaleChange, t } from "./i18n.js";
import { resolvePostAuthPath } from "./onboarding-helpers.js";
import { todayPath } from "./route-paths.js";

const form = document.getElementById("loginPageForm");
const emailInput = document.getElementById("loginPageEmail");
const passwordInput = document.getElementById("loginPagePassword");
const submitButton = document.getElementById("loginPageSubmit");
const statusBox = document.getElementById("loginPageStatus");

redirectIfAuthenticated({ redirectTo: todayPath() }).catch(() => null);

onLocaleChange(() => applyTranslations(document));

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = String(emailInput?.value || "").trim();
  const password = String(passwordInput?.value || "");

  if (!email || !password) {
    setStatus(t("auth.loginIdle"), true);
    return;
  }

  setStatus(t("auth.checking"));
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
      throw new Error("SESSION_PERSISTENCE_FAILED");
    }

    setStatus(t("auth.signingIn"));
    window.location.replace(resolvePostAuthPath(authUser));
  } catch (error) {
    if (canUseLocalAuthFallback()) {
      try {
        const localAuth = await signInLocalAccount(email, password);
        if (localAuth?.user) {
          setStatus(t("auth.signingIn"));
          window.location.replace(resolvePostAuthPath(localAuth.user));
          return;
        }
      } catch {
        // Show normalized remote error below.
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
    return t("authErrors.remoteUnavailable");
  }

  if (normalized.includes("email not confirmed")) {
    return t("authErrors.emailNotConfirmed");
  }

  if (normalized.includes("invalid login credentials")) {
    return t("authErrors.invalidCredentials");
  }

  if (normalized.includes("session_persistence_failed")) {
    return t("authErrors.sessionPersistence");
  }

  return rawMessage || t("validation.signInFailed");
}
