import { z } from 'zod';

// Zod Schemas
export const BaseDataSchema = z.object({
  class_name: z.string(),
  id: z.string(),
  metadata: z.record(z.string(), z.any()),
});

// Type Definitions
export type BaseData = z.infer<typeof BaseDataSchema>;

