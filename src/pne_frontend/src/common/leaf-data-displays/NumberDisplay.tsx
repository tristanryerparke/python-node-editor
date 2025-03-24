import { Flex, NumberInput as MantineNumberInput, Text } from "@mantine/core";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { IntData, FloatData } from "../../types/dataTypes/numberData";
import { updateNodeData, getNodeData } from "../../utils/updateNodeData";
import { useEdgeConnected } from "../../contexts/edgeConnectedContext";

interface NumberDisplayProps {
  path: (string | number)[];
  data: IntData | FloatData;
}

export default function NumberDisplay({ path, data }: NumberDisplayProps) {
  const [value, setValue] = useState<number>(data.payload);
  
  // Only check edge connected state for inputs
  const isInput = path[1] === 'inputs';
  let isConnected = false;
  try {
    const context = useEdgeConnected();
    isConnected = isInput ? context.isConnected : false;
  } catch {
    // If we're not within the provider (outputs), ignore the error
  }

  // Update local state when data changes from flow execution
  if (value !== data.payload) {
    setValue(data.payload);
  }

  return (
    !isInput ? (
      // if the display is an output, return a non-editable text display of the value
      <Flex className="basic-output" w='100%' style={{ flexGrow: 1 }}>
        <Text pr={10} size="xs">{value}</Text>
      </Flex>
    ) : (
      // if the display is an input, return an editable number input
      <MantineNumberInput
        value={value}
        size="xs"
        w='100%'
        onChange={(val) => {
          const newValue = (val as number) ?? 0;
          setValue(newValue);
          
          // Only update node data if this is an input and the value actually changed
          if (isInput && newValue !== data.payload) {
            const isFloat = newValue % 1 !== 0;
            const newData = {
              ...data,
              id: uuidv4(),
              payload: newValue,
              class_name: isFloat ? "FloatData" : "IntData",
            } as IntData | FloatData;
            updateNodeData({ path: [...path, 'data'], newData });
          }
        }}
        allowDecimal={true}
        decimalScale={3}
        disabled={isConnected}
      />
    )
  );
}

