export interface DailyCheckInRecord {
  id?: string;
  checkin_date: string;
  energy_level: number | null;
  stress_level: number | null;
  focus_level: number | null;
  sleep_quality: string | null;
  mood: string | null;
  updated_at?: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  details: string | null;
  status: string | null;
  task_type: string | null;
  cognitive_load: number | null;
  emotional_load: number | null;
  energy_required: number | null;
  estimated_minutes: number | null;
  is_focus: boolean | null;
  completed_at: string | null;
  archived_at?: string | null;
  planned_date: string | null;
  priority?: string | null;
}

export interface DashboardCapacity {
  percent: number;
  state: "normal" | "high" | "risk";
  label: string;
  note: string;
  deepWorkHours: string;
  optimalUntil: string;
  meetingsUsage: number;
  adminUsage: number;
}

export interface DashboardData {
  fullName: string;
  todayIso: string;
  checkin: DailyCheckInRecord | null;
  tasks: TaskRecord[];
  capacity: DashboardCapacity;
}
