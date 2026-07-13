import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "t-components/select";

const modes = ["system", "light", "dark"] as const;

const modeConfig = {
  system: { icon: Monitor, label: "System" },
  light: { icon: Sun, label: "Light" },
  dark: { icon: Moon, label: "Dark" },
} as const;

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();

  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className="min-w-30 max-w-30">
        <SelectValue placeholder="Select theme" />
      </SelectTrigger>
      <SelectContent>
        {modes.map((mode) => {
          const Icon = modeConfig[mode].icon;
          return (
            <SelectItem key={mode} value={mode}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{modeConfig[mode].label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
