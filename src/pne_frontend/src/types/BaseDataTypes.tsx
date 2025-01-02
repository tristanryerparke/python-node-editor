import { ReactFlowJsonObject } from '@xyflow/react';
import { z } from 'zod';

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

export interface InputNodeField {
  id: string;
  dtype: 'string' | 'units';
  data: BaseData | null;
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
  dtype: 'number' | 'string' | 'json' | 'numpy' | 'image' | 'object';
  data: BaseData | null;
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
  group: string;
}

export type NodeCategories = Record<string, BaseNode[] & { groups?: Record<string, BaseNode[]> }>;


export interface FlowFileObject extends ReactFlowJsonObject {
  embedded_data: Record<string, string>;
  metadata: {
    filename: string;
  };
}



export const BaseDataSchema = z.object({
  class_name: z.string(),
  id: z.string(),
  payload: z.unknown()
});

export const IntDataSchema = BaseDataSchema.extend({
  class_name: z.literal('IntData'),
  payload: z.number().int()
});

export const FloatDataSchema = BaseDataSchema.extend({
  class_name: z.literal('FloatData'),
  payload: z.number()
});

export const StringDataSchema = BaseDataSchema.extend({
  class_name: z.literal('StringData'),
  payload: z.string()
});

export const BoolDataSchema = BaseDataSchema.extend({
  class_name: z.literal('BoolData'),
  payload: z.boolean()
});

export interface BaseData {
  class_name: string;
  id: string;
  payload: unknown;
}
  
export interface IntData extends BaseData {
  class_name: 'IntData';
  payload: number;
}

export interface FloatData extends BaseData {
  class_name: 'FloatData';
  payload: number;
}

export interface StringData extends BaseData {
  class_name: 'StringData';
  payload: string;
}

export interface BoolData extends BaseData {
  class_name: 'BoolData';
  payload: boolean;
}