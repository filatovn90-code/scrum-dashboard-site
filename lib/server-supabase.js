import { createClient } from "@supabase/supabase-js";

export const PLAN_LIMITS = {
  free: 0,
  pro: 100,
  premium: 500
};

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are missing on the server.");
  }

  return { url, anonKey };
}

export function extractBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

function createAuthedClient(token) {
  const { url, anonKey } = getSupabaseEnv();

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

export async function getServerAuthContext(req) {
  const token = extractBearerToken(req);
  if (!token) {
    const error = new Error("Authorization token is missing.");
    error.statusCode = 401;
    throw error;
  }

  const supabase = createAuthedClient(token);
  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    const authError = new Error(error?.message || "User is not authenticated.");
    authError.statusCode = 401;
    throw authError;
  }

  return { supabase, user, token };
}

export function normalizePlan(plan) {
  const normalized = String(plan || "free").trim().toLowerCase();
  if (normalized === "premium") return "premium";
  if (normalized === "pro") return "pro";
  return "free";
}

export function getPlanAiLimit(plan) {
  return PLAN_LIMITS[normalizePlan(plan)] ?? PLAN_LIMITS.free;
}

export function isMissingTableError(error, tableName) {
  const message = String(error?.message || "").toLowerCase();
  const table = String(tableName || "").toLowerCase();
  return message.includes(table) || message.includes(`relation "${table}"`) || message.includes("schema cache");
}

export async function getUserPlan(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error, "subscriptions")) {
        return { plan: "free", status: "active", source: "fallback" };
      }
      throw error;
    }

    if (!data) {
      return { plan: "free", status: "active", source: "default" };
    }

    return {
      plan: normalizePlan(data.plan),
      status: data.status || "active",
      currentPeriodEnd: data.current_period_end || null,
      source: "subscriptions"
    };
  } catch (error) {
    if (isMissingTableError(error, "subscriptions")) {
      return { plan: "free", status: "active", source: "fallback" };
    }
    throw error;
  }
}

export async function getMonthlyAiUsageSummary(supabase, userId, plan) {
  const periodStart = new Date();
  periodStart.setUTCDate(1);
  periodStart.setUTCHours(0, 0, 0, 0);
  const startIso = periodStart.toISOString();
  const limit = getPlanAiLimit(plan);

  try {
    const { data, error } = await supabase
      .from("ai_usage_events")
      .select("event_type, tokens_input, tokens_output, estimated_cost, created_at")
      .eq("user_id", userId)
      .gte("created_at", startIso)
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingTableError(error, "ai_usage_events")) {
        return { usedRequests: 0, limit, remainingRequests: limit, totalEstimatedCost: 0, source: "fallback" };
      }
      throw error;
    }

    const rows = Array.isArray(data) ? data : [];
    const usedRequests = rows.filter((item) => String(item.event_type || "").includes("ai_request")).length;
    const totalEstimatedCost = rows.reduce((sum, item) => sum + Number(item.estimated_cost || 0), 0);

    return {
      usedRequests,
      limit,
      remainingRequests: Math.max(0, limit - usedRequests),
      totalEstimatedCost,
      source: "events"
    };
  } catch (error) {
    if (isMissingTableError(error, "ai_usage_events")) {
      return { usedRequests: 0, limit, remainingRequests: limit, totalEstimatedCost: 0, source: "fallback" };
    }
    throw error;
  }
}

export async function getCachedAiReport(supabase, params) {
  const {
    userId,
    reportType,
    periodStart,
    periodEnd,
    inputHash
  } = params;

  try {
    const { data, error } = await supabase
      .from("ai_reports")
      .select("id, content, source, created_at, updated_at")
      .eq("user_id", userId)
      .eq("report_type", reportType)
      .eq("period_start", periodStart)
      .eq("period_end", periodEnd)
      .eq("input_hash", inputHash)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error, "ai_reports")) {
        return null;
      }
      throw error;
    }

    return data || null;
  } catch (error) {
    if (isMissingTableError(error, "ai_reports")) {
      return null;
    }
    throw error;
  }
}

export async function saveAiReport(supabase, params) {
  const payload = {
    user_id: params.userId,
    report_type: params.reportType,
    period_start: params.periodStart,
    period_end: params.periodEnd,
    input_hash: params.inputHash,
    content: params.content,
    source: params.source || "rule_based",
    updated_at: new Date().toISOString()
  };

  try {
    await supabase
      .from("ai_reports")
      .upsert(payload, { onConflict: "user_id,report_type,period_start,period_end,input_hash" });
  } catch (error) {
    if (!isMissingTableError(error, "ai_reports")) {
      throw error;
    }
  }
}

export async function recordAiUsageEvent(supabase, params) {
  try {
    await supabase
      .from("ai_usage_events")
      .insert({
        user_id: params.userId,
        event_type: params.eventType,
        provider: params.provider || null,
        tokens_input: Number(params.tokensInput || 0),
        tokens_output: Number(params.tokensOutput || 0),
        estimated_cost: Number(params.estimatedCost || 0)
      });
  } catch (error) {
    if (!isMissingTableError(error, "ai_usage_events")) {
      throw error;
    }
  }
}
