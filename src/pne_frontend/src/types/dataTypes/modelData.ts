import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Zod Schemas
export const ModelDataSchema = z.object({
  class_parent: z.literal('ModelData'),
  class_name: z.string(),   
  id: z.string(),
});

export type ModelData = z.infer<typeof ModelDataSchema>;