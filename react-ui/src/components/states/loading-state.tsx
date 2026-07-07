import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export function LoadingState() {
  return (
    <Card className="space-y-4 p-6">
      <motion.div
        className="h-5 rounded-full bg-secondary"
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
      <motion.div
        className="h-20 rounded-3xl bg-secondary"
        animate={{ opacity: [0.45, 0.95, 0.45] }}
        transition={{ duration: 1.4, repeat: Infinity, delay: 0.1 }}
      />
      <motion.div
        className="h-20 rounded-3xl bg-secondary"
        animate={{ opacity: [0.45, 0.95, 0.45] }}
        transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
      />
    </Card>
  );
}
