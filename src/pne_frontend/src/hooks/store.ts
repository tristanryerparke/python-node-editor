import { proxy } from "valtio";

import { BaseNode } from "../types/nodeTypes";
import { type Edge } from "@xyflow/react";

interface NodesStore {
  nodes: BaseNode[];
  edges: Edge[];
}

const dynamicNodesStore: NodesStore[] = [];

export const store = proxy({
  nodesStoreProxy: dynamicNodesStore
});

