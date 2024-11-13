import { ReactFlowJsonObject } from '@xyflow/react';

export interface BaseNodeData {
  display_name: string;
  class_name: string;
  namespace: string;
  status: 'not evaluated' | 'pending' | 'executing' | 'streaming' | 'evaluated' | 'error';
  terminal_output: string;
  error_output: string;
  description: string;
  inputs: InputNodeField[];
  outputs: OutputNodeField[];
  streaming: boolean;
  definition_path: string;
  progress: number;
}

export interface FieldData {
  id: string;
  payload: any;
  metadata: Record<string, unknown>;
  dtype: 'number' | 'string' | 'json' | 'numpy' | 'image' | 'class';
  cached: boolean;
  size_mb: number;
}

export interface InputNodeField {
  id: string;
  dtype: 'number' | 'string' | 'json' | 'numpy' | 'image' | 'class';
  data: FieldData | null;
  description: string | null;
  label: string;
  user_label: string;
  disabled: boolean;
  is_edge_connected: boolean;
  node_expanded: boolean;
  inspector_expanded: boolean;
  metadata: Record<string, unknown>;
}

export interface OutputNodeField {
  id: string;
  dtype: 'number' | 'string' | 'json' | 'numpy' | 'image' | 'class';
  data: FieldData | null;
  description: string | null;
  label: string;
  user_label: string;
  disabled: boolean;
  is_edge_connected: boolean;
  node_expanded: boolean;
  inspector_expanded: boolean;
  metadata: Record<string, unknown>;
}

export interface BaseNode {
  id: string;
  position: { x: number; y: number };
  data: BaseNodeData;
}

export type NodeCategories = Record<string, BaseNode[]>;


export interface FlowFileObject extends ReactFlowJsonObject {
  embedded_data: Record<string, string>;
  metadata: {
    filename: string;
  };
}