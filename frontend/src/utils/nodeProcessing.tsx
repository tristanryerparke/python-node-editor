import { Node } from '@xyflow/react';

interface NodeData {
  id: string;
  name: string;
  type: string;
  description: string;
  inputs: Record<string, { type: string; default: number; value: number }>;
  outputs: Record<string, any>;
  streaming: boolean;
  status: string;
  namespace: string;
  position?: { x: number; y: number };
}

export const parseNodeForCreation = (nodeData: Partial<NodeData>): Node => {
  const { id, type, position, ...rest } = nodeData;
  return {
    id: id || String(crypto.randomUUID()),
    type: type || 'customNode',
    position: position || { x: 0, y: 0 },
    data: {
      ...rest,
    },
  };
};

export const serializeNodeForBackend = (node: Node): NodeData => {
  const { id, type, position, data } = node;
  return {
    id,
    type,
    position,
    ...data,
  };
};

export const processNodes = (nodes: Node[]): NodeData[] => {
  return nodes.map(serializeNodeForBackend);
};