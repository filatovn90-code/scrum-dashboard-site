import { BarChart3, Rocket, TimerReset } from "lucide-react";

export type DashboardTab = "overview" | "idle" | "rollout";

interface SidebarTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

const tabs = [
  { id: "overview", label: "Основная", helper: "TTM, этапы, стримы", icon: BarChart3 },
  { id: "idle", label: "Простои", helper: "Эпики, задачи, выводы", icon: TimerReset },
  { id: "rollout", label: "Бизнес-стандарт", helper: "Эпики и метрики", icon: Rocket },
] satisfies Array<{ id: DashboardTab; label: string; helper: string; icon: typeof BarChart3 }>;

export function SidebarTabs({ activeTab, onTabChange }: SidebarTabsProps) {
  return (
    <aside className="lg:sticky lg:top-4 lg:self-start">
      <nav className="card p-3">
        <div className="px-3 pb-3 pt-2">
          <p className="label">Разделы</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
                  selected ? "bg-ink text-white shadow-sm" : "text-ink hover:bg-surface"
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-white/15" : "bg-surface"}`}>
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{tab.label}</span>
                  <span className={`block text-xs ${selected ? "text-white/70" : "text-muted"}`}>{tab.helper}</span>
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
