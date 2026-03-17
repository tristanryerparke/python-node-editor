import { memo, useCallback, useMemo } from "react";
import { Grip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ResizableHeight,
  ResizableHeightHandle,
} from "@/common/utility-components/resizable-height";
import { SyncedWidthHandle } from "@/common/utility-components/synced-width-resizable";
import { useInputField, type CustomInputProps } from "@/hooks/useInputField";
import { cn } from "@/lib/utils";
import { validateInputAgainstSchema } from "@/utils/schema-input-validator";
import { formatTypeForDisplay } from "@/utils/type-formatting";

export type DisplayToRawInput = (displayValue: string) => string;
export type ValueToDisplay = (value: unknown) => string;

export interface ControlledTextInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  valid?: boolean;
  placeholder?: string;
}

export interface ControlledGenericSchemaInputProps
  extends ControlledTextInputProps {
  expanded?: boolean;
}

interface StoreBackedGenericSchemaInputProps extends CustomInputProps {
  placeholder?: string;
  displayToRawInput?: DisplayToRawInput;
  valueToDisplay?: ValueToDisplay;
}

type CombinedGenericSchemaInputProps =
  | ControlledGenericSchemaInputProps
  | StoreBackedGenericSchemaInputProps;

function isCustomInputProps(
  props: CombinedGenericSchemaInputProps,
): props is StoreBackedGenericSchemaInputProps {
  return "inputData" in props;
}

export const defaultValueToDisplay: ValueToDisplay = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const defaultDisplayToRawInput: DisplayToRawInput = (value) => value;

const DEFAULT_AND_MIN_HEIGHT = 30;
const MAX_HEIGHT = 200;

export const GenericSchemaCompactView = memo(function GenericSchemaCompactView({
  value,
  onChange,
  disabled,
  valid = true,
  placeholder,
}: ControlledTextInputProps) {
  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <Input
        type="text"
        value={value}
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

export const GenericSchemaExpandedView = memo(function GenericSchemaExpandedView({
  value,
  onChange,
  disabled,
  valid = true,
  placeholder,
}: ControlledTextInputProps) {
  return (
    <div className="flex flex-col nodrag nopan nowheel">
      <ResizableHeight
        minHeight={DEFAULT_AND_MIN_HEIGHT}
        maxHeight={MAX_HEIGHT}
        useTailwindScale={true}
      >
        <div
          className={cn(
            "w-full h-full flex items-center justify-center rounded-md border border-input nodrag nopan nowheel",
            !valid && "border-destructive",
          )}
        >
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={cn(
              "nodrag nopan nowheel border-none px-2 py-1",
              "w-full h-full",
            )}
            placeholder={placeholder}
            style={{
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              resize: "none",
              fieldSizing: "fixed",
            }}
          />
          <ResizableHeightHandle>
            <SyncedWidthHandle>
              <div className="nodrag shrink-0 cursor-nwse-resize absolute bottom-1 right-1 p-0.5 opacity-50 hover:opacity-100 transition-opacity">
                <Grip className="h-3 w-3 text-muted-foreground" />
              </div>
            </SyncedWidthHandle>
          </ResizableHeightHandle>
        </div>
      </ResizableHeight>
    </div>
  );
});

const ControlledGenericSchemaInput = memo(function ControlledGenericSchemaInput({
  value,
  onChange,
  disabled,
  valid = true,
  expanded = false,
  placeholder,
}: ControlledGenericSchemaInputProps) {
  if (expanded) {
    return (
      <GenericSchemaExpandedView
        value={value}
        onChange={onChange}
        disabled={disabled}
        valid={valid}
        placeholder={placeholder}
      />
    );
  }

  return (
    <GenericSchemaCompactView
      value={value}
      onChange={onChange}
      disabled={disabled}
      valid={valid}
      placeholder={placeholder}
    />
  );
});

const StoreBackedGenericSchemaInput = memo(function StoreBackedGenericSchemaInput({
  inputData,
  path,
  disabled,
  placeholder,
  displayToRawInput,
  valueToDisplay,
}: StoreBackedGenericSchemaInputProps) {
  const resolvedPlaceholder = placeholder ?? formatTypeForDisplay(inputData.type);
  const { value, setValue } = useInputField(inputData, path);
  const preprocess = useCallback(
    (text: string) => {
      const rawInput = (displayToRawInput ?? defaultDisplayToRawInput)(text);
      const result = validateInputAgainstSchema(rawInput, inputData.type);
      return result.valid ? result.value : text;
    },
    [displayToRawInput, inputData.type],
  );

  const displayValue = useMemo(
    () =>
      valueToDisplay ? valueToDisplay(value) : defaultValueToDisplay(value),
    [value, valueToDisplay],
  );
  const validationResult = useMemo(() => {
    const rawInput = (displayToRawInput ?? defaultDisplayToRawInput)(
      displayValue,
    );
    return validateInputAgainstSchema(rawInput, inputData.type);
  }, [displayToRawInput, inputData.type, displayValue]);

  return (
    <ControlledGenericSchemaInput
      value={displayValue}
      onChange={(text) => {
        void setValue(preprocess(text));
      }}
      disabled={disabled}
      valid={validationResult.valid}
      expanded={inputData._expanded ?? false}
      placeholder={resolvedPlaceholder}
    />
  );
});

export default memo(function GenericSchemaInput(
  props: CombinedGenericSchemaInputProps,
) {
  if (isCustomInputProps(props)) {
    return <StoreBackedGenericSchemaInput {...props} />;
  }

  return <ControlledGenericSchemaInput {...props} />;
});
