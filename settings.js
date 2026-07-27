import { requireAuth } from "./auth-helpers.js";
import { getCurrentProfile, saveCurrentProfile } from "./supabase-client.js";
import { applyTranslations, localeLabels, onLocaleChange, setLocale, t } from "./i18n.js";
import { loginPath } from "./route-paths.js";

const form = document.getElementById("settingsForm");
const localeSelect = document.getElementById("settingsLocale");
const submitButton = document.getElementById("settingsSubmit");
const statusBox = document.getElementById("settingsStatus");

bootstrap();

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  setStatus(t("settings.saveProgress"));

  try {
    const locale = String(localeSelect?.value || "ru");
    await saveCurrentProfile({ locale });
    setLocale(locale);
    setStatus(t("settings.saved"));
  } catch (error) {
    setStatus(error.message || t("settings.saveError"), true);
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
    localeSelect.value = profile?.locale || document.documentElement.lang || "ru";
    setStatus(t("settings.ready"));
  } catch (error) {
    setStatus(error.message || t("settings.saveError"), true);
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
