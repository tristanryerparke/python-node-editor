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

export interface ImageData {
  thumbnail: string | null;
  description: string | null;
  image_array: string | null;
}

export interface NodeOutputImage extends NodeOutput {
  value: ImageData;
}

export interface NodeInputImage extends NodeInput {
  value: ImageData;
}

export interface BaseNode {
  id: string;
  position: { x: number; y: number };
  data: BaseNodeData;
}

export type NodeCategories = Record<string, BaseNode[]>;