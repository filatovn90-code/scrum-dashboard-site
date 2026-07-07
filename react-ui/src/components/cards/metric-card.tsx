import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
  trend?: string;
}

export function MetricCard({ icon: Icon, label, value, note, trend }: MetricCardProps) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="h-full p-5">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          {trend ? (
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              {trend}
            </span>
          ) : null}
        </div>
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          <p className="text-sm leading-6 text-muted-foreground">{note}</p>
        </div>
      </Card>
    </motion.div>
  );
}
