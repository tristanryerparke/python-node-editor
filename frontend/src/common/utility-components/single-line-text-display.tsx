import { cn } from "@/lib/utils";
import { inputVariants } from "t-components/input";

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
          inputVariants({ size: "xs" }),
          "flex flex-1 w-0 items-center gap-1",
          disabled && "cursor-not-allowed opacity-30",
        )}
      >
        <span
          className={cn(
            "truncate min-w-0 flex-1",
            dimmed && "text-muted-foreground",
          )}
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
