import { NumberInput, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useState, useEffect, useRef } from 'react';
import { BaseData } from './DataTypes';
import { CreateDataObject } from './dataCreation';

export interface InputField {
  data: BaseData | null;
  allowed_types: string[];
  input_display_generate: string;
  display_type: string;
}
  
interface InputProps {
  field: InputField;
  onUpdate: (field: InputField, value: number | string) => void;
}

export function IntInput({ field, onUpdate }: InputProps) {
  const [value, setValue] = useState<number | undefined>(field.data?.payload as number);
  const [debouncedValue] = useDebouncedValue(value, 200);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (debouncedValue !== undefined) {
      onUpdate(field, debouncedValue);
    }
  }, [debouncedValue, field, onUpdate]);

  return <NumberInput 
    value={value}
    onChange={(val) => {
      setValue(typeof val === 'string' ? (val === '' ? undefined : parseInt(val)) : val);
    }}
    step={1}
  />;
}

export function StringInput({ field, onUpdate }: InputProps) {
  
  // if the data is null, create a new StringData object with an empty string payload
  if (field.data === null) {
    field.data = CreateDataObject('StringData', '');
  }

  const [value, setValue] = useState<string>(field.data.payload as string);
  const [debouncedValue] = useDebouncedValue(value, 200);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onUpdate(field, debouncedValue);
  }, [debouncedValue, field, onUpdate]);

  return <TextInput 
    value={value} 
    onChange={(event) => setValue(event.currentTarget.value)}
  />;
}

