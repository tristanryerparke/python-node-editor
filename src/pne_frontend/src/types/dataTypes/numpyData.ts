import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { BaseDataSchema } from './baseData';
import { AnyData } from './anyData';

// Zod Schemas
export const NumpyDataSchema = BaseDataSchema.extend({
  class_name: z.literal('NumpyData'),
  payload: z.array(z.array(z.number())) // Assuming 2D array for simplicity
});

// Type Definitions
export type NumpyData = z.infer<typeof NumpyDataSchema>;

// Type Checking Functions
export function isNumpyData(data: AnyData): data is NumpyData {
  return data.class_name === 'NumpyData';
}
