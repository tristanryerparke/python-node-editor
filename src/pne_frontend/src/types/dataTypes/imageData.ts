import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

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

// Data Creation Functions
export function createImageData(payload: string): ImageData {
  if (!payload.startsWith('data:image/')) {
    throw new Error('Payload must be a base64 image string');
  }

  //TODO: TALK TO DA BACKEND and get back the object with cached, preview, description, width, height, image_type
  
  return {
    class_name: 'ImageData',
    id: uuidv4(),
    payload: payload,
    description: '',
    width: 0,
    height: 0,
    image_type: '',
    preview: ''
  };
}