import { BaseData } from "./dataTypes";



export interface InputField {
  label: string;
  user_label: string;
  data: BaseData | null;
  allowed_types: string[];
  input_display_generate: string;
  display_type: string;
  is_edge_connected: boolean;
  metadata: Record<string, unknown>;
}


export interface OutputField {
  label: string;
  user_label: string;
  data: BaseData | null;
  display_type: string;
  metadata: Record<string, unknown>;
}


export interface BaseNodeData {
  display_name: string;
  class_name: string;
  namespace: string;
  status: 'not evaluated' | 'pending' | 'executing' | 'streaming' | 'evaluated' | 'error';
  terminal_output: string;
  error_output: string;
  description: string;
  inputs: InputField[];
  outputs: OutputField[];
  streaming: boolean;
  definition_path: string;
  progress: number;
}

export interface BaseNode {
  id: string;
  position: { x: number; y: number };
  data: BaseNodeData;
  group?: string;
}

export type NodeCategories = Record<string, BaseNode[] & { groups?: Record<string, BaseNode[]> }>;
