import { z } from 'zod';

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
