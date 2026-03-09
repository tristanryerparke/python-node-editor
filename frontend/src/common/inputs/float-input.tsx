import { memo, useMemo } from "react";
import { NumberInput } from "../../components/ui/number-input";
import { useInputField, type CustomInputProps } from "@/hooks/useInputField";
import { validateValueAgainstSchema } from "@/utils/schema-input-validator";

export default memo(function FloatInput({ inputData, path }: CustomInputProps) {
  const { value, setValue, disabled } = useInputField<number | undefined>(
    inputData,
    path,
  );

  const validationResult = useMemo(() => {
    if (value === undefined) {
      return { valid: true as const, value: undefined };
    }
    return validateValueAgainstSchema(value, inputData.type);
  }, [inputData.type, value]);

  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <NumberInput
        value={value}
        decimalScale={3}
        onValueChange={setValue}
        onBlur={() => setValue(value, 0)}
        disabled={disabled}
        invalid={!validationResult.valid}
        className="nodrag nopan nowheel"
        placeholder="Enter float"
      />
    </div>
  );
});
