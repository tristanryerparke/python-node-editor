// eslint-disable react-refresh/only-export-components
import ImageOutput from "../../../common/outputs/image-output";
import StringOutput from "../../../common/outputs/string-output";

export interface OutputRendererProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputData: any;
  path: (string | number)[];
  readOnly?: boolean;
}

export interface OutputRegistryEntry {
  main: React.ComponentType<OutputRendererProps>;
  expanded?: boolean;
  expandable?: boolean;
}

// Type that supports both direct component and object pattern
export type OutputRegistryValueType =
  | React.ComponentType<OutputRendererProps>
  | OutputRegistryEntry;

// Determine if a value is an object with properties (new pattern)
export function isObjectRegistryEntry(
  value: OutputRegistryValueType
): value is OutputRegistryEntry {
  return typeof value === "object" && "main" in value;
}

// Add more output types here
export const OUTPUT_TYPE_COMPONENT_REGISTRY: Record<
  string,
  OutputRegistryValueType
> = {
  Image: ImageOutput,
  str: StringOutput,
};
