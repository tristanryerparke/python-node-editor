import { Text } from "@mantine/core";
import { ReactNode } from "react";

interface SingleLineTextDisplayProps {
  content: ReactNode;
  dimmed?: boolean;
}

export default function SingleLineTextDisplay({ content, dimmed = false }: SingleLineTextDisplayProps) {
  return (
    <div className="flex w-full h-5 px-1.5 justify-start 
    items-center border-input overflow-hidden">
      <Text truncate="end" size="xs" c={dimmed ? "dimmed" : undefined}>{content}</Text>
    </div>
  );
}
