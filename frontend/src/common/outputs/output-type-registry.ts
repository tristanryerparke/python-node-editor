import type { ComponentType } from "react";
import ImageOutput from "./image-output";
import StringOutput from "./string-output";
import type { ControlledOutputProps } from "@/components/custom-node/node-outputs/output-field-display";

export interface OutputRegistryEntry {
  component: ComponentType<ControlledOutputProps>;
  expandedComponent?: ComponentType<ControlledOutputProps>;
  expandable: boolean;
  defaultExpandedHeight?: number;
  hostResizable?: boolean;
}

export const OUTPUT_TYPE_COMPONENT_REGISTRY: Record<string, OutputRegistryEntry> =
  {
    Image: {
      component: ImageOutput,
      expandable: true,
      defaultExpandedHeight: 60,
    },
    str: {
      component: StringOutput,
      expandable: true,
      defaultExpandedHeight: 30,
    },
  };

export function registerOutputRenderer(
  typeName: string,
  entry: OutputRegistryEntry,
) {
  OUTPUT_TYPE_COMPONENT_REGISTRY[typeName] = entry;
}

export function getOutputRenderer(typeName: string) {
  return OUTPUT_TYPE_COMPONENT_REGISTRY[typeName];
}

export function hasOutputRenderer(typeName: string) {
  return typeName in OUTPUT_TYPE_COMPONENT_REGISTRY;
}
