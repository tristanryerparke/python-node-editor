import { NumberInput as MantineNumberInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useField } from "../../contexts/FieldContext";
import { createIntData, createFloatData } from "../../types/dataTypes/numberData";
import { useState, useEffect, useRef } from 'react';

export default function NumberInput() {
  const { field, updateField, index } = useField();
  const [value, setValue] = useState<number | undefined>(field.data.payload as number);
  const [debouncedValue] = useDebouncedValue(value, 100);
  const isInitialMount = useRef(true);

  const isIntOnly = field.allowed_types.length === 1 && field.allowed_types[0] === 'IntData';
  const isFloatOnly = field.allowed_types.length === 1 && field.allowed_types[0] === 'FloatData';

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (debouncedValue !== undefined && debouncedValue !== field.data.payload) {
      let newData;
      if (isIntOnly) {
        newData = createIntData(Math.round(debouncedValue));
      } else if (isFloatOnly) {
        newData = createFloatData(debouncedValue);
      } else {
        newData = Number.isInteger(debouncedValue) 
          ? createIntData(debouncedValue)
          : createFloatData(debouncedValue);
      }
      
      updateField({
        ...field,
        data: newData
      }, index);
    }
  }, [debouncedValue, field, updateField, index, isIntOnly, isFloatOnly]);

  return <MantineNumberInput 
    value={value}
    allowDecimal={!isIntOnly}
    fixedDecimalScale={!isIntOnly}
    decimalScale={!isIntOnly ? 3 : undefined}
    onChange={(val) => {
      if (typeof val === 'string') {
        setValue(val === '' ? undefined : isIntOnly ? Math.round(parseFloat(val)) : parseFloat(val));
      } else {
        setValue(isIntOnly ? Math.round(val) : val);
      }
    }}
  />;
}
