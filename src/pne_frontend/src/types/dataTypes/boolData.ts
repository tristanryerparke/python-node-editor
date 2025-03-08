import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { BaseDataSchema } from './baseData';
import { AnyData } from './anyData';

// Zod Schemas
export const BoolDataSchema = BaseDataSchema.extend({
  class_name: z.literal('BoolData'),
  payload: z.boolean()
});

// Type Definitions
export type BoolData = z.infer<typeof BoolDataSchema>;

// Type Checking Functions
export function isBoolData(data: AnyData): data is BoolData {
  return data.class_name === 'BoolData';
}

// Data Creation Functions
export function createBoolData(booleanValue: boolean): BoolData {
  return {
    class_name: 'BoolData',
    id: uuidv4(),
    payload: booleanValue,
    metadata: {}
  };
}