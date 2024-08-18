import { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react';

export interface NodeInput {
  type: string;
  default: any;
  value: any;
}

export interface NodeOutput {
  type: string;
  value: any;
}

export class NodeTemplate {
  id: string;
  name: string;
  namespace: string;
  status: string;
  position: { x: number; y: number };
  terminal_output: string;
  error_output: string;
  description: string;
  inputs: Record<string, { type: string; default?: any; value?: any }>;
  outputs: Record<string, { type: string; value?: any }>;
  streaming: boolean;
  definition_path: string;

  constructor(data: Partial<NodeTemplate>) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.namespace = data.namespace || '';
    this.status = data.status || 'not evaluated';
    this.position = data.position || { x: 0, y: 0 };
    this.terminal_output = data.terminal_output || '';
    this.error_output = data.error_output || '';
    this.description = data.description || '';
    this.inputs = data.inputs || {};
    this.outputs = data.outputs || {};
    this.streaming = data.streaming || false;
    this.definition_path = data.definition_path || '';
  }
}


export interface NodeData {
  id: string;
  name: string;
  type: string;
  description: string;
  inputs: Record<string, NodeInput>;
  outputs: Record<string, NodeOutput>;
  streaming: boolean;
  status: string;
  namespace: string;
  position?: { x: number; y: number };
  // had to do this to make the node data type compatible with the react flow node type
  [key: string]: unknown;
}

export type CustomNode = ReactFlowNode<NodeData>;
export type CustomEdge = ReactFlowEdge;