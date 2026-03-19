import type { ComponentType } from "react";
import ImageOutput from "./image-output";
import StringOutput from "./string-output";
import type { ControlledOutputProps } from "@/components/custom-node/node-outputs/output-field-display";

export interface OutputRegistryEntry {
  component: ComponentType<ControlledOutputProps>;
  expandable: boolean;
  defaultExpandedHeight?: number;
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
