import type { ComponentType } from "react";
import FloatInput from "./float-input";
import IntInput from "./int-input";
import StringInput from "./string-input";
import type { ControlledInputProps } from "@/common/renderers/types";

export interface InputRegistryEntry {
  component: ComponentType<ControlledInputProps>;
  expandedComponent?: ComponentType<ControlledInputProps>;
  expandable: boolean;
  defaultExpandedHeight?: number;
  minExpandedHeight?: number;
  maxExpandedHeight?: number;
}

export const INPUT_TYPE_COMPONENT_REGISTRY: Record<string, InputRegistryEntry> =
  {
    float: { component: FloatInput, expandable: false },
    int: { component: IntInput, expandable: false },
    str: { component: StringInput, expandable: true },
  };

export function registerInputRenderer(
  typeName: string,
  entry: InputRegistryEntry,
): void {
  INPUT_TYPE_COMPONENT_REGISTRY[typeName] = entry;
}

export function getInputRenderer(
  typeName: string,
): InputRegistryEntry | undefined {
  return INPUT_TYPE_COMPONENT_REGISTRY[typeName];
}
