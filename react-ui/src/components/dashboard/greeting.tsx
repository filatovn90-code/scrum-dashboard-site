import { useMemo } from "react";

interface GreetingProps {
  fullName: string;
}

export function Greeting({ fullName }: GreetingProps) {
  const hour = useMemo(() => new Date().getHours(), []);

  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const message =
    hour < 9
      ? "Let's start your day right"
      : hour < 12
        ? "Peak focus hours ahead"
        : hour < 15
          ? "Post-lunch energy dip incoming"
          : hour < 18
            ? "Second wind coming up"
            : "Reflect on today's progress";

  return (
    <div className="space-y-2">
      <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
        {greeting}, {fullName}
      </h1>
      <p className="text-lg text-muted-foreground">{message}</p>
    </div>
  );
}
