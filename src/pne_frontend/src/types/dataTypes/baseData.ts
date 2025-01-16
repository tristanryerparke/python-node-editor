import { z } from 'zod';

// Zod Schemas
export const BaseDataSchema = z.object({
  class_name: z.string(),
  id: z.string(),
  payload: z.unknown()
});

// Type Definitions
export type BaseData = z.infer<typeof BaseDataSchema>;

