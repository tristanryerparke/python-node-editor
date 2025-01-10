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

export type BaseData = z.infer<typeof BaseDataSchema>;
export type IntData = z.infer<typeof IntDataSchema>;
export type FloatData = z.infer<typeof FloatDataSchema>;
export type StringData = z.infer<typeof StringDataSchema>;
export type BoolData = z.infer<typeof BoolDataSchema>;


export const ListDataSchema = BaseDataSchema.extend({
  class_name: z.literal('ListData'),
  id: z.string(),
  payload: z.array(BaseDataSchema)
});


export const ModelDataSchema = BaseDataSchema.extend({
  class_name: z.literal('ModelData'),
  id: z.string(),
  payload: z.record(z.string(), BaseDataSchema)
}); 

export type ListData = z.infer<typeof ListDataSchema>;
export type ModelData = z.infer<typeof ModelDataSchema>;


