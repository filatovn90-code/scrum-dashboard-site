import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-11 w-11 rounded-2xl border border-border/70 bg-card/70"
    >
      {isDark ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
    </Button>
  );
}
