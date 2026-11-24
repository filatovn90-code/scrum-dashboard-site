import test from "node:test";
import assert from "node:assert/strict";
import { explainReadiness } from "../lib/load-explanation.js";

test("explains independent state signals, dense tasks and missing ratings", () => {
  const result = explainReadiness(
    { energy_level: 3, stress_level: 8, focus_level: 4 },
    [
      { task_type: "deep_work", cognitive_load: 5, emotional_load: 2 },
      { task_type: "communication", cognitive_load: 2, emotional_load: 5 },
      { task_type: "creative", cognitive_load: null, emotional_load: null }
    ],
    { state: "heavy", dailyLoadLevel: { key: "high" } }
  );
  assert.equal(result.summary, "stress");
  for (const factor of ["stress", "energy", "dense", "unrated"]) assert.ok(result.factors.includes(factor));
  assert.equal(result.action, "lighten");
});

test("balanced check-in receives a gentle non-prescriptive suggestion", () => {
  const result = explainReadiness(
    { energy_level: 8, stress_level: 3, focus_level: 8 },
    [{ task_type: "routine", cognitive_load: 2, emotional_load: 2 }],
    { state: "excellent", dailyLoadLevel: { key: "balanced" } }
  );
  assert.deepEqual(result, { summary: "balanced", factors: [], action: "steady" });
});

test("does not personalize the explanation without a check-in", () => {
  assert.deepEqual(explainReadiness(null), { summary: "missing", factors: [], action: "checkin" });
});
