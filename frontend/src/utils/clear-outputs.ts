import type { Edge } from "@xyflow/react";
import useFlowStore from "../stores/flowStore";
import type {
  FunctionNode,
  FrontendFieldDataWrapper,
  FrontendNodeData,
} from "../types/types";

const INPUT_HANDLE_REGEX = /^([^:]+):arguments:(.+):handle$/;

/**
 * Clones a field while clearing its value, keeping only UI properties and type
 */
const cloneFieldWithClearedValue = (
  field: FrontendFieldDataWrapper,
): FrontendFieldDataWrapper => {
  return Object.fromEntries(
    Object.entries(field).filter(
      ([key]) => key.startsWith("_") || key === "type",
    ),
  ) as FrontendFieldDataWrapper;
};

/**
 * Clears output data and terminal output from a single node's data
 * Preserves UI state (properties starting with "_") and types
 * Resets status to "not-executed"
 *
 * This function is reusable for both:
 * - Clearing outputs before execution
 * - Clearing outputs when copy/pasting nodes
 *
 * @param nodeData - The node data to clear outputs from
 * @returns The node data with outputs and terminal output cleared
 */
export const clearNodeOutputs = (
  nodeData: FrontendNodeData,
): FrontendNodeData => {
  const hasTerminalOutput = "terminalOutput" in nodeData;
  const dataWithoutTerminalOutput = hasTerminalOutput
    ? (({ terminalOutput: _terminalOutput, ...rest }) => rest)(
        nodeData as FrontendNodeData & {
          terminalOutput?: string;
        },
      )
    : nodeData;

  if (!nodeData.outputs) {
    if (!hasTerminalOutput) {
      return nodeData;
    }

    return {
      ...dataWithoutTerminalOutput,
      status: "not-executed",
    };
  }

  const outputs = Object.fromEntries(
    Object.entries(nodeData.outputs).map(([key, value]) => [
      key,
      cloneFieldWithClearedValue(value),
    ]),
  );

  return {
    ...dataWithoutTerminalOutput,
    outputs,
    status: "not-executed",
  };
};

const clearAllOutputs = (nodes: FunctionNode[]): Map<string, FunctionNode> => {
  const updatedNodes = new Map<string, FunctionNode>();

  nodes.forEach((node) => {
    if (!node.data) {
      updatedNodes.set(node.id, node);
      return;
    }

    updatedNodes.set(node.id, {
      ...node,
      data: clearNodeOutputs(node.data),
    });
  });

  return updatedNodes;
};

const clearConnectedInputs = (
  updatedNodes: Map<string, FunctionNode>,
  edges: Edge[],
) => {
  edges.forEach((edge) => {
    if (!edge.targetHandle) return;
    const match = INPUT_HANDLE_REGEX.exec(edge.targetHandle);
    if (!match) return;

    const [, nodeId, inputName] = match;
    const node = updatedNodes.get(nodeId);
    if (!node?.data?.arguments) return;
    const existingInput = node.data.arguments[inputName];
    if (!existingInput) return;

    const argumentsClone = { ...node.data.arguments };
    argumentsClone[inputName] = cloneFieldWithClearedValue(existingInput);

    updatedNodes.set(nodeId, {
      ...node,
      data: {
        ...node.data,
        arguments: argumentsClone,
        status: "not-executed",
      },
    });
  });
};

export const clearOutputsAndConnectedInputs = () => {
  const { nodes, edges, updateNodeData } = useFlowStore.getState();

  const updatedNodes = clearAllOutputs(nodes);
  clearConnectedInputs(updatedNodes, edges);

  const originalNodes = new Map(nodes.map((node) => [node.id, node]));
  updatedNodes.forEach((node, nodeId) => {
    if (originalNodes.get(nodeId) !== node) {
      void updateNodeData([nodeId], node.data);
    }
  });

  const nextNodes = nodes.map((node) => updatedNodes.get(node.id) ?? node);

  return { nodes: nextNodes, edges };
};
