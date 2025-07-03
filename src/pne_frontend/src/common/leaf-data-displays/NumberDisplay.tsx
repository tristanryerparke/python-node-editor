import { Flex, NumberInput as MantineNumberInput, Text } from "@mantine/core";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { IntData, FloatData } from "../../types/dataTypes/numberData";
import { updateNodeData } from "../../utils/nodeDataUtils";
import { useEdgeConnected } from "../../contexts/edgeConnectedContext";

interface NumberDisplayProps {
  path: (string | number)[];
  data: IntData | FloatData | null;
}

export default function NumberDisplay({ path, data }: NumberDisplayProps) {
  // Data is directly the number data itself
  const numberData = data as IntData | FloatData;
  const [value, setValue] = useState<number | null>(numberData?.payload ?? null);
  
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
  if (numberData && value !== numberData.payload) {
    setValue(numberData.payload);
  }

<<<<<<< Updated upstream
  if (!numberData || numberData.payload === undefined) {
    return (
      <Flex className="basic-output" w='100%' miw='20px' style={{ flexGrow: 1 }}>
        <Text pr={10} size="xs" c="dimmed">no data</Text>
      </Flex>
    );
  }

=======
>>>>>>> Stashed changes
  if (!isInput) {
    return (
      <Flex className="basic-output" w='100%' miw='20px' style={{ flexGrow: 1 }}>
        <Text pr={10} size="xs">{value}</Text>
      </Flex>
    );
  }

  return (
    <MantineNumberInput
      value={value ?? undefined}
      size="xs"
      w='100%'
      onChange={(val) => {
        const newValue = (val as number) ?? 0;
        setValue(newValue);
        
        // Only update node data if this is an input and the value actually changed
        if (isInput && newValue !== numberData.payload) {
          const isFloat = newValue % 1 !== 0;
          const newData = {
            ...numberData,
            id: uuidv4(),
            payload: newValue,
            class_name: isFloat ? "FloatData" : "IntData",
          } as IntData | FloatData;
          // update just the data property at the current path
          updateNodeData({ path: [...path, 'data'], newData: newData });
        }
      }}
      allowDecimal={true}
      decimalScale={3}
      disabled={isConnected}
    />
  );
}

