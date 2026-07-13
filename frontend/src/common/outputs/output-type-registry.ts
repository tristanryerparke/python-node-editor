import type { ComponentType } from "react";
import StringOutput from "./string-output";
import type { ControlledOutputProps } from "@/common/renderers/types";

export interface OutputRegistryEntry {
  component?: ComponentType<ControlledOutputProps>;
  expandedComponent?: ComponentType<ControlledOutputProps>;
  expandable: boolean;
  defaultExpandedHeight?: number;
  minExpandedHeight?: number;
  maxExpandedHeight?: number;
  pluginId?: string;
  pluginCssHref?: string | null;
}

export const OUTPUT_TYPE_COMPONENT_REGISTRY: Record<string, OutputRegistryEntry> =
  {
    str: {
      component: StringOutput,
      expandable: true,
      defaultExpandedHeight: 30,
    },
  };

export function registerOutputRenderer(
  typeName: string,
  entry: OutputRegistryEntry,
): void {
  OUTPUT_TYPE_COMPONENT_REGISTRY[typeName] = entry;
}

export function getOutputRenderer(
  typeName: string,
): OutputRegistryEntry | undefined {
  return OUTPUT_TYPE_COMPONENT_REGISTRY[typeName];
}
