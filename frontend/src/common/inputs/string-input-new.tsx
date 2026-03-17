import { memo } from "react";
import { GenericSchemaCompactView } from "./generic-schema-input";
import { StringAreaView } from "../utility-components/string-area";

export interface StringInputNewProps {
  value: string;
  onChange: (value: string) => void;
  onCommit?: (value: string) => void;
  disabled: boolean;
  valid?: boolean;
  expanded?: boolean;
  placeholder?: string;
}

const ControlledStringInput = memo(function ControlledStringInput({
  value,
  onChange,
  onCommit,
  disabled,
  valid = true,
  expanded = false,
  placeholder = "Enter string",
}: StringInputNewProps) {
  if (expanded) {
    return (
      <StringAreaView
        value={value}
        onChange={onChange}
        onCommit={onCommit}
        editable={true}
        placeholder={placeholder}
        isInvalid={!valid}
        disabled={disabled}
      />
    );
  }

  return (
    <GenericSchemaCompactView
      value={value}
      onChange={onChange}
      onCommit={onCommit}
      disabled={disabled}
      valid={valid}
      placeholder={placeholder}
    />
  );
});

export default ControlledStringInput;
