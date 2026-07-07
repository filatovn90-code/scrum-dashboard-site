import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-transparent px-4 py-4 lg:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />
        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/60 bg-background/85 p-5 shadow-calm backdrop-blur-xl lg:p-7"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
