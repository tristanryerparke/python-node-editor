import { BaseData } from './DataTypes';
import { v4 as uuidv4 } from 'uuid';
import { IntDataSchema, StringDataSchema, FloatDataSchema, BoolDataSchema } from './DataTypes';

export function CreateDataObject(class_name: string, payload: unknown): BaseData {
  const rawData = {
    class_name,
    payload,
    id: uuidv4()
  };

  switch (class_name) {
    case 'IntData':
      return IntDataSchema.parse(rawData);
    case 'StringData':
      return StringDataSchema.parse(rawData);
    case 'FloatData':
      return FloatDataSchema.parse(rawData);
    case 'BoolData':
      return BoolDataSchema.parse(rawData);
    default:
      throw new Error(`Unsupported class_name: ${class_name}`);
  }
}