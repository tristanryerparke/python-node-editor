import { z } from 'zod';

import { BaseDataSchema } from './baseData';
import { AnyData } from './anyData';

// Zod Schemas
export const ListDataSchema = BaseDataSchema.extend({
  class_name: z.literal('ListData'),
  payload: z.array(BaseDataSchema)
});

// Type Definitions
export type ListData = z.infer<typeof ListDataSchema>;

// Type Checking Functions
export function isListData(data: AnyData): data is ListData {
  return data.class_name === 'ListData';
}
