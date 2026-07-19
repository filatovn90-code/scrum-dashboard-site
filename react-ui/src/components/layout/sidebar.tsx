import { BarChart3, CalendarDays, Gauge, LayoutGrid, ListTodo, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const items = [
  { label: "Сегодня", icon: LayoutGrid, active: true },
  { label: "Календарь", icon: CalendarDays },
  { label: "Моя неделя", icon: ListTodo },
  { label: "Аналитика", icon: BarChart3 },
  { label: "Состояние", icon: Gauge }
];

export function Sidebar() {
  return (
    <aside className="rounded-[2rem] border border-white/60 bg-card/90 p-5 shadow-calm backdrop-blur-xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">FocusFlow</p>
          <h1 className="text-xl font-semibold tracking-tight">Personal Tracker</h1>
        </div>
      </div>

      <nav className="space-y-2">
        {items.map((item, index) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all",
              item.active
                ? "bg-primary text-primary-foreground shadow-float"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
            type="button"
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </motion.button>
        ))}
      </nav>

      <div className="mt-8 rounded-3xl bg-secondary/70 p-4">
        <p className="text-sm font-medium text-foreground">Supabase ready</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Новый UI-слой использует те же публичные ключи и может постепенно заменить текущие страницы без поломки данных.
        </p>
      </div>

      <Button className="mt-8 w-full justify-center" size="lg">
        Открыть рабочую зону
      </Button>
    </aside>
  );
}
