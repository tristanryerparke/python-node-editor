import { memo } from "react";
import { NumberInput } from "../../components/ui/number-input";
import type { ControlledInputProps } from "../../components/custom-node/node-inputs/input-field-display";

export interface IntInputProps extends ControlledInputProps {
  placeholder?: string;
}

const IntInput = memo(function ControlledIntInput({
  value,
  onChange,
  disabled,
  valid = true,
  placeholder = "Enter integer",
}: IntInputProps) {
  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <NumberInput
        value={value as number | undefined}
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

export default IntInput;
