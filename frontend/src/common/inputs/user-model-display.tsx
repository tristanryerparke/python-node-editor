import SingleLineTextDisplay from "../utility-components/single-line-text-display";
import { type TypeInfo } from "@/stores/typesStore";
import { useNodeConnections } from "@xyflow/react";

interface UserModelDisplayProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputData: any;
  path: (string | number)[];
  typeInfo: TypeInfo;
}

export default function UserModelDisplay({
  inputData,
  path,
}: UserModelDisplayProps) {
  // Use the xyflow hook to check if input is connected
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  const connections = useNodeConnections({
    id: String(path[0]),
    handleType: "target",
    handleId: handleId,
  });

  // Determine if connected based on connections array
  const isConnected =
    connections.length > 0 && connections[0].targetHandle === handleId;

  const formatValue = () => {
    if (!inputData?.value || typeof inputData.value !== "object") {
      return inputData?.type || "Unknown";
    }

    const typeName = inputData.type || "Object";
    const fields = Object.entries(inputData.value)
      .map(([key, value]) => `${key}=${value}`)
      .join(", ");

    return `${typeName}(${fields})`;
  };

  return (
    <SingleLineTextDisplay
      content={formatValue()}
      dimmed={!inputData?.value}
      disabled={isConnected}
    />
  );
}
