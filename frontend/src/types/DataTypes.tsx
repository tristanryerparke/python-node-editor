export interface NodeInput {
  label: string;
  type: string;
  input_data: any;
}

export interface NodeOutput {
  label: string;
  type: string;
  output_data: any | null;
}

export interface BaseNodeData {
  name: string;
  namespace: string;
  status: 'not evaluated' | 'pending' | 'executing' | 'streaming' | 'evaluated' | 'error';
  terminal_output: string;
  error_output: string;
  description: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  streaming: boolean;
  definition_path: string;
}

export interface Data {
  id: string;
  dtype: 'json' | 'numpy' | 'image' | 'basemodel';
  data: any;
  max_file_size_mb: number;
  class_name: string;
  cached: boolean;
  description: string | null;
  size_mb: number;
}

export interface NodeOutputImage extends NodeOutput {
  output_data: Data;
}

export interface NodeInputImage extends NodeInput {
  input_data: Data;
}

export interface BaseNode {
  id: string;
  position: { x: number; y: number };
  data: BaseNodeData;
}

export type NodeCategories = Record<string, BaseNode[]>;