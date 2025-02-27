import { NumberInput as MantineNumberInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { IntData, FloatData } from "../../types/dataTypes/numberData";

interface NumberInputProps {
  data: IntData | FloatData;
  path: (string | number)[];
  onChange: (path: (string | number)[], newData: IntData | FloatData) => void;
}

export default function NumberInput({ data, path, onChange }: NumberInputProps) {
  const [value, setValue] = useState<number>(data.payload);
  const [debouncedValue] = useDebouncedValue(value, 200);

  useEffect(() => {
    setValue(data.payload);
  }, [data.payload]);

  useEffect(() => {
    if (debouncedValue !== data.payload) {
      const isFloat = debouncedValue % 1 !== 0;
      const newData = {
        ...data,
        id: uuidv4(),
        payload: debouncedValue,
        class_name: isFloat ? "FloatData" : "IntData",
      } as IntData | FloatData;
      onChange(path, newData);
    }
  }, [debouncedValue, data, path, onChange]);

  return (
    <MantineNumberInput
      key={debouncedValue as number}
      value={value}
      size="xs"
      onChange={(val) => setValue((val as number) ?? 0)}
      allowDecimal={true}
      decimalScale={3}
    />
  );
}
