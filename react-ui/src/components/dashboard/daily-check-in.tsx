import { useEffect, useMemo, useState } from "react";
import { Brain, Gauge, Moon, Smile, Zap } from "lucide-react";
import type { DailyCheckInRecord } from "@/types/dashboard";

interface DailyCheckInProps {
  checkin: DailyCheckInRecord | null;
  saving?: boolean;
  onSave: (payload: Omit<DailyCheckInRecord, "checkin_date">) => Promise<boolean>;
}

const moodOptions = ["Спокойное", "Нейтральное", "Тревожное", "Раздраженное", "Воодушевленное", "Уставшее"];
const sleepOptions = ["Плохо", "Нормально", "Хорошо"];

export function DailyCheckIn({ checkin, saving = false, onSave }: DailyCheckInProps) {
  const initial = useMemo(
    () => ({
      energy_level: checkin?.energy_level ?? 6,
      stress_level: checkin?.stress_level ?? 4,
      focus_level: checkin?.focus_level ?? 6,
      sleep_quality: checkin?.sleep_quality ?? "Нормально",
      mood: checkin?.mood ?? "Спокойное"
    }),
    [checkin]
  );

  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setValues(initial);
  }, [initial]);

  const metrics = [
    { key: "energy_level", label: "Energy", icon: Zap, color: "text-emerald-500" },
    { key: "stress_level", label: "Stress", icon: Gauge, color: "text-orange-400" },
    { key: "focus_level", label: "Focus", icon: Brain, color: "text-sky-400" }
  ] as const;

  const handleSubmit = async () => {
    const ok = await onSave({
      id: checkin?.id,
      energy_level: values.energy_level,
      stress_level: values.stress_level,
      focus_level: values.focus_level,
      sleep_quality: values.sleep_quality,
      mood: values.mood,
      updated_at: new Date().toISOString()
    });
    setStatus(ok ? "Check-in saved" : "Could not save check-in");
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <h2 className="mb-6 text-2xl font-semibold text-foreground">Daily Check-In</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const currentValue = values[metric.key];

          return (
            <div key={metric.label} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">{metric.label}</label>
                <span className={`text-lg font-bold ${metric.color}`}>{currentValue}</span>
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentValue}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [metric.key]: Number(event.target.value)
                    }))
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              <div className={`flex h-12 items-center justify-center rounded-lg bg-secondary/30 ${metric.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Sleep</label>
            <Moon className="h-5 w-5 text-violet-400" />
          </div>
          <select
            value={values.sleep_quality ?? ""}
            onChange={(event) => setValues((current) => ({ ...current, sleep_quality: event.target.value }))}
            className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          >
            {sleepOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Mood</label>
            <Smile className="h-5 w-5 text-emerald-400" />
          </div>
          <select
            value={values.mood ?? ""}
            onChange={(event) => setValues((current) => ({ ...current, mood: event.target.value }))}
            className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          >
            {moodOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="mt-6 w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        type="button"
      >
        {saving ? "Saving..." : "Save Check-In"}
      </button>

      {status ? <p className="mt-3 text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
