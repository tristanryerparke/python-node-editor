export interface NodeInput {
  type: string;
  value: any;
}

export interface NodeOutput {
  type: string;
  value: any | null;
}

export interface BaseNodeData {
  name: string;
  namespace: string;
  status: 'not evaluated' | 'pending' | 'executing' | 'streaming' | 'evaluated' | 'error';
  terminal_output: string;
  error_output: string;
  description: string;
  inputs: Record<string, NodeInput>;
  outputs: Record<string, NodeOutput>;
  streaming: boolean;
  definition_path: string;
}

export interface BaseNode {
  id: string;
  position: { x: number; y: number };
  data: BaseNodeData;
}

export type NodeCategories = Record<string, BaseNode[]>;