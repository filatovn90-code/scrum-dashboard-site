import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";

interface PageHeaderProps {
  kicker: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ kicker, title, description, actions }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
    >
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.24em] text-primary/80">{kicker}</p>
        <div className="space-y-2">
          <h2 className="text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">{title}</h2>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground lg:text-lg">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <ThemeToggle />
      </div>
    </motion.header>
  );
}
