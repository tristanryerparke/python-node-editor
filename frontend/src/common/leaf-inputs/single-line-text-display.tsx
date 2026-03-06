import { cn } from "@/lib/utils";

type Path = (string | number)[];
type RightButtonProps = { path?: Path };

interface SingleLineTextDisplayProps {
  content: React.ReactNode;
  dimmed?: boolean;
  disabled?: boolean;
  path?: Path;
  rightButton?: React.ComponentType<RightButtonProps>;
}

export default function SingleLineTextDisplay({
  content,
  dimmed = false,
  disabled = false,
  path,
  rightButton: RightButton,
}: SingleLineTextDisplayProps) {
  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <div
        className={cn(
          "flex flex-1 w-0 text-sm gap-1",
          "h-8 rounded-md border dark:bg-input/30 pl-2 pr-0.75 py-1 shadow-xs border-input items-center",
          disabled && "opacity-50",
        )}
      >
        <span
          className={cn("truncate min-w-0 flex-1", dimmed && "text-gray-400")}
        >
          {content}
        </span>
        {RightButton ? (
          <div className="shrink-0">
            <RightButton path={path} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
