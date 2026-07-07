import type { ReactNode } from "react";
import { FileSearch } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="flex min-h-[220px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <FileSearch className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h4 className="text-xl font-semibold tracking-tight">{title}</h4>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action ?? <Button variant="outline">Добавить первые данные</Button>}
    </Card>
  );
}
