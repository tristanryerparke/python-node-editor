import { memo } from "react";
import { StringArea } from "../utility-components/string-area";
import type { ControlledInputProps } from "../../components/custom-node/node-inputs/input-field-display";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface StringInputProps extends ControlledInputProps {
  placeholder?: string;
}

const StringInput = memo(function StringInput({
  value,
  onChange,
  disabled,
  valid = true,
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
        isInvalid={!valid}
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
        className={cn(
          "nodrag nopan nowheel",
          !valid && "border-destructive focus-visible:border-destructive",
        )}
        placeholder={placeholder}
      />
    </div>
  );
});

export default StringInput;
