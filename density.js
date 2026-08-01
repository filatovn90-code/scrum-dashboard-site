const DENSITY_STORAGE_KEY = "mindpulse_density_mode";
const DESKTOP_QUERY = "(min-width: 1280px)";
const VALID_DENSITY_MODES = new Set(["compact", "comfortable"]);

let resizeBound = false;
const listeners = new Set();

function readStoredDensityMode() {
  const stored = window.appStorage?.getItem(DENSITY_STORAGE_KEY);
  return VALID_DENSITY_MODES.has(stored) ? stored : null;
}

function detectAutoDensityMode() {
  try {
    return window.matchMedia(DESKTOP_QUERY).matches ? "compact" : "comfortable";
  } catch {
    return "comfortable";
  }
}

function resolveDensityMode() {
  return readStoredDensityMode() || detectAutoDensityMode();
}

function applyDensityMode(mode) {
  const nextMode = VALID_DENSITY_MODES.has(mode) ? mode : "comfortable";
  document.documentElement.dataset.density = nextMode;
  document.body.dataset.density = nextMode;
  listeners.forEach((listener) => listener(nextMode));
  return nextMode;
}

function handleAutoResize() {
  if (readStoredDensityMode()) {
    return;
  }
  applyDensityMode(detectAutoDensityMode());
}

export function initDensityMode() {
  const mode = applyDensityMode(resolveDensityMode());
  if (!resizeBound) {
    window.addEventListener("resize", handleAutoResize);
    resizeBound = true;
  }
  return mode;
}

export function getDensityMode() {
  return document.body?.dataset?.density || resolveDensityMode();
}

export function setDensityMode(mode) {
  const nextMode = applyDensityMode(mode);
  window.appStorage?.setItem(DENSITY_STORAGE_KEY, nextMode);
  return nextMode;
}

export function clearDensityModePreference() {
  window.appStorage?.removeItem(DENSITY_STORAGE_KEY);
  return applyDensityMode(detectAutoDensityMode());
}

export function onDensityModeChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
