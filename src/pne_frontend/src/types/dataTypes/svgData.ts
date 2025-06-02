import { StringDataSchema } from './stringData';
import { z } from 'zod';

export const SvgDataSchema = StringDataSchema.extend({
  class_name: z.literal('SvgData'),
  payload: z.string(),
});

export type SvgData = z.infer<typeof SvgDataSchema>;