import { memo, useMemo, type NamedExoticComponent } from "react";
import useFlowStore from "../../stores/flowStore";
import { GenericSchemaCompactView } from "./generic-schema-input";
import { StringAreaView } from "../utility-components/string-area";
import { useControlledDebounce } from "@/hooks/useControlledDebounce";
import { useInputField, type CustomInputProps } from "@/hooks/useInputField";
import { useResizableHeight } from "@/hooks/useResizableHeight";
import { validateInputAgainstSchema } from "@/utils/schema-input-validator";

const encodeAsJsonString = (value: string) => JSON.stringify(value);
const valueToPlainText = (value: unknown): string =>
  typeof value === "string" ? value : "";

const DEFAULT_HEIGHT = 30;

export interface StringInputProps {
  value: string;
  onChange: (value: string) => void;
  onCommit?: (value: string) => void;
  disabled: boolean;
  valid?: boolean;
  expanded?: boolean;
  height: number;
  setHeight: (height: number) => void;
}

type StringInputComponent = NamedExoticComponent<StringInputProps> &
  NamedExoticComponent<CustomInputProps> & {
    expandable: true;
  };

type CombinedStringInputProps = StringInputProps | CustomInputProps;

function isNodeInputProps(
  props: CombinedStringInputProps,
): props is CustomInputProps {
  return "inputData" in props;
}

const ControlledStringInput = memo(function ControlledStringInput({
  value,
  onChange,
  onCommit,
  disabled,
  valid = true,
  expanded = false,
  height,
  setHeight,
}: StringInputProps) {
  if (expanded) {
    return (
      <StringAreaView
        value={value}
        onChange={onChange}
        onCommit={onCommit}
        editable={true}
        height={height}
        setHeight={setHeight}
        isInvalid={!valid}
        disabled={disabled}
      />
    );
  }

  return (
    <GenericSchemaCompactView
      value={value}
      onChange={onChange}
      onCommit={onCommit}
      disabled={disabled}
      valid={valid}
      placeholder="Enter text"
    />
  );
});

const ExpandedStringInput = memo(function ExpandedStringInput({
  inputData,
  path,
  disabled,
}: CustomInputProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const externalValue = valueToPlainText(inputData.value);
  const { height, setHeight } = useResizableHeight(path, DEFAULT_HEIGHT);

  const [value, setValue, commitValue] = useControlledDebounce(
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

  const isValid = useMemo(() => {
    const rawInput = encodeAsJsonString(value);
    return validateInputAgainstSchema(rawInput, inputData.type).valid;
  }, [value, inputData.type]);

  return (
    <ControlledStringInput
      value={value}
      onChange={setValue}
      onCommit={commitValue}
      disabled={disabled}
      valid={isValid}
      expanded={true}
      height={height}
      setHeight={setHeight}
    />
  );
});

const CompactStringInput = memo(function CompactStringInput({
  inputData,
  path,
  disabled,
}: CustomInputProps) {
  const { value, setValue } = useInputField(inputData, path);
  const displayValue = valueToPlainText(value);
  const isValid = useMemo(() => {
    const rawInput = encodeAsJsonString(displayValue);
    return validateInputAgainstSchema(rawInput, inputData.type).valid;
  }, [displayValue, inputData.type]);

  const handleChange = (nextValue: string) => {
    const rawInput = encodeAsJsonString(nextValue);
    const validationResult = validateInputAgainstSchema(rawInput, inputData.type);
    const valueToStore = validationResult.valid
      ? validationResult.value
      : nextValue;
    void setValue(valueToStore);
  };

  const handleCommit = (nextValue: string) => {
    const rawInput = encodeAsJsonString(nextValue);
    const validationResult = validateInputAgainstSchema(rawInput, inputData.type);
    const valueToStore = validationResult.valid
      ? validationResult.value
      : nextValue;
    void setValue(valueToStore, 0);
  };

  return (
    <ControlledStringInput
      value={displayValue}
      onChange={handleChange}
      onCommit={handleCommit}
      disabled={disabled}
      valid={isValid}
      height={DEFAULT_HEIGHT}
      setHeight={() => {}}
    />
  );
});

const StringInput = memo(function StringInput(props: CombinedStringInputProps) {
  if (isNodeInputProps(props)) {
    if (props.inputData._expanded) {
      return <ExpandedStringInput {...props} />;
    }

    return <CompactStringInput {...props} />;
  }

  return <ControlledStringInput {...props} />;
}) as StringInputComponent;

StringInput.expandable = true;

export default StringInput;
