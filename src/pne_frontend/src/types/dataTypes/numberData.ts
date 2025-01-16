import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { BaseDataSchema } from './baseData';
import { AnyData } from './anyData';


// Zod Schemas
export const FloatDataSchema = BaseDataSchema.extend({
  class_name: z.literal('FloatData'),
  payload: z.number()
});

export const IntDataSchema = BaseDataSchema.extend({
  class_name: z.literal('IntData'),
  payload: z.number()
});

// Type Definitions
export type FloatData = z.infer<typeof FloatDataSchema>;
export type IntData = z.infer<typeof IntDataSchema>;

// Type Checking Functions
export function isFloatData(data: AnyData): data is FloatData {
  return data.class_name === 'FloatData';
}

export function isIntData(data: AnyData): data is IntData {
  return data.class_name === 'IntData';
}

// Data Creation Functions
export function createFloatData(numberValue: number): FloatData {
  return {
    class_name: 'FloatData',
    id: uuidv4(),
    payload: numberValue
  };
}

export function createIntData(numberValue: number): IntData {
  return {
    class_name: 'IntData',
    id: uuidv4(),
    payload: numberValue
  };
}
