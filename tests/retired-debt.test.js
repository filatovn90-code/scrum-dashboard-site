import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildAiContext, buildCompactAiInput, buildRuleBasedCoachResponse } from "../mindpulse-ai-core.js";

test("retired metric is absent from UI and coach output", () => {
  for (const name of ["today.html", "analytics.html", "pricing.html", "pricing/index.html"]) {
    const html = readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
    assert.doesNotMatch(html, /энергетический долг|energy debt/i);
  }
  const context = buildAiContext({ periodStart: "2026-11-15", periodEnd: "2026-11-15", checkins: [], tasks: [] });
  assert.doesNotMatch(JSON.stringify(buildCompactAiInput(context)), /energyDebt|energy debt|энергетический долг/i);
  for (const action of ["move", "why-tired", "reduce-load", "weekly-review", "plan"]) {
    assert.doesNotMatch(JSON.stringify(buildRuleBasedCoachResponse(action, context)), /energy debt|энергетический долг/i);
  }
});
