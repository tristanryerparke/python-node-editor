import { ReactFlowJsonObject } from '@xyflow/react';

export interface BaseNodeData {
  display_name: string;
  class_name: string;
  namespace: string;
  status: 'not evaluated' | 'pending' | 'executing' | 'streaming' | 'evaluated' | 'error';
  terminal_output: string;
  error_output: string;
  description: string;
  inputs: NodeField[];
  outputs: NodeField[];
  streaming: boolean;
  definition_path: string;
  progress: number;
}

export interface NodeField {
  id: string;
  dtype: 'number' | 'string' | 'numpy' | 'image' | 'basemodel';
  data: any;
  max_file_size_mb: number;
  class_name: string;
  cached: boolean;
  description: string | null;
  size_mb: number;
  field_type: 'input' | 'output';
  label: string;
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