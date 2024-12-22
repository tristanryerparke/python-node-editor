import { v4 as uuidv4 } from 'uuid';
import { FieldData, InputNodeField } from "../../types/BaseDataTypes";


export const setFieldData = (
  fieldIndex: number,
  setField: ((index: number, field: InputNodeField) => void),
  field: InputNodeField,
  newFieldData: FieldData | null
) => {
  // Each time a field is updated, a new id is generated
  const fieldDataWithId = newFieldData ? {
    ...newFieldData,
    id: uuidv4()
  } : null;
  setField(fieldIndex, { ...field, data: fieldDataWithId } as InputNodeField);
}

export const setFieldMetadata = (
  fieldIndex: number,
  setField: ((index: number, field: InputNodeField) => void),
  field: InputNodeField,
  key: string,
  value: unknown
) => {
  if (!setField) return;
  
  setField(fieldIndex, {
    ...field,
    metadata: { ...field.metadata, [key]: value }
  });
};

export const formatImageMetadata = (metadata: Record<string, unknown>) => {
  return `${metadata.height} x ${metadata.width} (${metadata.type})`;
}

