import { memo } from "react";
import StringInput, { type StringInputProps } from "./string-input";
import type { TypeExpr } from "@/types/backend-schema";
import { validateInputAgainstSchema } from "@/utils/schema-input-validator";

export interface GenericSchemaInputProps extends Omit<StringInputProps, "value"> {
  value: unknown;
  schema: TypeExpr;
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
  schema,
  placeholder = "Value",
  ...props
}: GenericSchemaInputProps) {
  return (
    <StringInput
      {...props}
      value={formatValue(value)}
      onChange={(nextValue) => {
        const rawValue = String(nextValue);
        const validationResult = validateInputAgainstSchema(rawValue, schema);

        if (validationResult.valid) {
          return props.onChange(validationResult.value);
        }

        return props.onChange(rawValue);
      }}
      placeholder={placeholder}
    />
  );
});
