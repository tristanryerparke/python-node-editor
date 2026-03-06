import { memo, useMemo } from "react";
import { useNodeConnections } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { useControlledDebounce } from "@/hooks/useControlledDebounce";
import { cn } from "@/lib/utils";
import useFlowStore from "@/stores/flowStore";
import type { DataWrapper } from "@/types/backend-schema";
import { validateInputAgainstSchema } from "@/utils/schema-input-validator";
import { formatTypeForDisplay } from "@/utils/type-formatting";

export type DisplayToRawInput = (displayValue: string) => string;
export type ValueToDisplay = (value: unknown) => string;

interface GenericSchemaInputProps {
  inputData: DataWrapper;
  path: (string | number)[];
  placeholder?: string;
  displayToRawInput?: DisplayToRawInput;
  valueToDisplay?: ValueToDisplay;
}

export const defaultValueToDisplay: ValueToDisplay = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const defaultDisplayToRawInput: DisplayToRawInput = (value) => value;

export default memo(function GenericSchemaInput({
  inputData,
  path,
  placeholder,
  displayToRawInput = defaultDisplayToRawInput,
  valueToDisplay = defaultValueToDisplay,
}: GenericSchemaInputProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const externalValue = valueToDisplay(inputData.value);

  const [value, setValue] = useControlledDebounce(
    externalValue,
    (debouncedValue) => {
      const rawInput = displayToRawInput(debouncedValue);
      const validationResult = validateInputAgainstSchema(rawInput, inputData.type);
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
    const rawInput = displayToRawInput(value);
    return validateInputAgainstSchema(rawInput, inputData.type);
  }, [displayToRawInput, inputData.type, value]);
  const resolvedPlaceholder = placeholder ?? formatTypeForDisplay(inputData.type);

  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  const connections = useNodeConnections({
    handleType: "target",
    handleId: handleId,
  });
  const isConnected =
    connections.length > 0 && connections[0].targetHandle === handleId;

  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => setValue(e.target.value)}
        disabled={isConnected}
        className={cn(
          "nodrag nopan nowheel",
          !validationResult.valid &&
            "border-destructive focus-visible:border-destructive",
        )}
        placeholder={resolvedPlaceholder}
      />
    </div>
  );
});
