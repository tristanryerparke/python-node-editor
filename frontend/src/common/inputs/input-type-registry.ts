// eslint-disable react-refresh/only-export-components
import FloatInput from "./float-input";
import IntInput from "./int-input";
import StringInput from "./string-input";
import ImageInput from "./image-input";
import type { CustomInputProps } from "@/hooks/useInputField";

export interface InputRegistryEntry {
  main: React.ComponentType<CustomInputProps>;
  expanded?: boolean;
  expandable?: boolean;
}

// Type that supports both direct component and object pattern
export type InputRegistryValueType =
  | React.ComponentType<CustomInputProps>
  | InputRegistryEntry;

// Determine if a value is an object with properties (new pattern)
export function isObjectRegistryEntry(
  value: InputRegistryValueType
): value is InputRegistryEntry {
  return typeof value === "object" && "main" in value;
}

// Add more input types here
export const INPUT_TYPE_COMPONENT_REGISTRY: Record<
  string,
  InputRegistryValueType
> = {
  float: FloatInput,
  int: IntInput,
  str: StringInput,
  Image: ImageInput,
};
