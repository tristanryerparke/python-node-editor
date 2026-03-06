import { memo, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { useInputField } from "@/hooks/useInputField";
import { cn } from "@/lib/utils";
import type { FrontendFieldDataWrapper } from "@/types/types";
import { validateInputAgainstSchema } from "@/utils/schema-input-validator";
import { formatTypeForDisplay } from "@/utils/type-formatting";

export type DisplayToRawInput = (displayValue: string) => string;
export type ValueToDisplay = (value: unknown) => string;

interface GenericSchemaInputProps {
  inputData: FrontendFieldDataWrapper;
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
  const { value, setValue, disabled } = useInputField(inputData, path);

  const preprocess = useCallback(
    (text: string) => {
      const rawInput = displayToRawInput(text);
      const result = validateInputAgainstSchema(rawInput, inputData.type);
      return result.valid ? result.value : text;
    },
    [displayToRawInput, inputData.type],
  );

  const displayValue = useMemo(() => valueToDisplay(value), [value, valueToDisplay]);

  const validationResult = useMemo(() => {
    const rawInput = displayToRawInput(displayValue);
    return validateInputAgainstSchema(rawInput, inputData.type);
  }, [displayToRawInput, inputData.type, displayValue]);
  const resolvedPlaceholder = placeholder ?? formatTypeForDisplay(inputData.type);

  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <Input
        type="text"
        value={displayValue}
        onChange={(e) => setValue(preprocess(e.target.value))}
        onBlur={() => setValue(preprocess(displayValue), 0)}
        disabled={disabled}
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
