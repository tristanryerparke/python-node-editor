import { memo, useMemo, type NamedExoticComponent } from "react";
import useFlowStore from "../../stores/flowStore";
import GenericSchemaInput from "./generic-schema-input";
import StringArea from "../utility-components/string-area";
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
  disabled,
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

  return (
    <StringArea
      value={value}
      onChange={setValue}
      editable={true}
      path={path}
      defaultHeight={DEFAULT_HEIGHT}
      isInvalid={isInvalid}
      isConnected={disabled}
    />
  );
});

type StringInputComponent = NamedExoticComponent<CustomInputProps> & {
  expandable: true;
};

// Editable input – compact when collapsed, textarea when expanded
const StringInput = memo(function StringInput({
  inputData,
  path,
  disabled,
}: CustomInputProps) {
  if (inputData._expanded) {
    return <InputStringArea inputData={inputData} path={path} disabled={disabled} />;
  }

  return (
    <GenericSchemaInput
      inputData={inputData}
      path={path}
      disabled={disabled}
      placeholder="Enter text"
      displayToRawInput={encodeAsJsonString}
      valueToDisplay={valueToPlainText}
    />
  );
}) as StringInputComponent;

StringInput.expandable = true;

export default StringInput;
