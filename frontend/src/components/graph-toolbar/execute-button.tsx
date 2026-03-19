import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LoaderIcon } from "lucide-react";
import useSettingsStore from "../../stores/settingsStore";
import { useState, useCallback, useMemo } from "react";
import { type Graph } from "../../utils/strip-graph";
import { useBackendConnection } from "../../hooks/useBackendConnection";
import { useExecuteFlowSync } from "../../hooks/useExecuteFlowSync";
import { useExecuteFlowAsync } from "../../hooks/useExecuteFlowAsync";
import { clearOutputsAndConnectedInputs } from "../../utils/clear-outputs";
import useFlowStore from "@/stores/flowStore";
import { getInvalidNodeInputIssues } from "@/utils/input-execution-validation";

export default function ExecuteMenu() {
  const [loading, setLoading] = useState(false);
  const { isConnected, isChecking } = useBackendConnection();
  const executionMode = useSettingsStore((state) => state.executionMode);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);

  const { execute: executeSyncFn } = useExecuteFlowSync();
  const { execute: executeAsyncFn } = useExecuteFlowAsync();

  const invalidInputIssues = useMemo(
    () => getInvalidNodeInputIssues(nodes, edges),
    [edges, nodes],
  );
  const hasInvalidInputs = invalidInputIssues.length > 0;

  const execute = useCallback(async () => {
    if (invalidInputIssues.length > 0) {
      console.group("Executing with invalid node inputs");
      invalidInputIssues.forEach(({ nodeId, inputName, reason }) => {
        console.warn(`${nodeId}.${inputName}: ${reason}`);
      });
      console.groupEnd();
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
  }, [executionMode, executeSyncFn, executeAsyncFn, invalidInputIssues]);

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
  const isDisabled = disabledReasons.length > 0;
  const buttonClass =
    isConnected && !isChecking && !hasInvalidInputs
      ? "w-25 text-green-700! border-green-700!"
      : "w-25";

  const button = (
    <Button
      className={buttonClass}
      variant="outline"
      size="sm"
      onClick={execute}
      disabled={isDisabled}
    >
      {loading ? <LoaderIcon className="animate-spin" /> : "Execute"}
    </Button>
  );

  if (isDisabled) {
    return (
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
    );
  }

  return <div className="w-full">{button}</div>;
}
