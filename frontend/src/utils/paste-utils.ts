import type { Edge, Node } from "@xyflow/react";
import { preserveUIData } from "./preserve-ui-data";
import { clearNodeOutputs } from "./clear-outputs";
import type { FrontendNodeData } from "../types/types";


/**
 * Creates new instances of nodes with unique IDs and offsets positions
 * This is the core function for creating fresh node instances on paste
 *
 * @param nodesToCopy - Nodes to duplicate
 * @param deriveNodeId - Function to generate new IDs from old IDs
 * @param modifyPositions - Whether to offset positions (default: true)
 * @returns New node instances with unique IDs
 */
export const copyNodes = (
  nodesToCopy: readonly Node[],
  deriveNodeId: (oldId: string) => string,
  modifyPositions = true,
): Node[] => {
  const offsetX = 50 * (Math.random() * 2 - 1); // Random ±50px
  const offsetY = 50 * (Math.random() * 2 - 1);

  return nodesToCopy.map((node) => {
    const newId = deriveNodeId(node.id);
    const clearedData = clearNodeOutputs(node.data as FrontendNodeData);

    return {
      ...node,
      id: newId,
      position: {
        x: node.position.x + (modifyPositions ? 200 + offsetX : 0),
        y: node.position.y + (modifyPositions ? 200 + offsetY : 0),
      },
      data: {
        ...clearedData,
        // Preserve all UI data (properties starting with _)
        // by using preserveUIData with the same data as input
        // This creates a new object but keeps UI state
        ...preserveUIData(clearedData, clearedData),
      },
      selected: false,
    };
  });
};

/**
 * Creates new instances of edges with updated source/target IDs
 *
 * @param edgesToCopy - Edges to duplicate
 * @param deriveNodeId - Function to generate new IDs from old IDs
 * @returns New edge instances with updated IDs
 */
export const copyEdges = (
  edgesToCopy: readonly Edge[],
  deriveNodeId: (oldId: string) => string,
): Edge[] => {
  return edgesToCopy.map((edge) => {
    const newSource = deriveNodeId(edge.source);
    const newTarget = deriveNodeId(edge.target);

    // Update handle IDs if they contain the node ID
    const newSourceHandle = edge.sourceHandle?.replace(edge.source, newSource);
    const newTargetHandle = edge.targetHandle?.replace(edge.target, newTarget);

    return {
      ...edge,
      id: crypto.randomUUID(),
      source: newSource,
      sourceHandle: newSourceHandle,
      target: newTarget,
      targetHandle: newTargetHandle,
      selected: false,
    };
  });
};

/**
 * Sets the selected state of nodes/edges
 *
 * @param items - Nodes or edges to update
 * @param selected - Selection state
 * @returns Updated items with selection state
 */
export const setSelected = <T extends { selected?: boolean }>(
  items: readonly T[],
  selected: boolean,
): T[] => {
  return items.map((item) => ({ ...item, selected }));
};
