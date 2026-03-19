import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/vanilla/shallow";
import { persist, createJSONStorage } from "zustand/middleware";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import type {
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  ReactFlowInstance,
  Viewport,
} from "@xyflow/react";
import { produce } from "immer";
import type { FrontendFieldDataWrapper, FunctionNode } from "../types/types";
import type { EnvironmentResponse, FunctionSchemas, TypeInfo } from "@/types/environment";
import {
  getConcreteType,
  isArgumentValuePath,
  isCachedValueReference,
  uploadLargeData,
} from "../utils/large-data-utils";
import { preserveUIData } from "../utils/preserve-ui-data";
import { findNodeIndexById } from "../utils/store-utils";
import { indexFunctionSchemas } from "@/types/environment";

type FlowStoreState = {
  nodes: FunctionNode[];
  edges: Edge[];
  viewport: Viewport;
  rfInstance: ReactFlowInstance<FunctionNode, Edge> | null;
  functionSchemas: FunctionSchemas;
  types: Record<string, TypeInfo>;
};

type FlowStoreActions = {
  setNodes: (
    nodes: FunctionNode[] | ((currentNodes: FunctionNode[]) => FunctionNode[]),
  ) => void;
  setEdges: (edges: Edge[]) => void;
  setViewport: (viewport: Viewport) => void;
  setRfInstance: (instance: ReactFlowInstance<FunctionNode, Edge>) => void;
  setEnvironment: (environment: EnvironmentResponse) => void;
  onNodesChange: OnNodesChange<FunctionNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  updateNodeData: (
    path: (string | number)[],
    newData: unknown,
    options?: { suppress?: boolean; prefix?: string; fromUser?: boolean },
  ) => Promise<void>;
  getNodeData: (path: (string | number)[]) => unknown;
  deleteNodeData: (path: (string | number)[]) => void;
};

export type FlowState = FlowStoreState & FlowStoreActions;

const useFlowStore = createWithEqualityFn<
  FlowState,
  [["zustand/persist", unknown]]
>(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      rfInstance: null,
      functionSchemas: {},
      types: {},

      onNodesChange: (changes) => {
        set(
          produce((state: FlowState) => {
            const nodesCopy = [...state.nodes];
            const updatedNodes = applyNodeChanges(changes, nodesCopy);
            state.nodes = updatedNodes;
          }),
        );
      },

      onEdgesChange: (changes) => {
        set(
          produce((state: FlowState) => {
            const edgesCopy = [...state.edges];
            const updatedEdges = applyEdgeChanges(changes, edgesCopy);
            state.edges = updatedEdges;
          }),
        );
      },

      onConnect: (connection) =>
        set({ edges: addEdge(connection, get().edges) }),

      setNodes: (nodes) =>
        set({
          nodes: typeof nodes === "function" ? nodes(get().nodes) : nodes,
        }),

      setEdges: (edges) => set({ edges }),

      setViewport: (viewport) => set({ viewport }),

      setRfInstance: (instance) => set({ rfInstance: instance }),

      setEnvironment: (environment) =>
        set({
          functionSchemas: indexFunctionSchemas(environment.nodes),
          types: environment.types,
        }),

      updateNodeData: async (path, newData, options = {}) => {
        const { suppress = false, prefix = "", fromUser = false } = options;
        const oldValue = get().getNodeData(path);

        let targetPath = path;
        let dataToSet = newData;

        if (
          fromUser &&
          isArgumentValuePath(path) &&
          newData != null &&
          !isCachedValueReference(newData)
        ) {
          const wrapperPath = path.slice(0, -1);
          const wrapper = get().getNodeData(
            wrapperPath,
          ) as FrontendFieldDataWrapper | undefined;
          const concreteType = getConcreteType(wrapper);

          if (concreteType) {
            const nodeId = String(wrapperPath[0]);
            const nodeData = get().getNodeData([
              nodeId,
            ]) as FunctionNode["data"] | undefined;
            const cachedTypes =
              nodeData && Array.isArray(nodeData.cachedTypes)
                ? nodeData.cachedTypes
                : [];

            if (cachedTypes.includes(concreteType)) {
              const callableId = nodeData?.callableId;
              if (callableId) {
                const cachedData = await uploadLargeData(
                  concreteType,
                  newData,
                  callableId,
                );
                dataToSet = preserveUIData(wrapper, cachedData);
                targetPath = wrapperPath;
              } else {
                console.error(
                  `Missing callableId for cached upload (node: ${nodeId})`,
                );
              }
            }
          }
        }

        set(
          produce((state: FlowState) => {
            const nodeIndex = findNodeIndexById(state.nodes, targetPath[0]);
            if (nodeIndex !== -1) {
              const pathToProperty = targetPath.slice(1);

              // Special case: if path is just [nodeId], replace entire node data
              if (pathToProperty.length === 0) {
                state.nodes[nodeIndex].data =
                  dataToSet as FunctionNode["data"];
              } else {
                let current = state.nodes[nodeIndex].data;

                for (let i = 0; i < pathToProperty.length - 1; i++) {
                  const key = pathToProperty[i];
                  if (current[key] === undefined) {
                    console.warn(
                      `Creating new nested property: ${key} at path: ${targetPath.slice(0, i + 2).join(".")}`,
                    );
                    current[key] = {};
                  }
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  current = current[key] as any;
                }

                const finalKey = pathToProperty[pathToProperty.length - 1];
                current[finalKey] = dataToSet;
              }
            }
          }),
        );

        if (!suppress) {
          const message = prefix ? `${prefix} ` : "";
          console.log(
            `${message}updating `,
            targetPath,
            "\n from",
            oldValue,
            "to",
            dataToSet,
          );
        }
      },

      getNodeData: (path) => {
        const nodes = get().nodes;
        const nodeIndex = findNodeIndexById(nodes, path[0]);

        if (nodeIndex === -1) {
          return undefined;
        }

        let current = nodes[nodeIndex].data;
        const pathToProperty = path.slice(1);

        for (let i = 0; i < pathToProperty.length; i++) {
          const key = pathToProperty[i];
          if (current[key] === undefined) {
            return undefined;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          current = current[key] as any;
        }

        return current;
      },

      deleteNodeData: (path) => {
        set(
          produce((state: FlowState) => {
            const nodeIndex = findNodeIndexById(state.nodes, path[0]);
            if (nodeIndex !== -1) {
              let current = state.nodes[nodeIndex].data;
              const pathToProperty = path.slice(1);

              // Navigate to the parent object
              for (let i = 0; i < pathToProperty.length - 1; i++) {
                const key = pathToProperty[i];
                if (current[key] === undefined) {
                  console.warn(
                    `Property not found at path: ${path.slice(0, i + 2).join(".")}`,
                  );
                  return;
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                current = current[key] as any;
              }

              // Delete the final property
              const finalKey = pathToProperty[pathToProperty.length - 1];
              delete current[finalKey];
              console.log("deleted data at path:", path);
            }
          }),
        );
      },
    }),
    {
      name: "flow-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        viewport: state.viewport,
      }),
    },
  ),
  shallow,
);

export const useNodeData = (path: (string | number)[]) => {
  return useFlowStore((state) => {
    const nodeIndex = findNodeIndexById(state.nodes, path[0]);
    const node = nodeIndex === -1 ? undefined : state.nodes[nodeIndex];
    if (!node) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = node.data;
    for (let i = 1; i < path.length; i++) {
      if (current === undefined) return undefined;
      current = current[path[i]];
    }
    return current;
  });
};

export default useFlowStore;
