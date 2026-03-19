import { memo, useEffect } from "react";
import IntegerInput from "../../components/ui/integer-input";
import type { ControlledInputProps } from "../../components/custom-node/node-inputs/input-field-display";

export interface IntInputProps extends ControlledInputProps {
  placeholder?: string;
}

const IntInput = memo(function ControlledIntInput({
  value,
  onChange,
  disabled,
  setValid,
  placeholder = "Enter integer",
}: IntInputProps) {
  const numericValue =
    typeof value === "number" && Number.isInteger(value) ? value : undefined;
  const isValueValid = numericValue !== undefined;
  const isInvalid = !isValueValid;

  useEffect(() => {
    setValid?.(isValueValid);
  }, [isValueValid, setValid]);

  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <IntegerInput
        value={numericValue}
        onValueChange={(nextValue) => {
          void onChange(nextValue);
        }}
        disabled={disabled}
        invalid={isInvalid}
        placeholder={placeholder}
      />
    </div>
  );
});

export default IntInput;
