import { getCurrentProfile, saveCurrentProfile } from "./supabase-client.js";
import { requireAuth, signOutCurrentUser } from "./auth-helpers.js";
import { landingPath, loginPath } from "./route-paths.js";

const form = document.getElementById("profileForm");
const emailInput = document.getElementById("profileEmail");
const fullNameInput = document.getElementById("profileFullName");
const timezoneInput = document.getElementById("profileTimezone");
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
  setStatus("Сохраняю профиль...");

  try {
    const profile = await saveCurrentProfile({
      full_name: fullNameInput.value.trim(),
      timezone: timezoneInput.value.trim()
    });

    emailInput.value = profile.email || "";
    fullNameInput.value = profile.full_name || "";
    timezoneInput.value = profile.timezone || "";
    setStatus("Профиль сохранён.");
  } catch (error) {
    setStatus(error.message || "Не удалось сохранить профиль.", true);
  } finally {
    submitButton.disabled = false;
  }
});

async function bootstrap() {
  const user = await requireAuth({ redirectTo: loginPath() });
  if (!user) {
    return;
  }

  try {
    const profile = await getCurrentProfile();
    emailInput.value = profile?.email || user.email || "";
    fullNameInput.value = profile?.full_name || "";
    timezoneInput.value = profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    setStatus("Профиль можно обновить.");
  } catch (error) {
    setStatus(error.message || "Не удалось загрузить профиль.", true);
  }
}

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.classList.toggle("is-error", isError);
}
