import { memo, useEffect } from "react";
import NumberInput from "../../components/ui/number-input";
import type { ControlledInputProps } from "@/common/renderers/types";

export interface FloatInputProps extends ControlledInputProps {
  placeholder?: string;
}

function coerceFloatValue(value: number | undefined): number | undefined {
  return Number.isFinite(value) ? value : undefined;
}

const FloatInput = memo(function ControlledFloatInput({
  value,
  onChange,
  disabled,
  setValid,
  placeholder = "Enter float",
}: FloatInputProps) {
  const numericValue =
    typeof value === "number" && Number.isFinite(value) ? value : undefined;
  const isValueValid = numericValue !== undefined;
  const isInvalid = !isValueValid;

  useEffect(() => {
    setValid?.(isValueValid);
  }, [isValueValid, setValid]);

  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <NumberInput
        value={numericValue}
        onValueChange={(nextValue) => {
          void onChange(nextValue);
        }}
        disabled={disabled}
        invalid={isInvalid}
        placeholder={placeholder}
        decimalScale={3}
        coerceValue={coerceFloatValue}
      />
    </div>
  );
});

export default FloatInput;
