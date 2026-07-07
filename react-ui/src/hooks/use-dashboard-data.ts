import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { DailyCheckInRecord, DashboardCapacity, DashboardData, TaskRecord } from "@/types/dashboard";

const todayIso = new Date().toISOString().slice(0, 10);

function calculateCapacity(checkin: DailyCheckInRecord | null, tasks: TaskRecord[]): DashboardCapacity {
  const energy = Number(checkin?.energy_level || 6);
  const stress = Number(checkin?.stress_level || 4);
  const focus = Number(checkin?.focus_level || 6);

  let percent = 55;
  percent -= (energy - 5) * 6;
  percent += (stress - 5) * 7;
  percent -= (focus - 5) * 4;
  percent = Math.max(10, Math.min(120, Math.round(percent)));

  const deepWorkTasks = tasks.filter((task) => (task.task_type || "") === "Deep Work" && task.status !== "done");
  const deepWorkMinutes = deepWorkTasks.reduce((sum, task) => sum + Number(task.estimated_minutes || 0), 0);
  const adminMinutes = tasks
    .filter((task) => (task.task_type || "") === "Admin")
    .reduce((sum, task) => sum + Number(task.estimated_minutes || 0), 0);

  const totalMinutes = Math.max(
    tasks.reduce((sum, task) => sum + Number(task.estimated_minutes || 0), 0),
    1
  );

  const meetingsUsage = Math.min(100, Math.round((deepWorkMinutes / Math.max(totalMinutes, 1)) * 100));
  const adminUsage = Math.min(100, Math.round((adminMinutes / Math.max(totalMinutes, 1)) * 100));

  if (percent <= 45) {
    return {
      percent: 65,
      state: "normal",
      label: "Нормальная нагрузка",
      note: "Состояние выглядит устойчивым. Можно планировать важные задачи на первую половину дня.",
      deepWorkHours: deepWorkMinutes ? `${Math.max(1, Math.round(deepWorkMinutes / 60))} ч` : "2-3 ч",
      optimalUntil: "15:00",
      meetingsUsage,
      adminUsage
    };
  }

  if (percent <= 75) {
    return {
      percent: 48,
      state: "high",
      label: "Высокая нагрузка",
      note: "Лучше держать день компактным и не добавлять лишние сложные задачи.",
      deepWorkHours: deepWorkMinutes ? `${Math.max(1, Math.round(deepWorkMinutes / 75))} ч` : "1-2 ч",
      optimalUntil: "13:30",
      meetingsUsage,
      adminUsage
    };
  }

  return {
    percent: 28,
    state: "risk",
    label: "Риск перегруза",
    note: "Полезно снизить темп и оставить только самые важные задачи.",
    deepWorkHours: deepWorkMinutes ? `${Math.max(1, Math.round(deepWorkMinutes / 90))} ч` : "до 1 ч",
    optimalUntil: "12:00",
    meetingsUsage,
    adminUsage
  };
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingCheckIn, setSavingCheckIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setError("Не заданы VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Пользователь не авторизован в новом UI-слое.");
      setLoading(false);
      return;
    }

    const [profileResult, checkinResult, tasksResult] = await Promise.all([
      supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
      supabase
        .from("daily_checkins")
        .select("id, checkin_date, energy_level, stress_level, focus_level, sleep_quality, mood, updated_at")
        .eq("user_id", user.id)
        .eq("checkin_date", todayIso)
        .maybeSingle(),
      supabase
        .from("tasks")
        .select("id, title, details, status, task_type, cognitive_load, emotional_load, energy_required, estimated_minutes, is_focus, completed_at, archived_at, planned_date, priority")
        .eq("user_id", user.id)
        .eq("planned_date", todayIso)
        .is("archived_at", null)
        .order("completed_at", { ascending: true, nullsFirst: true })
    ]);

    if (profileResult.error || checkinResult.error || tasksResult.error) {
      setError(
        profileResult.error?.message ||
          checkinResult.error?.message ||
          tasksResult.error?.message ||
          "Не удалось загрузить данные."
      );
      setLoading(false);
      return;
    }

    const checkin = (checkinResult.data as DailyCheckInRecord | null) || null;
    const tasks = (tasksResult.data as TaskRecord[] | null) || [];
    const fullName =
      profileResult.data?.full_name ||
      profileResult.data?.email?.split("@")[0] ||
      user.email?.split("@")[0] ||
      "User";

    setData({
      fullName,
      todayIso,
      checkin,
      tasks,
      capacity: calculateCapacity(checkin, tasks)
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveCheckIn = useCallback(
    async (payload: Omit<DailyCheckInRecord, "checkin_date">) => {
      if (!supabase) {
        setError("Supabase не настроен.");
        return false;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Нет авторизации.");
        return false;
      }

      setSavingCheckIn(true);
      setError(null);

      const nextPayload = {
        user_id: user.id,
        checkin_date: todayIso,
        energy_level: payload.energy_level,
        stress_level: payload.stress_level,
        focus_level: payload.focus_level,
        sleep_quality: payload.sleep_quality ?? null,
        mood: payload.mood ?? null,
        updated_at: new Date().toISOString()
      };

      const { error: upsertError } = await supabase
        .from("daily_checkins")
        .upsert(nextPayload, { onConflict: "user_id,checkin_date" });

      if (upsertError) {
        setError(upsertError.message);
        setSavingCheckIn(false);
        return false;
      }

      await load();
      setSavingCheckIn(false);
      return true;
    },
    [load]
  );

  return useMemo(
    () => ({
      data,
      loading,
      savingCheckIn,
      error,
      reload: load,
      saveCheckIn
    }),
    [data, loading, savingCheckIn, error, load, saveCheckIn]
  );
}
