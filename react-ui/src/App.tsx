import { DailyCheckIn } from "@/components/dashboard/daily-check-in";
import { CognitiveCapacity } from "@/components/dashboard/cognitive-capacity";
import { FocusOfTheDay } from "@/components/dashboard/focus-of-the-day";
import { TasksList } from "@/components/dashboard/tasks-list";
import { AICoach } from "@/components/dashboard/ai-coach";
import { Greeting } from "@/components/dashboard/greeting";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export function App() {
  const { data, loading, error, saveCheckIn, savingCheckIn } = useDashboardData();

  return (
    <DashboardLayout>
      {loading ? (
        <div className="space-y-6">
          <LoadingState />
          <div className="grid gap-6 lg:grid-cols-3">
            <LoadingState />
            <LoadingState />
            <LoadingState />
          </div>
        </div>
      ) : error ? (
        <EmptyState
          title="Не удалось загрузить новый интерфейс"
          description={error}
        />
      ) : data ? (
        <>
          <Greeting fullName={data.fullName} />

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <DailyCheckIn checkin={data.checkin} onSave={saveCheckIn} saving={savingCheckIn} />
              <FocusOfTheDay tasks={data.tasks} />
              <TasksList tasks={data.tasks} />
            </div>

            <div className="space-y-6">
              <CognitiveCapacity capacity={data.capacity} />
              <AICoach capacity={data.capacity} tasks={data.tasks} />
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="Пока нет данных"
          description="После авторизации и появления данных в Supabase здесь появится новый интерфейс MindPulse."
        />
      )}
    </DashboardLayout>
  );
}
