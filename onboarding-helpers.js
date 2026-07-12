import { appPath, onboardingPath } from "./route-paths.js";

const ONBOARDING_KEY_PREFIX = "mindpulse-onboarding";

function stateKey(userId) {
  return `${ONBOARDING_KEY_PREFIX}:${userId}`;
}

function readRaw(userId) {
  const raw = window.appStorage?.getItem(stateKey(userId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRaw(userId, value) {
  window.appStorage?.setItem(stateKey(userId), JSON.stringify(value));
}

export function getOnboardingState(userId) {
  if (!userId) {
    return null;
  }

  return readRaw(userId);
}

export function startOnboardingForUser(user) {
  if (!user?.id) {
    return null;
  }

  const existing = readRaw(user.id);
  if (existing?.completed) {
    return existing;
  }

  const nextState = {
    userId: user.id,
    startedAt: existing?.startedAt || new Date().toISOString(),
    currentStep: existing?.currentStep || 1,
    completed: false,
    goal: existing?.goal || "",
    taskIds: Array.isArray(existing?.taskIds) ? existing.taskIds : [],
    focusTaskIds: Array.isArray(existing?.focusTaskIds) ? existing.focusTaskIds : []
  };

  writeRaw(user.id, nextState);
  return nextState;
}

export function updateOnboardingState(userId, patch) {
  if (!userId) {
    return null;
  }

  const current = readRaw(userId) || {
    userId,
    startedAt: new Date().toISOString(),
    currentStep: 1,
    completed: false,
    goal: "",
    taskIds: [],
    focusTaskIds: []
  };

  const nextState = {
    ...current,
    ...patch
  };

  writeRaw(userId, nextState);
  return nextState;
}

export function completeOnboardingForUser(userId) {
  return updateOnboardingState(userId, {
    completed: true,
    currentStep: 5,
    completedAt: new Date().toISOString()
  });
}

export function isOnboardingPendingForUser(user) {
  if (!user?.id) {
    return false;
  }

  const state = readRaw(user.id);
  return Boolean(state?.startedAt && !state?.completed);
}

export function resolvePostAuthPath(user) {
  return isOnboardingPendingForUser(user) ? onboardingPath() : appPath();
}
