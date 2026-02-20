import { memo } from "react";
import { Input } from "../../components/ui/input";
import useFlowStore, { useNodeData } from "../../stores/flowStore";
import { useNodeConnections } from "@xyflow/react";
import { useControlledDebounce } from "../../hooks/useControlledDebounce";
import type { DataWrapper, FrontendFieldDataWrapper } from "@/types/types";

interface StringInputProps {
  inputData: DataWrapper;
  path: (string | number)[];
}

export default memo(function StringInput({
  inputData,
  path,
}: StringInputProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Use current value if it exists, otherwise use default_value, otherwise empty string
  const externalValue =
    typeof inputData.value === "string" ? inputData.value : "";

  // Use controlled debounce - updates store only on user input, not external updates
  const [value, setValue] = useControlledDebounce(
    externalValue,
    (debouncedValue) => {
      void updateNodeData([...path, "value"], debouncedValue, {
        fromUser: true,
      });
    },
    200,
  );

  // Use the xyflow hook to check if input is connected
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  const connections = useNodeConnections({
    handleType: "target",
    handleId: handleId,
  });

  // Determine if connected based on connections array
  const isConnected =
    connections.length > 0 && connections[0].targetHandle === handleId;

  // Check if expanded view is active
  const fieldData = useNodeData(path) as FrontendFieldDataWrapper | undefined;
  const isExpanded = fieldData?._expanded ?? false;

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  // Render transparent div when expanded
  if (isExpanded) {
    return <div className="h-9 flex-1 bg-transparent" />;
  }

  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <Input
        type="text"
        value={value}
        onChange={handleValueChange}
        onBlur={(e) => setValue(e.target.value)}
        disabled={isConnected}
        className="nodrag nopan nowheel"
        placeholder="Enter text"
      />
    </div>
  );
});
