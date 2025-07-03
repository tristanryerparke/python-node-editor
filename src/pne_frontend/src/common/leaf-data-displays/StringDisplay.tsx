import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { StringData } from "../../types/dataTypes/stringData";
import { updateNodeData } from "../../utils/nodeDataUtils";
import { useEdgeConnected } from "../../contexts/edgeConnectedContext";
import { AnyData } from "../../types/dataTypes/anyData";
import { Input } from "../../components/ui/input";
import SingleLineTextDisplay from "./SingleLineTextDisplay";

interface StringDisplayProps {
  path: (string | number)[];
  data: AnyData | null;
}

export default function StringDisplay({ path, data }: StringDisplayProps) {
  // Use the provided data directly
  const stringData = data as StringData | null;
  const [value, setValue] = useState<string | null>(stringData?.payload ?? null);
  
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
  if (stringData && value !== stringData.payload) {
    setValue(stringData.payload);
  }

  if (!stringData || stringData.payload === undefined) {
    return <SingleLineTextDisplay content="no data" dimmed={true} />;
  }

  if (!isInput) {
    return <SingleLineTextDisplay content={value === "" ? "(empty string)" : value} />;
  }

  return (
    <Input
      value={value ?? ''}
      onChange={(event) => {
        const newValue = event.currentTarget.value;
        setValue(newValue);
        
        // Only update node data if this is an input and the value actually changed
        if (isInput && newValue !== stringData.payload) {
          const newData = {
            ...stringData,
            id: uuidv4(),
            payload: newValue,
          } as StringData;
          updateNodeData({ path: [...path, 'data'], newData });
        }
      }}
      disabled={isConnected}
      className="nodrag nopan noscroll h-9 w-full"
      placeholder="Enter text"
    />
  );
}
