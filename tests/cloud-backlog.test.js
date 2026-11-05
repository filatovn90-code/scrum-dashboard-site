import assert from "node:assert/strict";
import test from "node:test";
import {
  createCloudRepository,
  createFocusSaveQueue,
  createLoadGuard,
  getLegacyFocusDays,
  getLegacyEntries,
  getInitialWeek,
  mapCloudTask,
  migrateLegacyEntries,
  migrateLegacyFocusDays,
  toIsoBoardDate
} from "../cloud-backlog.js";

const week = "Неделя 20.04 - 24.04";
const demo = { id: "20-0900", time: "09:00", text: "Демо", status: "В работе", task_type: "routine", cognitive_load: 2, emotional_load: 2 };
const custom = { id: "task-123", time: "10:15", text: "Моя задача", status: "Запланировано", task_type: "deep_work", cognitive_load: 4, emotional_load: 3 };

function storage(values) {
  return {
    getItem(key) { return values[key] ?? null; },
    setItem(key, value) { values[key] = value; }
  };
}

test("legacy migration reads only the verified user's scoped key", () => {
  const own = JSON.stringify({ [week]: { days: [{ date: "20.04", items: [custom] }] } });
  const store = storage({
    "scrum-master-backlog-data:owner@example.com": own,
    "scrum-master-backlog-data:other@example.com": JSON.stringify({ [week]: { days: [{ date: "20.04", items: [{ ...custom, text: "Чужая задача" }] }] } }),
    "scrum-master-backlog-data": own
  });
  assert.deepEqual(getLegacyEntries(store, "new@example.com", 2026), []);
  assert.deepEqual(getLegacyEntries(store, "owner@example.com", 2026).map((entry) => entry.title), ["Моя задача"]);
});

test("cloud repository scopes reads and mutations to the signed-in user", async () => {
  const calls = [];
  const response = { data: [{ id: "task-id" }], error: null };
  const query = () => {
    const q = {
      select(value) { calls.push(["select", value]); return q; },
      insert(value) { calls.push(["insert", value]); return q; },
      upsert(value, options) { calls.push(["upsert", value, options]); return q; },
      update(value) { calls.push(["update", value]); return q; },
      delete() { calls.push(["delete"]); return q; },
      eq(...args) { calls.push(["eq", ...args]); return q; },
      gte(...args) { calls.push(["gte", ...args]); return q; },
      lte(...args) { calls.push(["lte", ...args]); return q; },
      is(...args) { calls.push(["is", ...args]); return q; },
      single() { return Promise.resolve(response); },
      then(resolve) { return Promise.resolve(response).then(resolve); }
    };
    return q;
  };
  const repository = createCloudRepository({ from(table) { assert.equal(table, "tasks"); return query(); } }, "user-1");
  await repository.load("2026-11-02", "2026-11-06");
  await repository.createTask({ title: "Mine", user_id: "other" });
  await repository.updateTask("task-id", { title: "New", user_id: "other" });
  await repository.deleteTask("task-id");
  assert.equal(calls.filter((call) => call[0] === "eq" && call[1] === "user_id" && call[2] === "user-1").length, 3);
  assert.equal(calls.find((call) => call[0] === "insert")[1].user_id, "user-1");
  assert.equal(calls.find((call) => call[0] === "update")[1].user_id, "user-1");
});

test("migration excludes unchanged demo items but keeps edited ones", () => {
  const store = storage({
    "scrum-master-backlog-data:owner@example.com": JSON.stringify({
      [week]: { days: [{ date: "20.04", items: [demo, { ...demo, text: "Мой вариант" }, custom] }] }
    })
  });
  const entries = getLegacyEntries(store, "owner@example.com", 2026, [demo]);
  assert.deepEqual(entries.map((entry) => entry.title), ["Мой вариант", "Моя задача"]);
  assert.equal(entries[1].planned_time, "10:15");
});

test("migration is repeatable and never claims success after a failed write", async () => {
  const values = { "scrum-master-backlog-data:owner@example.com": JSON.stringify({ [week]: { days: [{ date: "20.04", items: [custom] }] } }) };
  const store = storage(values);
  let fail = true;
  const created = new Map();
  const repository = {
    async create(entry) {
      if (fail) throw new Error("offline");
      created.set(entry.legacy_key, entry);
    }
  };
  const entries = getLegacyEntries(store, "owner@example.com", 2026);
  await assert.rejects(migrateLegacyEntries(store, "user-1", entries, repository), /offline/);
  assert.equal(values["mindpulse-cloud-migration:user-1"], undefined);
  fail = false;
  await migrateLegacyEntries(store, "user-1", entries, repository);
  await migrateLegacyEntries(store, "user-1", entries, repository);
  assert.equal(created.size, 1);
  assert.equal(values["mindpulse-cloud-migration:user-1"], "done");
});

test("cloud rows retain day and time, and new users start at current week", () => {
  assert.deepEqual(mapCloudTask({ id: "task-id", title: "Моя задача", planned_date: "2026-04-20", planned_time: "10:15:00", status: "todo", task_type: "routine", cognitive_load: 2, emotional_load: 1 }), {
    id: "task-id", text: "Моя задача", time: "10:15", status: "Запланировано", task_type: "routine", cognitive_load: 2, emotional_load: 1
  });
  assert.equal(getInitialWeek([week, "Неделя 02.11 - 06.11"], new Date(2026, 10, 4)), "Неделя 02.11 - 06.11");
  assert.equal(getInitialWeek([week, "Неделя 04.01 - 08.01 (2027)"], new Date(2027, 0, 5)), "Неделя 04.01 - 08.01 (2027)");
  assert.equal(toIsoBoardDate("04.01.2027"), "2027-01-04");
  assert.equal(toIsoBoardDate("20.04"), "2026-04-20");
});

test("focus migration uses only the owner's scoped key and is retryable", async () => {
  const values = {
    [`scrum-master-daily-focus:owner@example.com:${week}:20.04`]: JSON.stringify([{ text: "Фокус", done: true }]),
    [`scrum-master-daily-focus:other@example.com:${week}:20.04`]: JSON.stringify([{ text: "Чужой", done: false }])
  };
  const store = storage(values);
  const days = getLegacyFocusDays(store, "owner@example.com", [{ week, date: "20.04" }], 2026);
  assert.deepEqual(days, [{ focus_date: "2026-04-20", items: [{ text: "Фокус", done: true }, { text: "", done: false }, { text: "", done: false }] }]);
  assert.deepEqual(getLegacyFocusDays(store, "new@example.com", [{ week, date: "20.04" }], 2026), []);
  let fail = true;
  const saved = new Map();
  const repository = { async migrate(day) { if (fail) throw new Error("offline"); saved.set(day.focus_date, day); } };
  await assert.rejects(migrateLegacyFocusDays(store, "user-1", days, repository), /offline/);
  assert.equal(values["mindpulse-cloud-focus-migration:user-1"], undefined);
  fail = false;
  await migrateLegacyFocusDays(store, "user-1", days, repository);
  await migrateLegacyFocusDays(store, "user-1", days, repository);
  assert.equal(saved.size, 1);
});

test("older week response cannot apply after a newer render starts", () => {
  const guard = createLoadGuard();
  const oldVersion = guard.start();
  const newVersion = guard.start();
  assert.equal(guard.isCurrent(oldVersion), false);
  assert.equal(guard.isCurrent(newVersion), true);
});

test("focus saves serialize and can retry after a network error", async () => {
  const calls = [];
  let fail = true;
  const queue = createFocusSaveQueue({ async save(day) {
    calls.push(day.items[0].text);
    if (fail) throw new Error("offline");
  } });
  await assert.rejects(queue.save({ items: [{ text: "first" }] }), /offline/);
  fail = false;
  await queue.save({ items: [{ text: "second" }] });
  await queue.settled();
  assert.deepEqual(calls, ["first", "second"]);
});
