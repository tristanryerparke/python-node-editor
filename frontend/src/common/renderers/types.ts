import type { TypeSchema } from "@/types/backend-schema";

export interface ControlledInputProps {
  value: unknown;
  onChange: (value: unknown, debounce?: number) => Promise<void> | void;
  disabled: boolean;
  expanded?: boolean;
  setValid?: (valid: boolean) => void;
  typeSchema?: TypeSchema;
}

export interface ControlledOutputProps {
  value: unknown;
  expanded?: boolean;
  typeSchema?: TypeSchema;
}
