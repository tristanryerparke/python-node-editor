import { memo } from "react";
import { NumberInput } from "../../components/ui/number-input";
import { useInputField, type CustomInputProps } from "@/hooks/useInputField";


/// WHY ARE WE STILL UYSNG useInputFIeld in here!!!!

export interface IntInputProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  disabled: boolean;
  valid?: boolean;
  placeholder?: string;
}

type CombinedIntInputProps = IntInputProps | CustomInputProps;

function isCustomInputProps(
  props: CombinedIntInputProps,
): props is CustomInputProps {
  return "inputData" in props;
}

const ControlledIntInput = memo(function ControlledIntInput({
  value,
  onChange,
  disabled,
  valid = true,
  placeholder = "Enter integer",
}: IntInputProps) {
  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <NumberInput
        value={value}
        decimalScale={0}
        onValueChange={onChange}
        disabled={disabled}
        invalid={!valid}
        className="nodrag nopan nowheel"
        placeholder={placeholder}
      />
    </div>
  );
});

const StoreBackedIntInput = memo(function StoreBackedIntInput({
  inputData,
  path,
  disabled,
}: CustomInputProps) {
  const { value, setValue } = useInputField<number | undefined>(inputData, path);

  return (
    <ControlledIntInput
      value={value}
      onChange={(nextValue) => {
        void setValue(
          nextValue !== undefined ? Math.round(nextValue) : undefined,
        );
      }}
      disabled={disabled}
    />
  );
});

const IntInput = memo(function IntInput(props: CombinedIntInputProps) {
  if (isCustomInputProps(props)) {
    return <StoreBackedIntInput {...props} />;
  }

  return <ControlledIntInput {...props} />;
});

export default IntInput;
