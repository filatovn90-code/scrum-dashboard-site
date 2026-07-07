import { requireAuth, signOutCurrentUser } from "./auth-helpers.js";
import { getCurrentProfile, getSupabase } from "./supabase-client.js";
import { landingPath, loginPath } from "./route-paths.js";

const todayIso = new Date().toISOString().slice(0, 10);

const sessionBadge = document.getElementById("todaySessionBadge");
const pageStatus = document.getElementById("todayPageStatus");
const logoutButton = document.getElementById("todayLogoutButton");

const checkinForm = document.getElementById("todayCheckinForm");
const checkinStatus = document.getElementById("todayCheckinStatus");
const energyInput = document.getElementById("todayEnergyInput");
const stressInput = document.getElementById("todayStressInput");
const focusInput = document.getElementById("todayFocusInput");
const energyValue = document.getElementById("todayEnergyValue");
const stressValue = document.getElementById("todayStressValue");
const focusValue = document.getElementById("todayFocusValue");
const sleepSelect = document.getElementById("todaySleepSelect");
const moodSelect = document.getElementById("todayMoodSelect");

const capacityPercent = document.getElementById("todayCapacityPercent");
const capacityLabel = document.getElementById("todayCapacityLabel");
const capacityBar = document.getElementById("todayCapacityBar");
const capacityNote = document.getElementById("todayCapacityNote");

let supabase;
let currentUser;
let currentProfile;
let todayCheckin = null;

bootstrap();

logoutButton?.addEventListener("click", async () => {
  await signOutCurrentUser().catch(() => null);
  window.location.replace(landingPath());
});

checkinForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveTodayCheckin();
});

[energyInput, stressInput, focusInput].forEach((input) => {
  input?.addEventListener("input", () => {
    syncRangeOutputs();
    renderCapacity();
  });
});

sleepSelect?.addEventListener("change", renderCapacity);
moodSelect?.addEventListener("change", renderCapacity);

async function bootstrap() {
  currentUser = await requireAuth({ redirectTo: loginPath() });
  if (!currentUser) {
    return;
  }

  supabase = await getSupabase();
  currentProfile = await getCurrentProfile().catch(() => null);
  sessionBadge.textContent = currentProfile?.full_name || currentUser.email || "Пользователь";
  syncRangeOutputs();

  try {
    await loadTodayCheckin();
    fillCheckinForm();
    renderCapacity();
    setPageStatus("");
  } catch (error) {
    showPageError(error.message || "Не удалось открыть экран Сегодня.");
  }
}

async function loadTodayCheckin() {
  setPageStatus("Загружаю экран Сегодня...");

  const { data, error } = await supabase
    .from("daily_checkins")
    .select("id, checkin_date, energy_level, stress_level, focus_level, sleep_quality, mood, updated_at")
    .eq("user_id", currentUser.id)
    .eq("checkin_date", todayIso)
    .maybeSingle();

  if (error) {
    throw withMigrationHint(error, "daily_checkins");
  }

  todayCheckin = data || null;
}

async function saveTodayCheckin() {
  setCheckinStatus("Сохраняю состояние...");

  const payload = {
    user_id: currentUser.id,
    checkin_date: todayIso,
    energy_level: Number(energyInput.value),
    stress_level: Number(stressInput.value),
    focus_level: Number(focusInput.value),
    sleep_quality: sleepSelect.value || null,
    mood: moodSelect.value || null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("daily_checkins")
    .upsert(payload, { onConflict: "user_id,checkin_date" });

  if (error) {
    setCheckinStatus(withMigrationHint(error, "daily_checkins").message, true);
    return;
  }

  todayCheckin = { ...(todayCheckin || {}), ...payload };
  setCheckinStatus("Состояние сохранено.");
  renderCapacity();
}

function fillCheckinForm() {
  if (!todayCheckin) {
    energyInput.value = "6";
    stressInput.value = "4";
    focusInput.value = "6";
    sleepSelect.value = "";
    moodSelect.value = "";
    syncRangeOutputs();
    setCheckinStatus("Заполни состояние дня, чтобы приложение точнее оценило нагрузку.");
    return;
  }

  energyInput.value = String(todayCheckin.energy_level || 6);
  stressInput.value = String(todayCheckin.stress_level || 4);
  focusInput.value = String(todayCheckin.focus_level || 6);
  sleepSelect.value = todayCheckin.sleep_quality || "";
  moodSelect.value = todayCheckin.mood || "";
  syncRangeOutputs();
  setCheckinStatus("Данные за сегодня загружены.");
}

function syncRangeOutputs() {
  energyValue.textContent = energyInput.value;
  stressValue.textContent = stressInput.value;
  focusValue.textContent = focusInput.value;
}

function renderCapacity() {
  const metrics = calculateCapacityMetrics();
  capacityPercent.textContent = `${metrics.percent}%`;
  capacityLabel.textContent = metrics.label;
  capacityLabel.dataset.state = metrics.state;
  capacityBar.style.width = `${Math.min(metrics.percent, 100)}%`;
  capacityBar.dataset.state = metrics.state;
  capacityNote.textContent = metrics.note;
}

function calculateCapacityMetrics() {
  const energy = Number(energyInput?.value || todayCheckin?.energy_level || 6);
  const stress = Number(stressInput?.value || todayCheckin?.stress_level || 4);
  const focus = Number(focusInput?.value || todayCheckin?.focus_level || 6);

  let percent = 55;
  percent -= (energy - 5) * 6;
  percent += (stress - 5) * 7;
  percent -= (focus - 5) * 4;
  percent = Math.max(10, Math.min(120, Math.round(percent)));

  if (percent <= 45) {
    return {
      percent,
      state: "normal",
      label: "Нормальная нагрузка",
      note: "Состояние выглядит достаточно устойчивым. Можно планировать день спокойно и без перегруза."
    };
  }

  if (percent <= 75) {
    return {
      percent,
      state: "high",
      label: "Высокая нагрузка",
      note: "День лучше держать компактным. Старайся не набирать слишком много сложных дел."
    };
  }

  return {
    percent,
    state: "risk",
    label: "Риск перегруза",
    note: "Сейчас лучше снизить темп и не перегружать себя. Полезно оставить только самое важное."
  };
}

function withMigrationHint(error, tableName) {
  const message = String(error?.message || "");
  if (message.includes("sleep_quality") || message.includes("mood")) {
    return new Error(`Для экрана Сегодня нужно сначала выполнить SQL из файла supabase/today-screen-migration.sql. Таблица: ${tableName}.`);
  }

  return error instanceof Error ? error : new Error(message || "Неизвестная ошибка.");
}

function showPageError(message) {
  setPageStatus(message, true);
  sessionBadge.textContent = "Ошибка";
}

function setPageStatus(message, isError = false) {
  if (!message) {
    pageStatus.hidden = true;
    pageStatus.textContent = "";
    pageStatus.classList.remove("is-error");
    return;
  }

  pageStatus.hidden = false;
  pageStatus.textContent = message;
  pageStatus.classList.toggle("is-error", isError);
}

function setCheckinStatus(message, isError = false) {
  checkinStatus.textContent = message;
  checkinStatus.classList.toggle("is-error", isError);
}
