import {
  buildServerAiContext,
  buildWeeklyReviewCachePayload,
  generateWeeklyReviewAiResponse,
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
import { buildRuleBasedWeeklyReview } from "../../mindpulse-ai-core.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  try {
    const { supabase, user } = await getServerAuthContext(req);
    const subscription = await getUserPlan(supabase, user.id);
    const usage = await getMonthlyAiUsageSummary(supabase, user.id, subscription.plan);
    const { context, range } = await buildServerAiContext(supabase, user.id, req.body || {});
    const cachePayload = buildWeeklyReviewCachePayload(context);
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
        review: parseAiPayload(cached.content, buildRuleBasedWeeklyReview(context))
      });
    }

    const ruleBased = buildRuleBasedWeeklyReview(context);

    if (subscription.plan === "free") {
      await saveAiReport(supabase, {
        userId: user.id,
        reportType: cachePayload.reportType,
        periodStart: range.periodStart,
        periodEnd: range.periodEnd,
        inputHash,
        content: serializeAiPayload(ruleBased),
        source: "rule_based"
      });

      return res.status(200).json({
        ok: true,
        plan: subscription.plan,
        source: "rule_based",
        usage,
        review: ruleBased
      });
    }

    const aiLimit = getPlanAiLimit(subscription.plan);
    if (usage.usedRequests >= aiLimit) {
      return res.status(200).json({
        ok: true,
        plan: subscription.plan,
        source: "rule_based",
        usage,
        review: ruleBased,
        fallbackReason: "AI request limit has been reached."
      });
    }

    try {
      const aiResult = await generateWeeklyReviewAiResponse(context);

      if (!aiResult) {
        await saveAiReport(supabase, {
          userId: user.id,
          reportType: cachePayload.reportType,
          periodStart: range.periodStart,
          periodEnd: range.periodEnd,
          inputHash,
          content: serializeAiPayload(ruleBased),
          source: "rule_based"
        });

        return res.status(200).json({
          ok: true,
          plan: subscription.plan,
          source: "rule_based",
          usage,
          review: ruleBased,
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
        eventType: "weekly_review_ai_request",
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
        review: aiResult.payload
      });
    } catch (error) {
      console.error("/api/ai/weekly-review failed, using fallback:", error);
      await saveAiReport(supabase, {
        userId: user.id,
        reportType: cachePayload.reportType,
        periodStart: range.periodStart,
        periodEnd: range.periodEnd,
        inputHash,
        content: serializeAiPayload(ruleBased),
        source: "rule_based"
      });

      return res.status(200).json({
        ok: true,
        plan: subscription.plan,
        source: "rule_based",
        usage,
        review: ruleBased,
        fallbackReason: "AI endpoint is temporarily unavailable."
      });
    }
  } catch (error) {
    console.error("/api/ai/weekly-review error:", error);
    return res.status(error.statusCode || 500).json({
      ok: false,
      error: error.message || "Could not build weekly review."
    });
  }
}
