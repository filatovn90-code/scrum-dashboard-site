import test from "node:test";
import assert from "node:assert/strict";
import { summarizeWeek } from "../lib/weekly-rhythm.js";

test("weekly summary separates completed and open planned tasks", () => {
  const result = summarizeWeek({tasks: [{status: "done"}, {status: "todo"}, {status: "in_progress"}], checkins: [], days: []});
  assert.equal(result.completed, 1);
  assert.equal(result.open, 2);
  assert.equal(result.checkins, 0);
  assert.equal(result.busiest, null);
});

test("weekly summary ignores empty days when identifying planned load", () => {
  const day = {date: "2026-11-12", tasks: [{status: "todo"}], loadValue: 25};
  const result = summarizeWeek({tasks: [], checkins: [{checkin_date: "2026-11-12"}], days: [{tasks: [], loadValue: 0}, day]});
  assert.equal(result.busiest, day);
  assert.equal(result.checkins, 1);
});
