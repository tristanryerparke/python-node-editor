import type { ComponentType } from "react";
import FloatInput from "../../../common/inputs/float-input";
import IntInput from "../../../common/inputs/int-input";
import StringInput from "../../../common/inputs/string-input";
import ImageInput from "../../../common/inputs/image-input";
import type { CustomInputProps } from "@/hooks/useInputField";

export const INPUT_TYPE_COMPONENT_REGISTRY: Record<
  string,
  {
    component: ComponentType<CustomInputProps>;
    expandable: boolean;
  }
> = {
  float: { component: FloatInput, expandable: false },
  int: { component: IntInput, expandable: false },
  str: { component: StringInput, expandable: true },
  Image: { component: ImageInput, expandable: true },
};
