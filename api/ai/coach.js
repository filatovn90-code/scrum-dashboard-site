import {
  buildCoachCachePayload,
  buildServerAiContext,
  generateCoachAiResponse,
  hashAiInput,
  parseAiPayload,
  serializeAiPayload
} from "../../lib/ai-server.js";
import {
  getCachedAiReport,
  getMonthlyAiUsageSummary,
  getPlanAiLimit,
  getServerAuthContext,
  getUserPlan,
  recordAiUsageEvent,
  saveAiReport
} from "../../lib/server-supabase.js";
import { buildRuleBasedCoachResponse } from "../../mindpulse-ai-core.js";

function respondMethodNotAllowed(res) {
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ ok: false, error: "Method not allowed." });
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return respondMethodNotAllowed(res);
  }

  try {
    const { supabase, user } = await getServerAuthContext(req);
    const subscription = await getUserPlan(supabase, user.id);
    const usage = await getMonthlyAiUsageSummary(supabase, user.id, subscription.plan);

    if (req.method === "GET") {
      return res.status(200).json({
        ok: true,
        plan: subscription.plan,
        status: subscription.status,
        mode: subscription.plan === "free" ? "free_coach" : "pro_ai",
        usage
      });
    }

    const action = String(req.body?.action || "plan-day").trim() || "plan-day";
    const { context, range } = await buildServerAiContext(supabase, user.id, req.body || {});
    const cachePayload = buildCoachCachePayload(action, context);
    const inputHash = hashAiInput(cachePayload.input);
    const cached = await getCachedAiReport(supabase, {
      userId: user.id,
      reportType: cachePayload.reportType,
      periodStart: range.periodStart,
      periodEnd: range.periodEnd,
      inputHash
    });

    if (cached?.content) {
      return res.status(200).json({
        ok: true,
        plan: subscription.plan,
        source: "cache",
        usage,
        response: parseAiPayload(cached.content, buildRuleBasedCoachResponse(action, context))
      });
    }

    const ruleBased = buildRuleBasedCoachResponse(action, context);
    const aiLimit = getPlanAiLimit(subscription.plan);
    const canUseRealAi = subscription.plan !== "free" && usage.usedRequests < aiLimit;

    if (!canUseRealAi) {
      return res.status(200).json({
        ok: true,
        plan: subscription.plan,
        source: "rule_based",
        upgradeRequired: subscription.plan === "free",
        usage,
        response: ruleBased
      });
    }

    try {
      const aiResult = await generateCoachAiResponse(action, context);

      if (!aiResult) {
        return res.status(200).json({
          ok: true,
          plan: subscription.plan,
          source: "rule_based",
          usage,
          response: ruleBased,
          fallbackReason: "AI API key is missing."
        });
      }

      await saveAiReport(supabase, {
        userId: user.id,
        reportType: cachePayload.reportType,
        periodStart: range.periodStart,
        periodEnd: range.periodEnd,
        inputHash,
        content: serializeAiPayload(aiResult.payload),
        source: "openai"
      });

      await recordAiUsageEvent(supabase, {
        userId: user.id,
        eventType: "coach_ai_request",
        provider: "openai",
        tokensInput: aiResult.tokensInput,
        tokensOutput: aiResult.tokensOutput,
        estimatedCost: aiResult.estimatedCost
      });

      return res.status(200).json({
        ok: true,
        plan: subscription.plan,
        source: "openai",
        usage: {
          ...usage,
          usedRequests: usage.usedRequests + 1,
          remainingRequests: Math.max(0, aiLimit - (usage.usedRequests + 1))
        },
        response: aiResult.payload
      });
    } catch (error) {
      console.error("/api/ai/coach failed, using fallback:", error);
      return res.status(200).json({
        ok: true,
        plan: subscription.plan,
        source: "rule_based",
        usage,
        response: ruleBased,
        fallbackReason: "AI endpoint is temporarily unavailable."
      });
    }
  } catch (error) {
    console.error("/api/ai/coach error:", error);
    return res.status(error.statusCode || 500).json({
      ok: false,
      error: error.message || "Could not build coach response."
    });
  }
}
