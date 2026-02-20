// eslint-disable react-refresh/only-export-components
import FloatInput from "../../../common/leaf-inputs/float-input";
import IntInput from "../../../common/leaf-inputs/int-input";
import StringInput from "../../../common/leaf-inputs/string-input";
import ImageInput from "../../../common/leaf-inputs/image-input";
import SVGInput from "../../../common/leaf-inputs/svg-input";
import StringExpanded from "../../../common/leaf-inputs/expanded/string-expanded";
import ImageExpanded from "../../../common/leaf-inputs/expanded/image-expanded";
import SVGExpanded from "../../../common/leaf-inputs/expanded/svg-expanded";
// import { GrowingComponent } from "@/common/leaf-inputs/expanded/max-size-component-test";

export interface InputRendererProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputData: any;
  path: (string | number)[];
}

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
    expanded: StringExpanded,
    hideMainWhenExpanded: true,
  },
  Image: { main: ImageInput, expanded: ImageExpanded },
  // Image: { main: ImageInput, expanded: GrowingComponent },
  SVG: { main: SVGInput, expanded: SVGExpanded },
};
