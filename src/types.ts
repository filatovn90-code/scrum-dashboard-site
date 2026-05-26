export type StageKey = "discovery" | "delivery" | "rollout";
export type TtmValueType = "Median" | "P85" | "Average";
export type Period = "Q1" | "Q2" | "Q3" | "Q4" | "Год";
export type RolloutQuarter = "Q1" | "Q2" | "Q3" | "Q4";
export type HealthStatus = "ok" | "warning" | "critical";
export type RiskLevel = "низкий" | "средний" | "высокий";

export interface Team {
  id: string;
  name: string;
  streamId: string;
}

export interface TaskFlag {
  reason: string;
  startedAt: string;
  durationDays: number;
}

export interface Task {
  id: string;
  key: string;
  title: string;
  epicId: string;
  teamId: string;
  status: string;
  lastStatusUpdate: string;
  hasFlag: boolean;
  flagReason?: string;
  flagStartedAt?: string;
  flagDurationDays?: number;
}

export interface Epic {
  id: string;
  key: string;
  title: string;
  streamId: string;
  teamId: string;
  status: string;
  totalTtmDays: number;
  discoveryDays: number;
  deliveryDays: number;
  rolloutDays: number;
  rolloutQuarter: RolloutQuarter;
  rolloutCompletedAt: string;
  daysInProgress: number;
  daysWithoutActivity: number;
  linkedTasks: string[];
}

export interface BusinessStandardItem {
  id: string;
  key: string;
  title: string;
  status: string;
  streamName: string;
  keyResult: string;
  epicQuarter: string;
  createdAt: string;
  ttmDays: number;
  idleDays: number;
}

export interface Stream {
  id: string;
  name: string;
  epicCount?: number;
  ttm: number;
  p85: number;
  average: number;
  target: number;
  previousTtm: number;
  discovery: number;
  delivery: number;
  rollout: number;
  trend: number[];
  teams: Team[];
  epics: Epic[];
}

export interface Direction {
  id: string;
  name: string;
  ttm: number;
  p85: number;
  average: number;
  target: number;
  previousTtm: number;
  discovery: number;
  delivery: number;
  rollout: number;
  streams: Stream[];
}
