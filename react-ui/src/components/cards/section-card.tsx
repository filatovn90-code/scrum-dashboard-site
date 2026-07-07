import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  kicker?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, kicker, description, children, className }: SectionCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className={cn("p-6 lg:p-7", className)}>
        <div className="mb-6 space-y-2">
          {kicker ? <p className="text-xs uppercase tracking-[0.24em] text-primary/80">{kicker}</p> : null}
          <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
          {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </Card>
    </motion.div>
  );
}
