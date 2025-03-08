import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { BaseDataSchema } from './baseData';
import { AnyData } from './anyData';

// Zod Schemas
export const StringDataSchema = BaseDataSchema.extend({
  class_name: z.literal('StringData'),
  payload: z.string()
});

// Type Definitions
export type StringData = z.infer<typeof StringDataSchema>;

// Type Checking Functions
export function isStringData(data: AnyData): data is StringData {
  return data.class_name === 'StringData';
}

// Data Creation Functions
export function createStringData(stringValue: string): StringData {
  return {
    class_name: 'StringData',
    id: uuidv4(),
    payload: stringValue,
    metadata: {}
  };
}
