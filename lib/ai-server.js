import crypto from "node:crypto";
import OpenAI from "openai";
import {
  buildAiContext,
  buildCompactAiInput,
  buildRuleBasedCoachResponse,
  buildRuleBasedWeeklyReview,
  endOfWeekIso,
  normalizeTaskRecord,
  startOfWeekIso,
  toIsoDate
} from "../mindpulse-ai-core.js";

let openAiClient;

function getOpenAiClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  if (!openAiClient) {
    openAiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  return openAiClient;
}

export function resolveRange(input = {}) {
  const anchor = input.todayIso || toIsoDate(new Date());
  const periodStart = input.periodStart || startOfWeekIso(anchor);
  const periodEnd = input.periodEnd || endOfWeekIso(anchor);
  return {
    todayIso: anchor,
    periodStart,
    periodEnd
  };
}

export async function fetchAiSourceData(supabase, userId, range) {
  const checkinsPromise = supabase
    .from("daily_checkins")
    .select("checkin_date, energy_level, stress_level, focus_level, sleep_quality, mood")
    .eq("user_id", userId)
    .gte("checkin_date", range.periodStart)
    .lte("checkin_date", range.periodEnd)
    .order("checkin_date", { ascending: true });

  let tasksResponse = await supabase
    .from("tasks")
    .select("id, title, details, status, planned_date, task_type, cognitive_load, emotional_load, energy_required, estimated_minutes, is_focus, completed_at, archived_at, mental_cost, emotional_cost, recovery_minutes, task_intensity")
    .eq("user_id", userId)
    .gte("planned_date", range.periodStart)
    .lte("planned_date", range.periodEnd)
    .is("archived_at", null)
    .order("planned_date", { ascending: true });

  if (tasksResponse.error && String(tasksResponse.error.message || "").includes("mental_cost")) {
    tasksResponse = await supabase
      .from("tasks")
      .select("id, title, details, status, planned_date, task_type, cognitive_load, emotional_load, energy_required, estimated_minutes, is_focus, completed_at, archived_at")
      .eq("user_id", userId)
      .gte("planned_date", range.periodStart)
      .lte("planned_date", range.periodEnd)
      .is("archived_at", null)
      .order("planned_date", { ascending: true });
  }

  const [checkinsResult] = await Promise.all([checkinsPromise]);

  if (checkinsResult.error) {
    throw checkinsResult.error;
  }

  if (tasksResponse.error) {
    throw tasksResponse.error;
  }

  return {
    checkins: Array.isArray(checkinsResult.data) ? checkinsResult.data : [],
    tasks: Array.isArray(tasksResponse.data) ? tasksResponse.data.map(normalizeTaskRecord) : []
  };
}

export async function buildServerAiContext(supabase, userId, input = {}) {
  const range = resolveRange(input);
  const sourceData = await fetchAiSourceData(supabase, userId, range);
  const context = buildAiContext({
    periodStart: range.periodStart,
    periodEnd: range.periodEnd,
    todayIso: range.todayIso,
    checkins: sourceData.checkins,
    tasks: sourceData.tasks
  });

  return { range, sourceData, context };
}

export function hashAiInput(payload) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

export function serializeAiPayload(payload) {
  return JSON.stringify(payload);
}

export function parseAiPayload(content, fallback = null) {
  try {
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

export function buildCoachCachePayload(action, context) {
  return {
    reportType: `coach:${action}`,
    input: buildCompactAiInput(context)
  };
}

export function buildWeeklyReviewCachePayload(context) {
  return {
    reportType: "weekly_review",
    input: buildCompactAiInput(context)
  };
}

function buildCoachPrompt(action, context) {
  const compact = buildCompactAiInput(context);
  const ruleBased = buildRuleBasedCoachResponse(action, context);

  return [
    "You are MindPulse Pro AI Coach for knowledge workers.",
    "Use only the provided aggregated context. Do not mention medical diagnoses.",
    "Answer in Russian.",
    "Keep the answer practical, calm, and specific.",
    "Output JSON with keys: title, paragraphs, points.",
    `Action: ${action}`,
    `Compact context: ${JSON.stringify(compact)}`,
    `Rule-based baseline: ${JSON.stringify(ruleBased)}`
  ].join("\n\n");
}

function buildWeeklyReviewPrompt(context) {
  const compact = buildCompactAiInput(context);
  const baseline = buildRuleBasedWeeklyReview(context);

  return [
    "You are MindPulse Pro AI Weekly Review writer.",
    "Use only the provided aggregated context. Do not mention medical diagnoses.",
    "Answer in Russian as a short personal weekly letter.",
    "Output JSON with keys: title, paragraphs, points.",
    `Compact context: ${JSON.stringify(compact)}`,
    `Rule-based baseline: ${JSON.stringify(baseline)}`
  ].join("\n\n");
}

export async function generateCoachAiResponse(action, context) {
  const client = getOpenAiClient();
  if (!client) {
    return null;
  }

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.2",
    input: buildCoachPrompt(action, context),
    max_output_tokens: 700
  });

  const rawText = response.output_text || "";
  const parsed = parseAiPayload(rawText, null);

  return {
    payload: parsed || {
      title: "AI Coach",
      paragraphs: [rawText || "AI не вернул текст."],
      points: []
    },
    tokensInput: Number(response.usage?.input_tokens || 0),
    tokensOutput: Number(response.usage?.output_tokens || 0),
    estimatedCost: 0
  };
}

export async function generateWeeklyReviewAiResponse(context) {
  const client = getOpenAiClient();
  if (!client) {
    return null;
  }

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.2",
    input: buildWeeklyReviewPrompt(context),
    max_output_tokens: 900
  });

  const rawText = response.output_text || "";
  const parsed = parseAiPayload(rawText, null);

  return {
    payload: parsed || {
      title: "Weekly Review",
      paragraphs: [rawText || "AI не вернул текст."],
      points: []
    },
    tokensInput: Number(response.usage?.input_tokens || 0),
    tokensOutput: Number(response.usage?.output_tokens || 0),
    estimatedCost: 0
  };
}
