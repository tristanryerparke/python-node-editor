import type { Edge } from "@xyflow/react";
import useFlowStore from "../stores/flowStore";
import type { FunctionNode, FrontendFieldDataWrapper } from "../types/types";

const INPUT_HANDLE_REGEX = /^([^:]+):arguments:(.+):handle$/;

const cloneFieldWithClearedValue = (
  field: FrontendFieldDataWrapper,
): FrontendFieldDataWrapper => {
  return Object.fromEntries(
    Object.entries(field).filter(
      ([key]) => key.startsWith("_") || key === "type",
    ),
  ) as FrontendFieldDataWrapper;
};

const clearAllOutputs = (nodes: FunctionNode[]): Map<string, FunctionNode> => {
  const updatedNodes = new Map<string, FunctionNode>();

  nodes.forEach((node) => {
    if (!node.data) {
      updatedNodes.set(node.id, node);
      return;
    }

    const hasTerminalOutput = "terminalOutput" in node.data;
    const dataWithoutTerminalOutput = hasTerminalOutput
      ? (({ terminalOutput: _terminalOutput, ...rest }) => rest)(
          node.data as FunctionNode["data"] & {
            terminalOutput?: string;
          },
        )
      : node.data;

    if (!node.data.outputs) {
      if (!hasTerminalOutput) {
        updatedNodes.set(node.id, node);
        return;
      }

      updatedNodes.set(node.id, {
        ...node,
        data: dataWithoutTerminalOutput,
      });
      return;
    }

    const outputs = Object.fromEntries(
      Object.entries(node.data.outputs).map(([key, value]) => [
        key,
        cloneFieldWithClearedValue(value),
      ]),
    );

    updatedNodes.set(node.id, {
      ...node,
      data: {
        ...dataWithoutTerminalOutput,
        outputs,
      },
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
      updateNodeData([nodeId], node.data);
    }
  });

  const nextNodes = nodes.map((node) => updatedNodes.get(node.id) ?? node);

  return { nodes: nextNodes, edges };
};
