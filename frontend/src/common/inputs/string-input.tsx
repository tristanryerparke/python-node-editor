import { memo } from "react";
import { StringArea } from "../utility-components/string-area";
import type { ControlledInputProps } from "@/common/renderers/types";
import { Input } from "@/components/ui/input";

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
        className="nodrag nopan nowheel"
        placeholder={placeholder}
      />
    </div>
  );
});

export default StringInput;
