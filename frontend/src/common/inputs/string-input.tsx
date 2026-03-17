import { memo, type NamedExoticComponent } from "react";
import { StringArea } from "../utility-components/string-area";
import { Input } from "@/components/ui/input";
import { useInputField, type CustomInputProps } from "@/hooks/useInputField";
import { cn } from "@/lib/utils";

export interface StringInputProps {
  value: string;
  onChange: (value: string) => void;
  onCommit?: (value: string) => void;
  disabled: boolean;
  valid?: boolean;
  expanded?: boolean;
  placeholder?: string;
}

type CombinedStringInputProps = StringInputProps | CustomInputProps;

type StringInputComponent = NamedExoticComponent<CombinedStringInputProps> & {
  expandable: true;
};

function isCustomInputProps(
  props: CombinedStringInputProps,
): props is CustomInputProps {
  return "inputData" in props;
}

const ControlledStringInput = memo(function ControlledStringInput({
  value,
  onChange,
  onCommit,
  disabled,
  valid = true,
  expanded = false,
  placeholder = "Enter string",
}: StringInputProps) {
  if (expanded) {
    return (
      <StringArea
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
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit ? (e) => onCommit(e.target.value) : undefined}
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

const StoreBackedStringInput = memo(function StoreBackedStringInput({
  inputData,
  path,
  disabled,
}: CustomInputProps) {
  const { value, setValue } = useInputField<string>(inputData, path);

  return (
    <ControlledStringInput
      value={typeof value === "string" ? value : ""}
      onChange={(nextValue) => {
        void setValue(nextValue);
      }}
      disabled={disabled}
      expanded={inputData._expanded ?? false}
    />
  );
});

const StringInput = memo(function StringInput(props: CombinedStringInputProps) {
  if (isCustomInputProps(props)) {
    return <StoreBackedStringInput {...props} />;
  }

  return <ControlledStringInput {...props} />;
}) as StringInputComponent;

StringInput.expandable = true;

export default StringInput;
