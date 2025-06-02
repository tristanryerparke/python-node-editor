import { NumberInput as MantineNumberInput } from "@mantine/core";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { IntData, FloatData } from "../../types/dataTypes/numberData";
import { updateNodeData } from "../../utils/nodeDataUtils";
import { useEdgeConnected } from "../../contexts/edgeConnectedContext";
import SingleLineTextDisplay from "./SingleLineTextDisplay";

interface NumberDisplayProps {
  path: (string | number)[];
  data: IntData | FloatData | null;
}

// Helper function to create number data objects
const createNumberData = (baseData: IntData | FloatData, newValue: number): IntData | FloatData => {
  const isFloat = newValue % 1 !== 0;
  return {
    ...baseData,
    id: uuidv4(),
    payload: newValue,
    class_name: isFloat ? "FloatData" : "IntData",
  } as IntData | FloatData;
};

export default function NumberDisplay({ path, data }: NumberDisplayProps) {
  // Data is directly the number data itself
  const numberData = data as IntData | FloatData;
  const [value, setValue] = useState<number | string | null>(numberData?.payload ?? null);
  
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

  if (!numberData || numberData.payload === undefined) {
    return <SingleLineTextDisplay content="no data" dimmed={true} />;
  }

  if (!isInput) {
    return <SingleLineTextDisplay content={value} />;
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
          const newData = createNumberData(numberData, newValue);
          // update just the data property at the current path
          updateNodeData({ path: [...path, 'data'], newData: newData });
        }
      }}
      onBlur={() => {
        if (value === "") {
          setValue(0);
          const newData = createNumberData(numberData, 0);
          updateNodeData({ path: [...path, 'data'], newData: newData });
        }
      }}
      allowDecimal={true}
      decimalScale={3}
      disabled={isConnected}
    />
  );
}

