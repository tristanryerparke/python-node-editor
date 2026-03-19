import type { Node } from "@xyflow/react";
import type {
  DataWrapper,
  FunctionSchema as BackendFunctionSchema,
} from "./backend-schema";

export interface CachedValueReference {
  instanceType?: string;
  cacheKey: string;
  [key: string]: unknown;
}

export type BaseDataTypes =
  | number
  | string
  | boolean
  | CachedValueReference
  | Record<string, unknown>
  | unknown[];

// This is a frontend-only type that extends DataWrapper with UI state
export interface FrontendFieldDataWrapper extends DataWrapper {
  value?: BaseDataTypes | null;
  _selectedType?: string;
  _dynamicInputType?: "list" | "dict";
  _expanded?: boolean;
  _expandedHeight?: number;
}

export interface terminalDrawerDisplayState {
  _expanded?: boolean;
  _expandedHeight?: number;
}

export interface FrontendNodeData
  extends Omit<BackendFunctionSchema, "arguments" | "outputs"> {
  arguments: Record<string, FrontendFieldDataWrapper>;
  outputs: Record<string, FrontendFieldDataWrapper>;
  terminalOutput?: string;
  _terminal_drawer?: terminalDrawerDisplayState;
  status?: "not-executed" | "executed" | "error" | "executing";
  [key: string]: unknown;
}



export interface NodeUpdate {
  nodeId: string;
  status?: "executing" | "executed" | "error";
  outputs?: Record<string, FrontendFieldDataWrapper>;
  arguments?: Record<string, FrontendFieldDataWrapper>;
  terminalOutput?: string;
}

// Used for react flow purposes
export type FunctionNode = Node<FrontendNodeData, "customNode">;
