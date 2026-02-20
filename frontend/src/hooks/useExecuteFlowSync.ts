import { useCallback } from "react";
import { stripGraphForExecute, type Graph } from "../utils/strip-graph";
import { preserveUIData } from "../utils/preserve-ui-data";
import useFlowStore from "../stores/flowStore";

export function useExecuteFlowSync() {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const getNodeData = useFlowStore((state) => state.getNodeData);

  const execute = useCallback(
    async (graph: Graph) => {
      const executeMessage = stripGraphForExecute(graph);

      console.log("Executing graph (sync):", executeMessage);
      const response = await fetch("http://localhost:8000/graph_execute", {
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

      if (result.status === "success") {
        // Process updates in execution order
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result.updates.forEach((update: any) => {
          const nodeId = update.nodeId;

          // Get existing node data and merge while preserving ui only-data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const existingNodeData = getNodeData([nodeId]) as any;
          const { nodeId: _nodeId, ...updateData } = update; // Remove nodeId from update
          const mergedNodeData = preserveUIData(existingNodeData, updateData);

          // Update the entire node data at once
          updateNodeData([nodeId], mergedNodeData);

          // Log errors for debugging
          if (update.status === "error") {
            console.error(
              `Node ${nodeId} failed with output:`,
              update.terminalOutput,
            );
            // Automatically open the drawer when an error occurs
            console.log(`Auto-opening drawer for node ${nodeId} due to error`);
            updateNodeData([nodeId, "_terminal_drawer", "_expanded"], true);
          }
        });
      } else {
        console.error("Graph execution failed:", result.message);
        throw new Error(result.message || "Graph execution failed");
      }
    },
    [updateNodeData, getNodeData],
  );

  return { execute };
}
