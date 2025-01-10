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

export const ImageDataSchema = BaseDataSchema.extend({
  class_name: z.literal('ImageData'),
  payload: z.string(),
  description: z.string(),
  width: z.number(),
  height: z.number(),
  image_type: z.string(),
  preview: z.string()
});

export type BaseData = z.infer<typeof BaseDataSchema>;
export type IntData = z.infer<typeof IntDataSchema>;
export type FloatData = z.infer<typeof FloatDataSchema>;
export type StringData = z.infer<typeof StringDataSchema>;
export type BoolData = z.infer<typeof BoolDataSchema>;
export type ImageData = z.infer<typeof ImageDataSchema>;

export const ListDataSchema = BaseDataSchema.extend({
  class_name: z.literal('ListData'),
  payload: z.array(BaseDataSchema)
});

export type ListData = z.infer<typeof ListDataSchema>;

export const ModelDataSchema = z.object({
  class_name: z.string(),
  id: z.string(),
  class_parent: z.literal('ModelData'),
  // Add other fields specific to ModelData if needed
});

export type ModelData = z.infer<typeof ModelDataSchema>;


export type AnyData = BaseData | ListData | ModelData | ImageData;