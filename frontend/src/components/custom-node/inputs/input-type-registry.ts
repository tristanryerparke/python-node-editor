// eslint-disable react-refresh/only-export-components
import FloatInput from "../../../common/leaf-inputs/float-input";
import IntInput from "../../../common/leaf-inputs/int-input";
import StringInput from "../../../common/leaf-inputs/string-input";
import ImageInput from "../../../common/leaf-inputs/image-input";
import type { CustomInputProps } from "@/hooks/useInputField";

export type InputRendererProps = CustomInputProps;

export type ComponentRegistryEntry =
  | React.ComponentType<InputRendererProps>
  | {
      anyOf: React.ComponentType<InputRendererProps>[];
      expanded?: React.ComponentType<InputRendererProps>;
      hideMainWhenExpanded?: boolean;
    }
  | {
      main: React.ComponentType<InputRendererProps>;
      expanded?: React.ComponentType<InputRendererProps>;
      hideMainWhenExpanded?: boolean;
    };

// Add more input types here
export const INPUT_TYPE_COMPONENT_REGISTRY: Record<
  string,
  ComponentRegistryEntry
> = {
  float: { main: FloatInput },
  int: { main: IntInput },
  str: {
    main: StringInput,
    hideMainWhenExpanded: true,
  },
  Image: { main: ImageInput, hideMainWhenExpanded: true },
};
