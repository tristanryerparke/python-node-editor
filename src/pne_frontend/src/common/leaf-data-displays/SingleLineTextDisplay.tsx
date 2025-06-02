import * as React from "react";

interface SingleLineTextDisplayProps {
  content: React.ReactNode;
  dimmed?: boolean;
}

export default function SingleLineTextDisplay({ content, dimmed = false }: SingleLineTextDisplayProps) {
  return (
    <div
      className={
        [
          "flex h-9 w-full min-w-0 rounded-md border dark:bg-input/30 px-3 py-1 text-base shadow-xs border-input overflow-hidden items-center",
          dimmed ? "text-gray-400" : ""
        ].join(" ")
      }
    >
      <span className="truncate w-full text-sm">{content}</span>
    </div>
  );
}
