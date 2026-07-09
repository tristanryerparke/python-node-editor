import { Button } from "t-components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "t-components/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LoaderIcon } from "lucide-react";
import useSettingsStore from "../../stores/settingsStore";
import { useState, useCallback, useRef } from "react";
import { type Graph } from "../../utils/strip-graph";
import { useBackendConnection } from "../../hooks/useBackendConnection";
import { useExecuteFlowSync } from "../../hooks/useExecuteFlowSync";
import { useExecuteFlowAsync } from "../../hooks/useExecuteFlowAsync";
import { clearOutputsAndConnectedInputs } from "../../utils/clear-outputs";
import useFlowStore from "@/stores/flowStore";

function formatTimeout(seconds: number) {
  if (seconds >= 60 && seconds % 60 === 0) {
    const minutes = seconds / 60;
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  return `${seconds} second${seconds === 1 ? "" : "s"}`;
}

export default function ExecuteMenu() {
  const [loading, setLoading] = useState(false);
  const [hungTimeoutSeconds, setHungTimeoutSeconds] = useState<number | null>(
    null,
  );
  const hungModalResolveRef = useRef<(() => void) | null>(null);
  const { isConnected, isChecking } = useBackendConnection();
  const executionMode = useSettingsStore((state) => state.executionMode);
  const strictInputValidation = useSettingsStore(
    (state) => state.strictInputValidation,
  );
  const invalidInputCount = useFlowStore(
    (state) => state.inputValidation.invalidInputCount,
  );

  const handleExecutionHung = useCallback(async (timeoutMs: number) => {
    setHungTimeoutSeconds(Math.ceil(timeoutMs / 1000));
    await new Promise<void>((resolve) => {
      hungModalResolveRef.current = resolve;
    });
  }, []);

  const handleHungDialogOpenChange = useCallback((open: boolean) => {
    if (open) {
      return;
    }

    setHungTimeoutSeconds(null);
    const resolve = hungModalResolveRef.current;
    hungModalResolveRef.current = null;
    resolve?.();
  }, []);

  const { execute: executeSyncFn } = useExecuteFlowSync();
  const { execute: executeAsyncFn } = useExecuteFlowAsync({
    onExecutionHung: handleExecutionHung,
  });

  const hasInvalidInputs = invalidInputCount > 0;

  const execute = useCallback(async () => {
    if (strictInputValidation && hasInvalidInputs) {
      const invalidInputIssues =
        useFlowStore.getState().inputValidation.invalidInputIssues;
      console.group("Strict input validation blocked execution");
      invalidInputIssues.forEach(({ nodeId, inputName, reason }) => {
        console.warn(`${nodeId}.${inputName}: ${reason}`);
      });
      console.groupEnd();
      return;
    }

    setLoading(true);
    const { nodes: clearedNodes, edges: clearedEdges } =
      clearOutputsAndConnectedInputs();
    const graph: Graph = {
      nodes: clearedNodes,
      edges: clearedEdges,
    };

    try {
      if (executionMode === "sync") {
        await executeSyncFn(graph);
      } else {
        await executeAsyncFn(graph);
      }
    } catch (error) {
      console.error("Error executing graph:", error);
    } finally {
      setLoading(false);
    }
  }, [
    executionMode,
    executeSyncFn,
    executeAsyncFn,
    strictInputValidation,
    hasInvalidInputs,
  ]);

  const disabledReasons: string[] = [];
  if (loading) {
    disabledReasons.push("Execution in progress");
  }
  if (isChecking) {
    disabledReasons.push("Checking backend connection");
  }
  if (!isConnected && !isChecking) {
    disabledReasons.push("Backend not connected");
  }
  if (strictInputValidation && hasInvalidInputs) {
    disabledReasons.push(
      `${invalidInputCount} invalid input${invalidInputCount === 1 ? "" : "s"}`,
    );
  }
  const isDisabled = disabledReasons.length > 0;
  const buttonClass =
    isConnected &&
    !isChecking &&
    (!strictInputValidation || !hasInvalidInputs)
      ? "w-25 text-green-700! border-green-700!"
      : "w-25";

  const button = (
    <Button
      className={buttonClass}
      variant="outline"
      size="xs"
      onClick={execute}
      disabled={isDisabled}
    >
      {loading ? <LoaderIcon className="animate-spin" /> : "Execute"}
    </Button>
  );

  const executeButton = isDisabled ? (
    <div className="w-full">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block w-full">{button}</span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {disabledReasons.map((reason) => (
              <p key={reason}>{reason}</p>
            ))}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  ) : (
    <div className="w-full">{button}</div>
  );

  const hungTimeoutText = formatTimeout(hungTimeoutSeconds ?? 60);

  return (
    <>
      {executeButton}
      <Dialog
        open={hungTimeoutSeconds !== null}
        onOpenChange={handleHungDialogOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Execution hung</DialogTitle>
            <DialogDescription>
              Execution has not sent any new updates for {hungTimeoutText}. If
              this execution is intended to take more than {hungTimeoutText}
              without progress updates, increase the async timeout limit in
              settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">OK</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
