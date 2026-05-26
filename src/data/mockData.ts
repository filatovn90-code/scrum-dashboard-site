import type { Direction, Epic, Stream, Task, Team } from "../types";
import { jiraDirection, jiraEpics, jiraStreams, jiraTeams } from "./jiraOverview";

const teams: Team[] = [
  { id: "team-1", name: "Core Platform", streamId: "stream-1" },
  { id: "team-2", name: "Mobile Experience", streamId: "stream-1" },
  { id: "team-3", name: "Partner API", streamId: "stream-1" },
  { id: "team-4", name: "Risk Engines", streamId: "stream-2" },
  { id: "team-5", name: "Scoring", streamId: "stream-2" },
  { id: "team-6", name: "Data Products", streamId: "stream-2" },
  { id: "team-7", name: "CRM Ops", streamId: "stream-2" },
  { id: "team-8", name: "Payments", streamId: "stream-3" },
  { id: "team-9", name: "Billing", streamId: "stream-3" },
  { id: "team-10", name: "Support Tools", streamId: "stream-3" },
];

export const tasks: Task[] = [
  { id: "task-1", key: "TTM-101", title: "Согласовать бизнес-правила лимитов", epicId: "epic-1", teamId: "team-1", status: "Blocked", lastStatusUpdate: "2026-05-03", hasFlag: true, flagReason: "Ожидание согласования с бизнесом", flagStartedAt: "2026-05-05", flagDurationDays: 15 },
  { id: "task-2", key: "TTM-102", title: "Подготовить контракт API", epicId: "epic-1", teamId: "team-3", status: "In Progress", lastStatusUpdate: "2026-05-17", hasFlag: false },
  { id: "task-3", key: "TTM-115", title: "Провести UX-исследование", epicId: "epic-2", teamId: "team-2", status: "Done", lastStatusUpdate: "2026-05-15", hasFlag: false },
  { id: "task-4", key: "TTM-123", title: "Настроить feature toggle", epicId: "epic-3", teamId: "team-1", status: "Blocked", lastStatusUpdate: "2026-04-29", hasFlag: true, flagReason: "Зависимость от смежной команды", flagStartedAt: "2026-05-01", flagDurationDays: 19 },
  { id: "task-5", key: "TTM-134", title: "Разработка адаптера событий", epicId: "epic-4", teamId: "team-4", status: "In Progress", lastStatusUpdate: "2026-05-01", hasFlag: true, flagReason: "Нехватка тестовых данных", flagStartedAt: "2026-05-02", flagDurationDays: 18 },
  { id: "task-6", key: "TTM-146", title: "Согласовать модель данных", epicId: "epic-4", teamId: "team-6", status: "Blocked", lastStatusUpdate: "2026-04-25", hasFlag: true, flagReason: "Ожидание согласования с бизнесом", flagStartedAt: "2026-04-27", flagDurationDays: 23 },
  { id: "task-7", key: "TTM-152", title: "Провести нагрузочное тестирование", epicId: "epic-5", teamId: "team-5", status: "Review", lastStatusUpdate: "2026-05-18", hasFlag: false },
  { id: "task-8", key: "TTM-167", title: "Подготовить витрину мониторинга", epicId: "epic-6", teamId: "team-7", status: "Blocked", lastStatusUpdate: "2026-05-07", hasFlag: true, flagReason: "Ожидание инфраструктуры", flagStartedAt: "2026-05-08", flagDurationDays: 12 },
  { id: "task-9", key: "TTM-178", title: "Актуализировать платежный сценарий", epicId: "epic-7", teamId: "team-8", status: "Blocked", lastStatusUpdate: "2026-04-28", hasFlag: true, flagReason: "Ожидание согласования с бизнесом", flagStartedAt: "2026-04-30", flagDurationDays: 20 },
  { id: "task-10", key: "TTM-184", title: "Проверить миграцию биллинга", epicId: "epic-8", teamId: "team-9", status: "QA", lastStatusUpdate: "2026-05-16", hasFlag: false },
  { id: "task-11", key: "TTM-191", title: "Разобрать очередь обращений", epicId: "epic-9", teamId: "team-10", status: "Blocked", lastStatusUpdate: "2026-05-06", hasFlag: true, flagReason: "Зависимость от смежной команды", flagStartedAt: "2026-05-09", flagDurationDays: 11 },
  { id: "task-12", key: "TTM-205", title: "Подтвердить окно релиза", epicId: "epic-10", teamId: "team-8", status: "Blocked", lastStatusUpdate: "2026-05-04", hasFlag: true, flagReason: "Ожидание релизного окна", flagStartedAt: "2026-05-06", flagDurationDays: 14 },
];

const epics: Epic[] = [
  { id: "epic-1", key: "EPC-001", title: "Новый лимитный контур", streamId: "stream-1", teamId: "team-1", status: "В работе", totalTtmDays: 113, discoveryDays: 26, deliveryDays: 70, rolloutDays: 17, rolloutQuarter: "Q2", rolloutCompletedAt: "2026-05-12", daysInProgress: 72, daysWithoutActivity: 16, linkedTasks: ["task-1", "task-2"] },
  { id: "epic-2", key: "EPC-002", title: "Персонализация мобильного онбординга", streamId: "stream-1", teamId: "team-2", status: "Done", totalTtmDays: 86, discoveryDays: 31, deliveryDays: 44, rolloutDays: 11, rolloutQuarter: "Q1", rolloutCompletedAt: "2026-03-18", daysInProgress: 39, daysWithoutActivity: 3, linkedTasks: ["task-3"] },
  { id: "epic-3", key: "EPC-003", title: "Партнерский кабинет API", streamId: "stream-1", teamId: "team-3", status: "В работе", totalTtmDays: 128, discoveryDays: 33, deliveryDays: 77, rolloutDays: 18, rolloutQuarter: "Q3", rolloutCompletedAt: "2026-08-07", daysInProgress: 88, daysWithoutActivity: 21, linkedTasks: ["task-4"] },
  { id: "epic-4", key: "EPC-011", title: "Единая модель риск-событий", streamId: "stream-2", teamId: "team-4", status: "В работе", totalTtmDays: 149, discoveryDays: 34, deliveryDays: 96, rolloutDays: 19, rolloutQuarter: "Q2", rolloutCompletedAt: "2026-06-21", daysInProgress: 101, daysWithoutActivity: 27, linkedTasks: ["task-5", "task-6"] },
  { id: "epic-5", key: "EPC-012", title: "Скоринговый контур P85", streamId: "stream-2", teamId: "team-5", status: "Review", totalTtmDays: 132, discoveryDays: 28, deliveryDays: 84, rolloutDays: 20, rolloutQuarter: "Q3", rolloutCompletedAt: "2026-07-14", daysInProgress: 66, daysWithoutActivity: 5, linkedTasks: ["task-7"] },
  { id: "epic-6", key: "EPC-013", title: "Операционная витрина качества", streamId: "stream-2", teamId: "team-7", status: "В работе", totalTtmDays: 156, discoveryDays: 39, deliveryDays: 93, rolloutDays: 24, rolloutQuarter: "Q4", rolloutCompletedAt: "2026-10-03", daysInProgress: 93, daysWithoutActivity: 15, linkedTasks: ["task-8"] },
  { id: "epic-7", key: "EPC-021", title: "Платежный сценарий B2B", streamId: "stream-3", teamId: "team-8", status: "В работе", totalTtmDays: 121, discoveryDays: 27, deliveryDays: 73, rolloutDays: 21, rolloutQuarter: "Q2", rolloutCompletedAt: "2026-04-29", daysInProgress: 78, daysWithoutActivity: 19, linkedTasks: ["task-9"] },
  { id: "epic-8", key: "EPC-022", title: "Миграция биллинговых правил", streamId: "stream-3", teamId: "team-9", status: "QA", totalTtmDays: 104, discoveryDays: 24, deliveryDays: 65, rolloutDays: 15, rolloutQuarter: "Q1", rolloutCompletedAt: "2026-02-25", daysInProgress: 49, daysWithoutActivity: 4, linkedTasks: ["task-10"] },
  { id: "epic-9", key: "EPC-023", title: "Автоматизация поддержки", streamId: "stream-3", teamId: "team-10", status: "В работе", totalTtmDays: 118, discoveryDays: 29, deliveryDays: 69, rolloutDays: 20, rolloutQuarter: "Q4", rolloutCompletedAt: "2026-11-17", daysInProgress: 84, daysWithoutActivity: 14, linkedTasks: ["task-11"] },
  { id: "epic-10", key: "EPC-024", title: "Релизный календарь платежей", streamId: "stream-3", teamId: "team-8", status: "В работе", totalTtmDays: 109, discoveryDays: 22, deliveryDays: 61, rolloutDays: 26, rolloutQuarter: "Q3", rolloutCompletedAt: "2026-09-09", daysInProgress: 58, daysWithoutActivity: 17, linkedTasks: ["task-12"] },
];

const buildStream = (
  id: string,
  name: string,
  values: Pick<Stream, "ttm" | "p85" | "average" | "target" | "previousTtm" | "discovery" | "delivery" | "rollout" | "trend">,
): Stream => ({
  id,
  name,
  ...values,
  teams: teams.filter((team) => team.streamId === id),
  epics: epics.filter((epic) => epic.streamId === id),
});

export const direction: Direction = {
  id: "direction-1",
  name: "IT-дирекция",
  ttm: 124,
  p85: 167,
  average: 131,
  target: 110,
  previousTtm: 117,
  discovery: 31,
  delivery: 72,
  rollout: 21,
  streams: [
    buildStream("stream-1", "Стрим 1", { ttm: 109, p85: 142, average: 113, target: 105, previousTtm: 112, discovery: 30, delivery: 64, rollout: 15, trend: [118, 115, 112, 109] }),
    buildStream("stream-2", "Стрим 2", { ttm: 146, p85: 167, average: 151, target: 115, previousTtm: 133, discovery: 35, delivery: 91, rollout: 20, trend: [129, 134, 139, 146] }),
    buildStream("stream-3", "Стрим 3", { ttm: 118, p85: 153, average: 122, target: 110, previousTtm: 121, discovery: 26, delivery: 68, rollout: 24, trend: [125, 123, 120, 118] }),
  ],
};

// API seam: replace these exports with React Query/SWR calls when backend endpoints are ready.
export const mockData = {
  direction: jiraDirection,
  streams: jiraStreams,
  teams: jiraTeams,
  epics: jiraEpics,
  tasks,
};
