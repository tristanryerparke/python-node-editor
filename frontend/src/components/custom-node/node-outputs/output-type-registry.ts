import type { ComponentType } from "react";
import ImageOutput from "../../../common/outputs/image-output";
import StringOutput from "../../../common/outputs/string-output";
import type { ControlledOutputProps } from "./output-field-display";

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
