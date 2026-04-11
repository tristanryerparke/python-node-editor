import { CircleDashed, CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { memo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

type NodeStatusProps = {
  status: "not-executed" | "executed" | "error" | "executing";
  onToggleDrawer?: () => void;
  hasTerminalOutput?: boolean;
  isDrawerOpen?: boolean;
};

export default memo(function NodeStatus({
  status,
  onToggleDrawer,
  hasTerminalOutput = false,
  isDrawerOpen = false,
}: NodeStatusProps) {
  let icon: React.ReactNode;
  let tooltipText: string;
  const showOutputAvailabilityHint = hasTerminalOutput && !isDrawerOpen;

  if (status === "not-executed") {
    icon = <CircleDashed className="w-4 h-4" />;
    tooltipText = "Not Executed";
  } else if (status === "executing") {
    icon = <Loader2 className="w-4 h-4 animate-spin" />;
    tooltipText = showOutputAvailabilityHint
      ? "Executing (terminal output available)"
      : "Executing";
  } else if (status === "error") {
    icon = <CircleAlert className="w-4 h-4 text-red-500" />;
    tooltipText = hasTerminalOutput ? "Error (traceback available)" : "Error";
  } else if (status === "executed") {
    icon = <CircleCheck className="w-4 h-4 text-green-500" />;
    tooltipText = showOutputAvailabilityHint
      ? "Executed (terminal output available)"
      : "Executed";
  } else {
    return null;
  }

  const isClickable = true;

  const handleClick = () => {
    if (isClickable && onToggleDrawer) {
      onToggleDrawer();
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            variant="ghost"
            size="icon"
            className={`nodrag relative h-6 w-6 ${!isClickable ? "cursor-default pointer-events-auto" : ""}`}
            disabled={!isClickable}
            asChild={!isClickable}
          >
            {!isClickable ? (
              <span>
                {icon}
                {hasTerminalOutput && !isDrawerOpen && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                )}
              </span>
            ) : (
              <>
                {icon}
                {hasTerminalOutput && !isDrawerOpen && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                )}
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Status: {tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
