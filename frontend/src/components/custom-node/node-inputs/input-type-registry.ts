// eslint-disable react-refresh/only-export-components
import FloatInput from "../../../common/inputs/float-input";
import IntInput from "../../../common/inputs/int-input";
import StringInput from "../../../common/inputs/string-input";
import ImageInput from "../../../common/inputs/image-input";
import type { CustomInputProps } from "@/hooks/useInputField";

// Add more input types here
export const INPUT_TYPE_COMPONENT_REGISTRY: Record<
  string,
  React.ComponentType<CustomInputProps>
> = {
  float: FloatInput,
  int: IntInput,
  str: StringInput,
  Image: ImageInput,
};
