import type { TypeSchema, UnionDescr } from "./backend-schema";
import type { FrontendNodeData } from "./types";

export type PropertyType = TypeSchema;

export interface TypeInfo {
  kind: string;
  category?: string[];
  type?: string | UnionDescr;
  properties?: Record<string, PropertyType> | null;
  [key: string]: unknown;
}

export interface FrontendPluginAsset {
  id: string;
  js: string;
  css?: string;
}

export interface EnvironmentResponse {
  nodes: FrontendNodeData[];
  types: Record<string, TypeInfo>;
  plugins?: FrontendPluginAsset[];
}

export type FunctionSchemas = Record<string, FrontendNodeData>;

export function indexFunctionSchemas(
  nodes: FrontendNodeData[],
): FunctionSchemas {
  return Object.fromEntries(
    nodes.map((schema) => [schema.callableId, schema]),
  );
}
