import { memo, useEffect } from "react";
import { StringArea } from "../utility-components/string-area";
import type { ControlledInputProps } from "@/common/renderers/types";
import { Input } from "t-components/input";
import useFlowStore from "@/stores/flowStore";
import type { TypeSchema } from "@/types/backend-schema";
import { validateInputAgainstSchema } from "@/utils/schema-input-validator";

export interface GenericSchemaInputProps extends ControlledInputProps {
  schema?: TypeSchema;
  placeholder?: string;
  rightButton?: React.ReactNode;
}

function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return "";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default memo(function GenericSchemaInput({
  value,
  onChange,
  disabled,
  expanded = false,
  setValid,
  typeSchema,
  schema,
  placeholder = "Value",
  rightButton,
}: GenericSchemaInputProps) {
  const types = useFlowStore((state) => state.types);
  const rawValue = formatValue(value);
  const effectiveSchema = typeSchema ?? schema;
  const isValid =
    !effectiveSchema ||
    validateInputAgainstSchema(rawValue, effectiveSchema, types).valid;
  const isInvalid = !isValid;

  useEffect(() => {
    setValid?.(isValid);
  }, [isValid, setValid]);

  const handleChange = (nextValue: string) => {
    const nextRawValue = String(nextValue);

    if (!effectiveSchema) {
      void onChange(nextRawValue);
      return;
    }

    const validationResult = validateInputAgainstSchema(
      nextRawValue,
      effectiveSchema,
      types,
    );

    if (validationResult.valid) {
      void onChange(validationResult.value);
      return;
    }

    void onChange(nextRawValue);
  };

  if (expanded) {
    return (
      <StringArea
        value={rawValue}
        onChange={handleChange}
        editable={true}
        placeholder={placeholder}
        isInvalid={!disabled && isInvalid}
        disabled={disabled}
      />
    );
  }

  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel gap-1">
      <Input
        type="text"
        value={rawValue}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        aria-invalid={!disabled && isInvalid}
        className="nodrag nopan nowheel flex-1 min-w-0"
        placeholder={placeholder}
      />
      {rightButton ? <div className="shrink-0">{rightButton}</div> : null}
    </div>
  );
});
