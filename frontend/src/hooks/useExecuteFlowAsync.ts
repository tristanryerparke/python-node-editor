import { useCallback, useRef } from "react";
import { stripGraphForExecute, type Graph } from "../utils/strip-graph";
import { preserveUIData } from "../utils/preserve-ui-data";
import useFlowStore from "../stores/flowStore";
import type { NodeUpdate } from "../types/types";
import { buildApiPath } from "@/lib/fetcher";
import useSettingsStore, {
  normalizeAsyncExecutionTimeoutSeconds,
} from "@/stores/settingsStore";

const POLLING_INTERVAL_MS = 250;

type UseExecuteFlowAsyncOptions = {
  onExecutionHung?: (timeoutMs: number) => void | Promise<void>;
};

type ExecutionStatusResponse = {
  updateIndex: number;
  status?: "running" | "complete";
  nodeUpdates?: Record<string, NodeUpdate>;
};

export function useExecuteFlowAsync(options: UseExecuteFlowAsyncOptions = {}) {
  const { onExecutionHung } = options;
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const getNodeData = useFlowStore((state) => state.getNodeData);
  const asyncExecutionTimeoutSeconds = useSettingsStore((state) =>
    normalizeAsyncExecutionTimeoutSeconds(state.asyncExecutionTimeoutSeconds),
  );
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSeenIndexRef = useRef<number>(-1);
  const lastProgressAtRef = useRef<number>(0);
  const activeExecutionIdRef = useRef<string | null>(null);
  const timeoutTriggeredRef = useRef(false);
  const completionResolveRef = useRef<(() => void) | null>(null);
  const completionRejectRef = useRef<((error: unknown) => void) | null>(null);

  const resolveCompletion = useCallback(() => {
    const resolve = completionResolveRef.current;
    completionResolveRef.current = null;
    completionRejectRef.current = null;
    resolve?.();
  }, []);

  const rejectCompletion = useCallback((error: unknown) => {
    const reject = completionRejectRef.current;
    completionResolveRef.current = null;
    completionRejectRef.current = null;
    reject?.(error);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  const resetExecutionTracking = useCallback(() => {
    stopPolling();
    lastSeenIndexRef.current = -1;
    lastProgressAtRef.current = 0;
    activeExecutionIdRef.current = null;
  }, [stopPolling]);

  const finishExecution = useCallback(() => {
    resetExecutionTracking();
    timeoutTriggeredRef.current = false;
    resolveCompletion();
  }, [resetExecutionTracking, resolveCompletion]);

  const failExecution = useCallback(
    (error: unknown) => {
      resetExecutionTracking();
      timeoutTriggeredRef.current = false;
      rejectCompletion(error);
    },
    [rejectCompletion, resetExecutionTracking],
  );

  const handleExecutionHung = useCallback(
    async (timeoutMs: number) => {
      if (timeoutTriggeredRef.current || activeExecutionIdRef.current === null) {
        return;
      }

      console.warn(
        `Async execution produced no new updates for ${timeoutMs}ms; treating it as hung.`,
      );
      timeoutTriggeredRef.current = true;
      resetExecutionTracking();

      try {
        await onExecutionHung?.(timeoutMs);
        resolveCompletion();
      } catch (error) {
        rejectCompletion(error);
      } finally {
        timeoutTriggeredRef.current = false;
      }
    },
    [onExecutionHung, rejectCompletion, resetExecutionTracking, resolveCompletion],
  );

  const pollStatus = useCallback(
    async (executionId: string) => {
      if (
        timeoutTriggeredRef.current ||
        activeExecutionIdRef.current !== executionId
      ) {
        return;
      }

      try {
        const response = await fetch(
          buildApiPath(`/execution_update/${executionId}`),
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = (await response.json()) as ExecutionStatusResponse;

        if (
          timeoutTriggeredRef.current ||
          activeExecutionIdRef.current !== executionId
        ) {
          return result;
        }

        // Check if the updateIndex has changed
        const currentIndex = result.updateIndex;

        if (currentIndex === lastSeenIndexRef.current) {
          // No changes, skip processing
          return result;
        }

        // Update index has changed, process the updates
        lastSeenIndexRef.current = currentIndex;
        lastProgressAtRef.current = Date.now();

        // Process updates if present
        if (result.nodeUpdates) {
          for (const update of Object.values(result.nodeUpdates)) {
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
          finishExecution();
        }

        return result;
      } catch (error) {
        if (activeExecutionIdRef.current !== executionId) {
          return;
        }

        console.error("Error polling execution status:", error);
        failExecution(error);
      }
    },
    [failExecution, finishExecution, getNodeData, updateNodeData],
  );

  const pollOrHandleTimeout = useCallback(
    (executionId: string, timeoutMs: number) => {
      if (
        timeoutTriggeredRef.current ||
        activeExecutionIdRef.current !== executionId
      ) {
        return;
      }

      const handleTimeoutIfStillStale = () => {
        if (
          timeoutTriggeredRef.current ||
          activeExecutionIdRef.current !== executionId
        ) {
          return;
        }

        if (Date.now() - lastProgressAtRef.current >= timeoutMs) {
          void handleExecutionHung(timeoutMs);
        }
      };

      if (Date.now() - lastProgressAtRef.current >= timeoutMs) {
        void pollStatus(executionId).finally(handleTimeoutIfStillStale);
        return;
      }

      void pollStatus(executionId);
    },
    [handleExecutionHung, pollStatus],
  );

  const execute = useCallback(
    async (graph: Graph) => {
      const executeMessage = stripGraphForExecute(graph);
      const timeoutMs = asyncExecutionTimeoutSeconds * 1000;

      // Stop any existing polling
      resetExecutionTracking();
      timeoutTriggeredRef.current = false;

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

      activeExecutionIdRef.current = executionId;
      lastSeenIndexRef.current = -1;
      lastProgressAtRef.current = Date.now();

      // Create a promise that resolves when execution completes or the hung modal closes.
      const completionPromise = new Promise<void>((resolve, reject) => {
        completionResolveRef.current = resolve;
        completionRejectRef.current = reject;
      });

      // Start polling for status updates
      pollingTimerRef.current = setInterval(() => {
        pollOrHandleTimeout(executionId, timeoutMs);
      }, POLLING_INTERVAL_MS);

      // Also poll immediately
      void pollStatus(executionId);

      // Wait for execution to complete or for the hung modal to be dismissed
      await completionPromise;
    },
    [
      asyncExecutionTimeoutSeconds,
      pollOrHandleTimeout,
      pollStatus,
      resetExecutionTracking,
    ],
  );

  return { execute, stopPolling };
}
