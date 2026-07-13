import { memo } from "react";
import { StringArea } from "../utility-components/string-area";
import type { ControlledInputProps } from "@/common/renderers/types";
import { Input } from "t-components/input";

export interface StringInputProps extends ControlledInputProps {
  placeholder?: string;
}

const StringInput = memo(function StringInput({
  value,
  onChange,
  disabled,
  expanded = false,
  placeholder = "Enter string",
}: StringInputProps) {
  if (expanded) {
    return (
      <StringArea
        value={value as string}
        onChange={onChange}
        editable={true}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  }

  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <Input
        type="text"
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex flex-1 w-0 nodrag nopan nowheel"
        placeholder={placeholder}
      />
    </div>
  );
});

export default StringInput;
