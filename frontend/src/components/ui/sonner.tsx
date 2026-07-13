import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/components/theme-provider";

export function Toaster(props: ToasterProps) {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      {...props}
    />
  );
}
