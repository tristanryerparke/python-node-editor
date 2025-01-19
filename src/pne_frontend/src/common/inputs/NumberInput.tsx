import { NumberInput as MantineNumberInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useField } from "../../contexts/FieldContext";
import { createIntData, createFloatData, FloatData, IntData } from "../../types/dataTypes/numberData";
import { useState, useEffect, useRef } from 'react';
import { useDataUpdate } from "../../contexts/inputDataContext";

interface NumberInputProps {
  oldData: FloatData | IntData
}

export default function NumberInput({ oldData }: NumberInputProps) {
  const { field } = useField();
  const { updateData } = useDataUpdate();
  const [value, setValue] = useState<number | null>(oldData.payload as number);
  const [debouncedValue] = useDebouncedValue(value, 100);
  const isInitialMount = useRef(true);


  // Watch for changes in the debounced value and update the data
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Check for null explicitly
    if (debouncedValue !== null && debouncedValue !== oldData.payload) {
      const newData = Number.isInteger(debouncedValue)
        ? createIntData(debouncedValue)
        : createFloatData(debouncedValue);
      updateData(newData);
    }
  }, [debouncedValue, updateData, oldData.payload]);

  return <MantineNumberInput
    value={value}
    size='xs'
    disabled={field.is_edge_connected}
    onChange={(val) => setValue(val as number)}
  />;
}
