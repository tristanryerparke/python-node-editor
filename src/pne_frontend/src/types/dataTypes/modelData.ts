import { z } from 'zod';
import { AnyData } from './anyData';

// Zod Schemas
export const ModelDataSchema = z.object({
  class_parent: z.literal('ModelData'),
  class_name: z.string(),   
  id: z.string(),
  metadata: z.object({
    expanded: z.boolean().optional(),
  }).optional(),
});

export type ModelData = z.infer<typeof ModelDataSchema>;

export const isModelData = (data: AnyData): boolean => {
  if ('class_parent' in data && data.class_parent === 'ModelData') {
    return true;
  }
  return false;
}
