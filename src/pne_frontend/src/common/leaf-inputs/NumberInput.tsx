import { Flex, NumberInput as MantineNumberInput, Text } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { IntData, FloatData } from "../../types/dataTypes/numberData";
import { updateNodeData } from "../../utils/updateNodeData";

interface NumberInputProps {
  path: (string | number)[];
  data: IntData | FloatData;
}

export default function NumberInput({ path, data }: NumberInputProps) {
  const [value, setValue] = useState<number>(data.payload);
  const [debouncedValue] = useDebouncedValue(value, 200);

  useEffect(() => {
    setValue(data.payload);
  }, [data.payload]);

  useEffect(() => {
    // only update the node data if the value has changed and the node is an input
    if (debouncedValue !== data.payload && path.includes('inputs')) {
      const isFloat = debouncedValue % 1 !== 0;
      const newData = {
        ...data,
        id: uuidv4(),
        payload: debouncedValue,
        class_name: isFloat ? "FloatData" : "IntData",
      } as IntData | FloatData;
      updateNodeData({ path: [...path, 'data'], newData });
    }
  }, [debouncedValue, data, path]);


  return (
    path[1] != 'outputs' ? (
      <MantineNumberInput
        value={value}
        size="xs"
        onChange={(val) => setValue((val as number) ?? 0)}
        allowDecimal={true}
        decimalScale={3}
      />
    ) : (
      <Flex className="basic-output" >
        <Text pr={10} size="xs">{value}</Text>
      </Flex>
    )
  );
}

