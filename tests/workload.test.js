import assert from "node:assert/strict";
import {
  calculateDailyLoad,
  calculateEnergyDebtSeries,
  calculateReadinessScore,
  calculateTaskIntensity,
  calculateTaskLoad,
  normalizeTask
} from "../lib/workload.js";

function testRoutineLowLoad() {
  const load = calculateTaskLoad({
    task_type: "routine",
    cognitive_load: 1,
    emotional_load: 1
  });

  assert.ok(load > 0);
  assert.ok(load <= 10);
}

function testDeepWorkHighCognitiveLoad() {
  const load = calculateTaskLoad({
    task_type: "deep_work",
    cognitive_load: 5,
    emotional_load: 2
  });

  assert.ok(load >= 30);
  assert.ok(load <= 35);
  assert.equal(calculateTaskIntensity({
    task_type: "deep_work",
    cognitive_load: 5,
    emotional_load: 2
  }).key, "high");
}

function testCommunicationHighEmotionalLoad() {
  const load = calculateTaskLoad({
    task_type: "communication",
    cognitive_load: 2,
    emotional_load: 5
  });

  assert.ok(load >= 25);
  assert.ok(load <= 30);
}

function testRecoveryDoesNotZeroDay() {
  const metrics = calculateDailyLoad([
    { task_type: "deep_work", cognitive_load: 5, emotional_load: 3 },
    { task_type: "recovery", cognitive_load: 1, emotional_load: 1 }
  ]);

  assert.ok(metrics.total > 0);
  assert.ok(metrics.recoveryOffset < 0);
}

function testThreeDeepWorkTasksTriggerRisk() {
  const metrics = calculateDailyLoad([
    { task_type: "deep_work", cognitive_load: 4, emotional_load: 2 },
    { task_type: "deep_work", cognitive_load: 4, emotional_load: 2 },
    { task_type: "deep_work", cognitive_load: 4, emotional_load: 2 }
  ]);

  assert.equal(metrics.hasDeepWorkRisk, true);
}

function testHeavyCommunicationTasksTriggerRisk() {
  const metrics = calculateDailyLoad([
    { task_type: "communication", cognitive_load: 2, emotional_load: 4 },
    { task_type: "communication", cognitive_load: 2, emotional_load: 5 },
    { task_type: "communication", cognitive_load: 3, emotional_load: 4 }
  ]);

  assert.equal(metrics.hasCommunicationRisk, true);
}

function testReadinessScoreRange() {
  const readiness = calculateReadinessScore(
    { energy_level: 2, stress_level: 9, focus_level: 2 },
    [{ task_type: "deep_work", cognitive_load: 5, emotional_load: 5 }],
    { state: "overloaded", value: 85 }
  );

  assert.ok(readiness.score >= 0 && readiness.score <= 100);
}

function testEnergyDebtNeverNegative() {
  const series = calculateEnergyDebtSeries(
    [{ checkin_date: "2026-07-14", energy_level: 8, stress_level: 2, focus_level: 8 }],
    [{ planned_date: "2026-07-14", task_type: "recovery", cognitive_load: 1, emotional_load: 1 }]
  );

  assert.ok(series[0].value >= 0);
}

function testLegacyNormalization() {
  const task = normalizeTask({
    energy_type: "Deep Work",
    mental_cost: 5,
    emotional_cost: 4
  });

  assert.equal(task.task_type, "deep_work");
  assert.equal(task.cognitive_load, 5);
  assert.equal(task.emotional_load, 4);
}

function testNoUserMixingProxy() {
  const first = normalizeTask({ id: "1", user_id: "a", task_type: "routine", cognitive_load: 3, emotional_load: 2 });
  const second = normalizeTask({ id: "2", user_id: "b", task_type: "deep_work", cognitive_load: 4, emotional_load: 2 });

  assert.equal(first.user_id, "a");
  assert.equal(second.user_id, "b");
}

const tests = [
  ["routine gives low load", testRoutineLowLoad],
  ["deep work gives high cognitive load", testDeepWorkHighCognitiveLoad],
  ["communication gives high emotional load", testCommunicationHighEmotionalLoad],
  ["recovery does not zero the day", testRecoveryDoesNotZeroDay],
  ["three deep work tasks trigger risk", testThreeDeepWorkTasksTriggerRisk],
  ["heavy communication tasks trigger risk", testHeavyCommunicationTasksTriggerRisk],
  ["readiness score stays in range", testReadinessScoreRange],
  ["energy debt never negative", testEnergyDebtNeverNegative],
  ["legacy tasks normalize", testLegacyNormalization],
  ["normalized tasks keep user separation", testNoUserMixingProxy]
];

for (const [name, fn] of tests) {
  fn();
  console.log(`OK: ${name}`);
}

console.log(`Passed ${tests.length} workload tests.`);
