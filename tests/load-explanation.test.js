import test from "node:test";
import assert from "node:assert/strict";
import { explainLoad } from "../lib/load-explanation.js";
import { calculateDailyLoad } from "../lib/workload.js";

test("explains highest positive contributors and separates recovery", () => {
  const result = explainLoad([
    { title: "Routine", task_type: "routine", cognitive_load: 1, emotional_load: 1 },
    { title: "Focus", task_type: "deep_work", cognitive_load: 5, emotional_load: 4 },
    { title: "Break", task_type: "recovery", cognitive_load: 2, emotional_load: 2 }
  ]);
  assert.equal(result.count, 3);
  assert.equal(result.contributors[0].title, "Focus");
  assert.equal(result.contributors.some((task) => task.title === "Break"), false);
  assert.equal(result.hasRecovery, true);
});

test("empty plan has no invented contributors", () => {
  const result = explainLoad([]);
  assert.equal(result.count, 0);
  assert.deepEqual(result.contributors, []);
  assert.equal(result.hasRecovery, false);
  assert.equal(result.breakdown.total, 0);
});

test("breakdown matches the real calculation including cap and multiplier", () => {
  const tasks = [
    ...Array.from({ length: 4 }, (_, i) => ({ title: `Focus ${i}`, task_type: "deep_work", cognitive_load: 5, emotional_load: 4 })),
    ...Array.from({ length: 12 }, () => ({ task_type: "recovery", cognitive_load: 5, emotional_load: 5 }))
  ];
  const actual = calculateDailyLoad(tasks);
  const result = explainLoad(tasks);
  assert.deepEqual(result.breakdown, { positiveLoads: actual.positiveLoads, multiplier: actual.multiplier, recoveryOffset: actual.recoveryOffset, total: actual.total });
  assert.ok(result.breakdown.multiplier > 1);
  assert.ok(result.breakdown.recoveryOffset < 0);
});

test("recovery alone cannot invent positive load", () => {
  const result = explainLoad([{ task_type: "recovery", cognitive_load: 3, emotional_load: 2 }]);
  assert.equal(result.breakdown.total, 0);
  assert.equal(result.contributors.length, 0);
});
