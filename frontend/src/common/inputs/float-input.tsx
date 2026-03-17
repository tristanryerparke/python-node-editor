import { memo } from "react";
import { NumberInput } from "../../components/ui/number-input";
import { useInputField, type CustomInputProps } from "@/hooks/useInputField";

export interface FloatInputProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  disabled: boolean;
  valid?: boolean;
  placeholder?: string;
}

type CombinedFloatInputProps = FloatInputProps | CustomInputProps;

function isCustomInputProps(
  props: CombinedFloatInputProps,
): props is CustomInputProps {
  return "inputData" in props;
}

const ControlledFloatInput = memo(function ControlledFloatInput({
  value,
  onChange,
  disabled,
  valid = true,
  placeholder = "Enter float",
}: FloatInputProps) {
  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <NumberInput
        value={value}
        decimalScale={3}
        onValueChange={onChange}
        disabled={disabled}
        invalid={!valid}
        className="nodrag nopan nowheel"
        placeholder={placeholder}
      />
    </div>
  );
});

const StoreBackedFloatInput = memo(function StoreBackedFloatInput({
  inputData,
  path,
  disabled,
}: CustomInputProps) {
  const { value, setValue } = useInputField<number | undefined>(inputData, path);

  return (
    <ControlledFloatInput
      value={value}
      onChange={(nextValue) => {
        void setValue(nextValue);
      }}
      disabled={disabled}
    />
  );
});

const FloatInput = memo(function FloatInput(props: CombinedFloatInputProps) {
  if (isCustomInputProps(props)) {
    return <StoreBackedFloatInput {...props} />;
  }

  return <ControlledFloatInput {...props} />;
});

export default FloatInput;
