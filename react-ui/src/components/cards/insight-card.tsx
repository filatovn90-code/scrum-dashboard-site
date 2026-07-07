import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

interface InsightCardProps {
  title: string;
  body: string;
}

export function InsightCard({ title, body }: InsightCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="h-full p-5">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <h4 className="text-lg font-semibold tracking-tight">{title}</h4>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
      </Card>
    </motion.div>
  );
}
