import { CheckCircle2, Clock3 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TaskCardProps {
  title: string;
  subtitle: string;
  status: string;
}

export function TaskCard({ title, subtitle, status }: TaskCardProps) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.18 }}>
      <Card className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              {status}
            </span>
          </div>
          <h4 className="text-lg font-semibold tracking-tight">{title}</h4>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="icon">
            <Clock3 className="h-4 w-4" />
          </Button>
          <Button size="icon">
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
