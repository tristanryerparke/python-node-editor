import { z } from 'zod';

import { BaseDataSchema } from './baseData';
import { AnyData } from './anyData';

// Zod Schemas
export const ImageDataSchema = BaseDataSchema.extend({
  class_name: z.literal('ImageData'),
  payload: z.string(),
  description: z.string(),
  width: z.number(),
  height: z.number(),
  image_type: z.string(),
  preview: z.string()
});

// Type Definitions
export type ImageData = z.infer<typeof ImageDataSchema>;

// Type Checking Functions
export function isImageData(data: AnyData): data is ImageData {
  return data.class_name === 'ImageData';
}
