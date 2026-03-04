import { memo, useMemo } from "react";
import { NumberInput } from "../../components/ui/number-input";
import useFlowStore from "../../stores/flowStore";
import { useNodeConnections } from "@xyflow/react";
import { useControlledDebounce } from "../../hooks/useControlledDebounce";
import type { DataWrapper } from "@/types/types";
import { validateValueAgainstSchema } from "@/utils/schema-input-validator";

interface IntInputProps {
  inputData: DataWrapper;
  path: (string | number)[];
}

export default memo(function IntInput({ inputData, path }: IntInputProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Use current value if it exists, otherwise use default_value, otherwise undefined
  const externalValue =
    typeof inputData.value === "number" ? inputData.value : undefined;

  // Use controlled debounce - updates store only on user input, not external updates
  const [value, setValue] = useControlledDebounce(
    externalValue,
    (debouncedValue) => {
      const validationResult =
        debouncedValue === undefined
          ? { valid: true as const, value: undefined }
          : validateValueAgainstSchema(debouncedValue, inputData.type);

      const valueToStore = validationResult.valid
        ? validationResult.value
        : debouncedValue;

      void updateNodeData([...path, "value"], valueToStore, {
        fromUser: true,
      });
    },
    200,
  );

  const validationResult = useMemo(() => {
    if (value === undefined) {
      return { valid: true as const, value: undefined };
    }

    return validateValueAgainstSchema(value, inputData.type);
  }, [inputData.type, value]);

  // Use the xyflow hook to check if input is connected
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  const connections = useNodeConnections({
    handleType: "target",
    handleId: handleId,
  });

  // Determine if connected based on connections array
  const isConnected =
    connections.length > 0 && connections[0].targetHandle === handleId;

  const handleValueChange = (newValue: number | undefined) => {
    // Round to nearest integer for int inputs
    const intValue = newValue !== undefined ? Math.round(newValue) : undefined;
    setValue(intValue);
  };

  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <NumberInput
        value={value}
        decimalScale={0}
        onValueChange={handleValueChange}
        onBlur={() => handleValueChange(value)}
        disabled={isConnected}
        invalid={!validationResult.valid}
        className="nodrag nopan nowheel"
        placeholder="Enter integer"
      />
    </div>
  );
});
