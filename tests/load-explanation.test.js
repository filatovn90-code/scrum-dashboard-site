import test from "node:test";
import assert from "node:assert/strict";
import { explainLoad } from "../lib/load-explanation.js";

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
  assert.deepEqual(explainLoad([]), { count: 0, contributors: [], hasRecovery: false });
});
