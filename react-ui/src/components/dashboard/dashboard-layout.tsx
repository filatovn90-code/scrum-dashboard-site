import type { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="min-h-screen bg-background p-8 lg:p-12">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
