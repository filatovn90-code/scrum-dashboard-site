import { requireAuth, signOutCurrentUser } from "./auth-helpers.js";
import { getCurrentProfile, saveCurrentProfile } from "./supabase-client.js";
import { applyTranslations, localeLabels, onLocaleChange, setLocale, t } from "./i18n.js";
import { landingPath, loginPath } from "./route-paths.js";

const form = document.getElementById("profileForm");
const emailInput = document.getElementById("profileEmail");
const fullNameInput = document.getElementById("profileFullName");
const timezoneInput = document.getElementById("profileTimezone");
const localeSelect = document.getElementById("profileLocale");
const submitButton = document.getElementById("profileSubmit");
const statusBox = document.getElementById("profileStatus");
const logoutButton = document.getElementById("profileLogoutButton");

bootstrap();

logoutButton?.addEventListener("click", async () => {
  await signOutCurrentUser().catch(() => null);
  window.location.replace(landingPath());
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  setStatus(t("profile.saveProgress"));

  try {
    const locale = String(localeSelect?.value || "ru");
    const profile = await saveCurrentProfile({
      full_name: fullNameInput.value.trim(),
      timezone: timezoneInput.value.trim(),
      locale
    });

    emailInput.value = profile.email || "";
    fullNameInput.value = profile.full_name || "";
    timezoneInput.value = profile.timezone || "";
    localeSelect.value = profile.locale || locale;
    setLocale(profile.locale || locale);
    setStatus(t("profile.saved"));
  } catch (error) {
    setStatus(error.message || t("profile.saveError"), true);
  } finally {
    submitButton.disabled = false;
  }
});

onLocaleChange(() => {
  applyTranslations(document);
  renderLocaleOptions();
});

async function bootstrap() {
  const user = await requireAuth({ redirectTo: loginPath() });
  if (!user) {
    return;
  }

  renderLocaleOptions();

  try {
    const profile = await getCurrentProfile();
    emailInput.value = profile?.email || user.email || "";
    fullNameInput.value = profile?.full_name || "";
    timezoneInput.value = profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    localeSelect.value = profile?.locale || document.documentElement.lang || "ru";
    setStatus(t("profile.ready"));
  } catch (error) {
    setStatus(error.message || t("profile.loadError"), true);
  }
}

function renderLocaleOptions() {
  if (!localeSelect) {
    return;
  }

  const currentValue = localeSelect.value || document.documentElement.lang || "ru";
  localeSelect.innerHTML = Object.entries(localeLabels)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join("");
  localeSelect.value = currentValue;
}

function setStatus(message, isError = false) {
  if (!statusBox) {
    return;
  }

  statusBox.textContent = message;
  statusBox.classList.toggle("is-error", isError);
}
