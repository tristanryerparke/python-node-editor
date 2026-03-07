import { memo, useMemo } from "react";
import { useNodeConnections } from "@xyflow/react";
import useFlowStore, { useNodeData } from "../../stores/flowStore";
import GenericSchemaInput from "./generic-schema-input";
import StringArea from "./string-area";
import { useControlledDebounce } from "@/hooks/useControlledDebounce";
import { validateInputAgainstSchema } from "@/utils/schema-input-validator";
import type { CustomInputProps } from "@/hooks/useInputField";

const encodeAsJsonString = (value: string) => JSON.stringify(value);
const valueToPlainText = (value: unknown): string =>
  typeof value === "string" ? value : "";

const DEFAULT_HEIGHT = 30;

// Sub-component that owns the debounce + validation state for the editable textarea
const InputStringArea = memo(function InputStringArea({
  inputData,
  path,
}: CustomInputProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const externalValue = valueToPlainText(inputData.value);

  const [value, setValue] = useControlledDebounce(
    externalValue,
    (debouncedValue) => {
      const rawInput = encodeAsJsonString(debouncedValue);
      const validationResult = validateInputAgainstSchema(rawInput, inputData.type);
      const valueToStore = validationResult.valid
        ? validationResult.value
        : debouncedValue;
      void updateNodeData([...path, "value"], valueToStore, { fromUser: true });
    },
    200,
  );

  const isInvalid = useMemo(() => {
    const rawInput = encodeAsJsonString(value);
    return !validateInputAgainstSchema(rawInput, inputData.type).valid;
  }, [value, inputData.type]);

  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  const connections = useNodeConnections({ handleType: "target", handleId });
  const isConnected =
    connections.length > 0 && connections[0].targetHandle === handleId;

  const storedHeight = useNodeData([...path, "_expandedHeight"]) as
    | number
    | undefined;
  const height = storedHeight ?? DEFAULT_HEIGHT;
  const setHeight = (h: number) =>
    void updateNodeData([...path, "_expandedHeight"], h);

  return (
    <StringArea
      value={value}
      onChange={setValue}
      editable={true}
      height={height}
      setHeight={setHeight}
      isInvalid={isInvalid}
      isConnected={isConnected}
    />
  );
});

// Editable input – compact when collapsed, textarea when expanded
export default memo(function StringInput({ inputData, path }: CustomInputProps) {
  if (inputData._expanded) {
    return <InputStringArea inputData={inputData} path={path} />;
  }

  return (
    <GenericSchemaInput
      inputData={inputData}
      path={path}
      placeholder="Enter text"
      displayToRawInput={encodeAsJsonString}
      valueToDisplay={valueToPlainText}
    />
  );
});
