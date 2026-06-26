import type { ComponentType } from "react";
import FloatInput from "./float-input";
import IntInput from "./int-input";
import StringInput from "./string-input";
import ImageInput from "./image-input";
import Point2DFromBackendInput from "./point2d-from-backend-input";
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
    Point2DFromBackend: {
      component: Point2DFromBackendInput,
      expandable: false,
    },
    RhinoPolyline: {
      component: Point2DFromBackendInput,
      expandable: false,
    },
  };

export function registerInputRenderer(
  typeName: string,
  entry: InputRegistryEntry,
) {
  INPUT_TYPE_COMPONENT_REGISTRY[typeName] = entry;
}

export function getInputRenderer(typeName: string) {
  return INPUT_TYPE_COMPONENT_REGISTRY[typeName];
}

export function hasInputRenderer(typeName: string) {
  return typeName in INPUT_TYPE_COMPONENT_REGISTRY;
}
