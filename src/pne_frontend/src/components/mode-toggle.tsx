import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

const modes = ["system", "light", "dark"] as const;

type Mode = typeof modes[number];

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const currentIndex = modes.indexOf(theme as Mode);
  const nextMode = modes[(currentIndex + 1) % modes.length];

  let Icon = Monitor;
  if (theme === "light") Icon = Sun;
  if (theme === "dark") Icon = Moon;

  return (
    <Button
      // variant="outline"
      size="icon"
      onClick={() => setTheme(nextMode)}
      aria-label="Toggle theme"
    >
      <Icon className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
} 