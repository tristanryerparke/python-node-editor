import { useCallback, useRef } from "react";
import { stripGraphForExecute, type Graph } from "../utils/strip-graph";
import { preserveUIData } from "../utils/preserve-ui-data";
import useFlowStore from "../stores/flowStore";
import type { NodeUpdate } from "../types/types";
import { buildApiPath } from "@/lib/fetcher";

const POLLING_INTERVAL_MS = 250;

export function useExecuteFlowAsync() {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const getNodeData = useFlowStore((state) => state.getNodeData);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSeenIndexRef = useRef<number>(-1);
  const completionResolveRef = useRef<(() => void) | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(
    async (executionId: string) => {
      try {
        const response = await fetch(
          buildApiPath(`/execution_update/${executionId}`),
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Check if the updateIndex has changed
        const currentIndex = result.updateIndex;

        if (currentIndex === lastSeenIndexRef.current) {
          // No changes, skip processing
          return result;
        }

        // Update index has changed, process the updates
        lastSeenIndexRef.current = currentIndex;

        // Process updates if present
        if (result.nodeUpdates) {
          const updates: NodeUpdate[] = Array.isArray(result.nodeUpdates)
            ? result.nodeUpdates
            : Object.values(result.nodeUpdates);

          for (const update of updates) {
            const nodeId = update.nodeId;

            // Get existing node data and merge while preserving ui only-data
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const existingNodeData = getNodeData([nodeId]) as any;
            const { nodeId: _nodeId, ...updateData } = update; // Remove nodeId from update
            const mergedNodeData = preserveUIData(existingNodeData, updateData);

            // Update the entire node data at once
            await updateNodeData([nodeId], mergedNodeData);

            // Log errors for debugging
              if (update.status === "error") {
                console.error(
                  `Node ${nodeId} failed with output:`,
                  update.terminalOutput,
                );
              }
          }
        }

        // Check if execution is complete
        if (result.status === "complete") {
          console.log("Execution complete, stopping polling");
          stopPolling();
          lastSeenIndexRef.current = -1;

          // Resolve the completion promise
          if (completionResolveRef.current) {
            completionResolveRef.current();
            completionResolveRef.current = null;
          }
        }

        return result;
      } catch (error) {
        console.error("Error polling execution status:", error);
        stopPolling();
        lastSeenIndexRef.current = -1;
        throw error;
      }
    },
    [updateNodeData, getNodeData, stopPolling],
  );

  const execute = useCallback(
    async (graph: Graph) => {
      const executeMessage = stripGraphForExecute(graph);

      // Stop any existing polling
      stopPolling();
      lastSeenIndexRef.current = -1;

      console.log("Submitting graph for async execution:", executeMessage);
      const response = await fetch(buildApiPath("/execution_submit"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(executeMessage),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const executionId = result.execution_id;

      console.log(`Execution submitted with ID: ${executionId}`);

      // Create a promise that resolves when execution completes
      const completionPromise = new Promise<void>((resolve) => {
        completionResolveRef.current = resolve;
      });

      // Start polling for status updates
      pollingTimerRef.current = setInterval(() => {
        pollStatus(executionId);
      }, POLLING_INTERVAL_MS);

      // Also poll immediately
      pollStatus(executionId);

      // Wait for execution to complete
      await completionPromise;
    },
    [pollStatus, stopPolling],
  );

  return { execute, stopPolling };
}
