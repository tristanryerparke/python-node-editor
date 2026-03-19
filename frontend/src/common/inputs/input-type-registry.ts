import type { ComponentType } from "react";
import FloatInput from "./float-input";
import IntInput from "./int-input";
import StringInput from "./string-input";
import ImageInput from "./image-input";
import type { ControlledInputProps } from "@/components/custom-node/node-inputs/input-field-display";

export interface InputRegistryEntry {
  component: ComponentType<ControlledInputProps>;
  expandable: boolean;
}

export const INPUT_TYPE_COMPONENT_REGISTRY: Record<string, InputRegistryEntry> =
  {
    float: { component: FloatInput, expandable: false },
    int: { component: IntInput, expandable: false },
    str: { component: StringInput, expandable: true },
    Image: { component: ImageInput, expandable: true },
  };
