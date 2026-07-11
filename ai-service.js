import { getCurrentSession } from "./auth-helpers.js";

function canUseServerApi() {
  return window.location.protocol !== "file:";
}

async function buildAuthHeaders() {
  const session = await getCurrentSession().catch(() => null);
  const token = session?.access_token;

  if (!token) {
    throw new Error("Session is missing.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.error || "AI request failed.");
  }
  return data;
}

export async function fetchCoachStatus() {
  if (!canUseServerApi()) {
    return null;
  }

  const headers = await buildAuthHeaders();
  const response = await fetch("/api/ai/coach", {
    method: "GET",
    headers
  });

  return parseJsonResponse(response);
}

export async function requestCoachResponse(payload) {
  if (!canUseServerApi()) {
    return null;
  }

  const headers = await buildAuthHeaders();
  const response = await fetch("/api/ai/coach", {
    method: "POST",
    headers,
    body: JSON.stringify(payload || {})
  });

  return parseJsonResponse(response);
}

export async function requestWeeklyReview(payload) {
  if (!canUseServerApi()) {
    return null;
  }

  const headers = await buildAuthHeaders();
  const response = await fetch("/api/ai/weekly-review", {
    method: "POST",
    headers,
    body: JSON.stringify(payload || {})
  });

  return parseJsonResponse(response);
}
