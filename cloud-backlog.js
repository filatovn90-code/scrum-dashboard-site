const LEGACY_PREFIX = "scrum-master-backlog-data:";
const MIGRATION_PREFIX = "mindpulse-cloud-migration:";

function statusToCloud(status) {
  if (status === "Сделано") return "done";
  if (status === "В работе") return "in_progress";
  return "todo";
}

function statusToBoard(status) {
  if (status === "done") return "Сделано";
  if (status === "in_progress") return "В работе";
  return "Запланировано";
}

function sameDemoItem(item, demo) {
  return ["id", "time", "text", "status", "task_type", "cognitive_load", "emotional_load"]
    .every((key) => item[key] === demo[key]);
}

export function getLegacyEntries(storage, email, year, demoItems = []) {
  if (!email) return [];
  const raw = storage.getItem(`${LEGACY_PREFIX}${email}`);
  if (!raw) return [];

  let weeks;
  try {
    weeks = JSON.parse(raw);
  } catch {
    return [];
  }

  return Object.entries(weeks || {}).flatMap(([weekLabel, week]) =>
    (week?.days || []).flatMap((day) => {
      const match = /^(\d{2})\.(\d{2})$/.exec(day?.date || "");
      if (!match) return [];
      const plannedDate = `${year}-${match[2]}-${match[1]}`;
      return (day.items || []).flatMap((item, index) => {
        if (!item?.text?.trim() || demoItems.some((demo) => sameDemoItem(item, demo))) return [];
        const status = statusToCloud(item.status);
        return [{
          legacy_key: `${weekLabel}:${day.date}:${item.id || index}:${index}`,
          title: item.text.trim(),
          status,
          planned_date: plannedDate,
          planned_time: /^\d{2}:\d{2}$/.test(item.time || "") ? item.time : null,
          task_type: item.task_type || item.taskType || "routine",
          cognitive_load: Number(item.cognitive_load || item.mentalCost || 2),
          emotional_load: Number(item.emotional_load || item.emotionalCost || 2),
          completed_at: status === "done" ? `${plannedDate}T18:00:00.000Z` : null
        }];
      });
    })
  );
}

export async function migrateLegacyEntries(storage, userId, entries, repository) {
  const key = `${MIGRATION_PREFIX}${userId}`;
  if (storage.getItem(key) === "done") return;
  for (const entry of entries) {
    await repository.create({ ...entry, user_id: userId });
  }
  storage.setItem(key, "done");
}

export function mapCloudTask(task) {
  return {
    id: task.id,
    text: task.title,
    time: String(task.planned_time || "").slice(0, 5) || "09:00",
    status: statusToBoard(task.status),
    task_type: task.task_type || "routine",
    cognitive_load: Number(task.cognitive_load || 2),
    emotional_load: Number(task.emotional_load || 2)
  };
}

export function toIsoBoardDate(value) {
  const match = /^(\d{2})\.(\d{2})(?:\.(\d{4}))?$/.exec(String(value || ""));
  return match ? `${match[3] || 2026}-${match[2]}-${match[1]}` : "";
}

export function getInitialWeek(weeks, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return weeks.find((label) => {
    const match = /Неделя (\d{2})\.(\d{2}) - (\d{2})\.(\d{2})/.exec(label);
    if (!match) return false;
    const year = Number(/\((\d{4})\)$/.exec(label)?.[1] || 2026);
    const start = new Date(year, Number(match[2]) - 1, Number(match[1])).getTime();
    const end = new Date(year, Number(match[4]) - 1, Number(match[3])).getTime();
    return today >= start && today <= end;
  }) || weeks.find((label) => {
    const match = /Неделя (\d{2})\.(\d{2})/.exec(label);
    const year = Number(/\((\d{4})\)$/.exec(label)?.[1] || 2026);
    return match && new Date(year, Number(match[2]) - 1, Number(match[1])).getTime() > today;
  }) || weeks.at(-1);
}

export function createCloudRepository(supabase, userId) {
  if (!supabase || !userId) throw new Error("Cloud backlog requires an authenticated user.");

  async function unwrap(query) {
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  return {
    load(from, to) {
      return unwrap(supabase.from("tasks").select("*")
        .eq("user_id", userId).gte("planned_date", from).lte("planned_date", to)
        .is("archived_at", null));
    },
    createTask(payload) {
      return unwrap(supabase.from("tasks").insert({ ...payload, user_id: userId }).select().single());
    },
    updateTask(id, payload) {
      return unwrap(supabase.from("tasks").update({ ...payload, user_id: userId })
        .eq("user_id", userId).eq("id", id).select().single());
    },
    deleteTask(id) {
      return unwrap(supabase.from("tasks").delete().eq("user_id", userId).eq("id", id));
    },
    create(payload) {
      return unwrap(supabase.from("tasks").upsert({ ...payload, user_id: userId }, {
        onConflict: "user_id,legacy_key",
        ignoreDuplicates: true
      }));
    }
  };
}

export function getLegacyFocusDays(storage, email, days, year) {
  if (!email) return [];
  return days.flatMap(({ week, date }) => {
    const raw = storage.getItem(`scrum-master-daily-focus:${email}:${week}:${date}`);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      const items = [0, 1, 2].map((index) => ({
        text: String(parsed[index]?.text || "").trim(),
        done: Boolean(parsed[index]?.done)
      }));
      const [day, month] = date.split(".");
      return [{ focus_date: `${year}-${month}-${day}`, items }];
    } catch {
      return [];
    }
  });
}

export async function migrateLegacyFocusDays(storage, userId, days, repository) {
  const key = `mindpulse-cloud-focus-migration:${userId}`;
  if (storage.getItem(key) === "done") return;
  for (const day of days) await repository.migrate(day);
  storage.setItem(key, "done");
}

export function createFocusRepository(supabase, userId) {
  if (!supabase || !userId) throw new Error("Cloud focus requires an authenticated user.");
  async function unwrap(query) {
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
  return {
    load(from, to) {
      return unwrap(supabase.from("daily_focus").select("focus_date,items")
        .eq("user_id", userId).gte("focus_date", from).lte("focus_date", to));
    },
    save(day) {
      return unwrap(supabase.from("daily_focus").upsert({ ...day, user_id: userId }, {
        onConflict: "user_id,focus_date"
      }));
    },
    migrate(day) {
      return unwrap(supabase.from("daily_focus").upsert({ ...day, user_id: userId }, {
        onConflict: "user_id,focus_date", ignoreDuplicates: true
      }));
    }
  };
}

export function createFocusSaveQueue(repository) {
  let pending = Promise.resolve();
  return {
    save(day) {
      pending = pending.catch(() => null).then(() => repository.save(day));
      return pending;
    },
    settled() {
      return pending;
    }
  };
}

export function createLoadGuard() {
  let version = 0;
  return {
    start() { return ++version; },
    isCurrent(candidate) { return candidate === version; }
  };
}
