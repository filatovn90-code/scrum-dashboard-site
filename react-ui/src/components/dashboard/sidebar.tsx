import type { ComponentType } from "react";
import { BarChart3, CheckSquare, Home, LogOut, Settings, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-border bg-card lg:flex lg:flex-col">
      <div className="border-b border-border px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">MindPulse</h1>
            <p className="text-xs text-muted-foreground">Energy Aware</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        <NavItem icon={Home} label="Today" active />
        <NavItem icon={CheckSquare} label="Tasks" />
        <NavItem icon={BarChart3} label="Analytics" />
      </nav>

      <div className="space-y-2 border-t border-border px-4 py-6">
        <NavItem icon={Settings} label="Settings" />
        <NavItem icon={LogOut} label="Logout" />
      </div>
    </aside>
  );
}

function NavItem({
  icon: Icon,
  label,
  active = false
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
      type="button"
    >
      <Icon className="h-5 w-5" />
      {label}
    </motion.button>
  );
}
