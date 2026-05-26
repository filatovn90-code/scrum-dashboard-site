import { useMemo, useState } from "react";
import { DirectionSummary } from "./components/DirectionSummary";
import { EpicIdleSection } from "./components/EpicIdleSection";
import { HeaderFilters } from "./components/HeaderFilters";
import { InsightsSection } from "./components/InsightsSection";
import { RolloutTab } from "./components/RolloutTab";
import { SidebarTabs, type DashboardTab } from "./components/SidebarTabs";
import { StageBreakdown } from "./components/StageBreakdown";
import { StreamCards } from "./components/StreamCards";
import { StreamStageBreakdown } from "./components/StreamStageBreakdown";
import { TaskFlagSection } from "./components/TaskFlagSection";
import { businessStandardItems } from "./data/businessStandards";
import { mockData } from "./data/mockData";
import type { Direction, Epic, Period, Stream, Team } from "./types";
import { getInsights } from "./utils/calculations";
import { parseJiraWorkbook } from "./utils/xlsxJiraParser";

type DashboardData = {
  direction: Direction;
  streams: Stream[];
  teams: Team[];
  epics: Epic[];
};

type ReportSnapshot = {
  reportDate: string;
  fileName: string;
  direction: Pick<Direction, "ttm" | "p85" | "average">;
};

const snapshotStorageKey = "ttm-dashboard-report-snapshots";

const formatReportDate = (date = new Date()) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

const makeSnapshot = (data: DashboardData, fileName: string, reportDate = formatReportDate()): ReportSnapshot => ({
  reportDate,
  fileName,
  direction: {
    ttm: data.direction.ttm,
    p85: data.direction.p85,
    average: data.direction.average,
  },
});

const readSnapshots = () => {
  try {
    const raw = window.localStorage.getItem(snapshotStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { current?: ReportSnapshot; previous?: ReportSnapshot };
    return parsed;
  } catch {
    return null;
  }
};

const writeSnapshots = (snapshots: { current: ReportSnapshot; previous?: ReportSnapshot }) => {
  try {
    window.localStorage.setItem(snapshotStorageKey, JSON.stringify(snapshots));
  } catch {
    // История загрузок не критична для работы дашборда: при запрете localStorage просто показываем текущий отчет.
  }
};

function App() {
  const [period, setPeriod] = useState<Period>("Q2");
  const [streamId, setStreamId] = useState("all");
  const valueType = "Median" as const;
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    direction: mockData.direction,
    streams: mockData.streams,
    teams: mockData.teams,
    epics: mockData.epics,
  });
  const [reportSnapshots, setReportSnapshots] = useState(() => {
    const saved = readSnapshots();
    return {
      current: saved?.current ?? makeSnapshot({ direction: mockData.direction, streams: mockData.streams, teams: mockData.teams, epics: mockData.epics }, "Встроенная Jira-выгрузка", "21.05.2026"),
      previous: saved?.previous,
    };
  });
  const [uploadLabel, setUploadLabel] = useState<string>(() => `Данные из последней Jira-выгрузки от ${reportSnapshots.current.reportDate}`);

  const { direction, streams, teams, epics } = dashboardData;
  const { tasks } = mockData;

  const handleWorkbookUpload = async (file: File) => {
    setUploadLabel("Читаю Excel-файл...");

    try {
      const parsed = await parseJiraWorkbook(file);
      const nextSnapshot = makeSnapshot(parsed, file.name);
      const nextSnapshots = {
        current: nextSnapshot,
        previous: reportSnapshots.current,
      };
      setDashboardData(parsed);
      setReportSnapshots(nextSnapshots);
      writeSnapshots(nextSnapshots);
      setStreamId("all");
      setActiveTab("overview");
      setUploadLabel(`Загружено: ${file.name}, дата отчета: ${nextSnapshot.reportDate}, эпиков: ${parsed.epics.length}`);
    } catch (error) {
      setUploadLabel(error instanceof Error ? `Не удалось загрузить файл: ${error.message}` : "Не удалось загрузить файл");
    }
  };

  const visibleStreams = useMemo(
    () => (streamId === "all" ? streams : streams.filter((stream) => stream.id === streamId)),
    [streamId, streams],
  );

  const visibleEpics = useMemo(
    () => (streamId === "all" ? epics : epics.filter((epic) => epic.streamId === streamId)),
    [streamId, epics],
  );

  const visibleTasks = useMemo(() => {
    if (streamId === "all") return tasks;
    const epicIds = new Set(visibleEpics.map((epic) => epic.id));
    return tasks.filter((task) => epicIds.has(task.epicId));
  }, [streamId, tasks, visibleEpics]);

  const insights = useMemo(() => getInsights(direction, visibleEpics, visibleTasks), [direction, visibleEpics, visibleTasks]);
  const selectedForDetails = streamId === "all" ? streams[0]?.id ?? "all" : streamId;

  return (
    <div className="min-h-screen bg-surface">
      <HeaderFilters
        period={period}
        uploadLabel={uploadLabel}
        onPeriodChange={setPeriod}
        onWorkbookUpload={handleWorkbookUpload}
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <SidebarTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="min-w-0 space-y-6">
          <div className="flex flex-col justify-between gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm text-muted sm:flex-row sm:items-center">
            <span>
              Период: <strong className="text-ink">{period}</strong>
            </span>
          </div>

          {activeTab === "overview" ? (
            <>
              <DirectionSummary direction={direction} valueType={valueType} previousSnapshot={reportSnapshots.previous} />
              <StageBreakdown title="Дирекция" source={direction} />
              <StreamCards streams={visibleStreams} selectedStreamId={selectedForDetails} valueType={valueType} onSelect={setStreamId} />
              <StreamStageBreakdown streams={visibleStreams} selectedStreamId={selectedForDetails} />
            </>
          ) : null}

          {activeTab === "idle" ? (
            <>
              <EpicIdleSection epics={visibleEpics} streams={streams} tasks={visibleTasks} />
              <TaskFlagSection tasks={visibleTasks} epics={visibleEpics} teams={teams} />
              <InsightsSection insights={insights} />
            </>
          ) : null}

          {activeTab === "rollout" ? <RolloutTab items={businessStandardItems} /> : null}
        </main>
      </div>
    </div>
  );
}

export default App;
