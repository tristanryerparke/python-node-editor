// eslint-disable react-refresh/only-export-components
import ImageOutput from "../../../common/outputs/image-output";
import StringOutput from "../../../common/outputs/string-output";

export interface OutputRendererProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputData: any;
  path: (string | number)[];
  readOnly?: boolean;
}

// Add more output types here
export const OUTPUT_TYPE_COMPONENT_REGISTRY: Record<
  string,
  React.ComponentType<OutputRendererProps>
> = {
  Image: ImageOutput,
  str: StringOutput,
};
