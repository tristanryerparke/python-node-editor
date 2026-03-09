import { memo, useCallback, useMemo } from "react";
import { Grip } from "lucide-react";
import { useNodeConnections } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ResizableHeight,
  ResizableHeightHandle,
} from "@/common/utility-components/resizable-height";
import { SyncedWidthHandle } from "@/common/utility-components/synced-width-resizable";
import { useInputField } from "@/hooks/useInputField";
import { useControlledDebounce } from "@/hooks/useControlledDebounce";
import { cn } from "@/lib/utils";
import useFlowStore, { useNodeData } from "@/stores/flowStore";
import type { FrontendFieldDataWrapper } from "@/types/types";
import { validateInputAgainstSchema } from "@/utils/schema-input-validator";
import { formatTypeForDisplay } from "@/utils/type-formatting";

export type DisplayToRawInput = (displayValue: string) => string;
export type ValueToDisplay = (value: unknown) => string;

interface GenericSchemaInputProps {
  inputData: FrontendFieldDataWrapper;
  path: (string | number)[];
  placeholder?: string;
  displayToRawInput?: DisplayToRawInput;
  valueToDisplay?: ValueToDisplay;
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

// Compact single-line input
const GenericSchemaCompact = memo(function GenericSchemaCompact({
  inputData,
  path,
  placeholder,
  displayToRawInput = defaultDisplayToRawInput,
  valueToDisplay = defaultValueToDisplay,
}: GenericSchemaInputProps) {
  const { value, setValue, disabled } = useInputField(inputData, path);

  const preprocess = useCallback(
    (text: string) => {
      const rawInput = displayToRawInput(text);
      const result = validateInputAgainstSchema(rawInput, inputData.type);
      return result.valid ? result.value : text;
    },
    [displayToRawInput, inputData.type],
  );

  const displayValue = useMemo(() => valueToDisplay(value), [value, valueToDisplay]);

  const validationResult = useMemo(() => {
    const rawInput = displayToRawInput(displayValue);
    return validateInputAgainstSchema(rawInput, inputData.type);
  }, [displayToRawInput, inputData.type, displayValue]);
  const resolvedPlaceholder = placeholder ?? formatTypeForDisplay(inputData.type);

  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <Input
        type="text"
        value={displayValue}
        onChange={(e) => setValue(preprocess(e.target.value))}
        onBlur={() => setValue(preprocess(displayValue), 0)}
        disabled={disabled}
        className={cn(
          "nodrag nopan nowheel",
          !validationResult.valid &&
            "border-destructive focus-visible:border-destructive",
        )}
        placeholder={resolvedPlaceholder}
      />
    </div>
  );
});

// Expanded resizable textarea
const GenericSchemaExpandedView = memo(function GenericSchemaExpandedView({
  inputData,
  path,
  placeholder,
  displayToRawInput = defaultDisplayToRawInput,
  valueToDisplay = defaultValueToDisplay,
}: GenericSchemaInputProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const externalValue = valueToDisplay(inputData.value);

  const [value, setValue] = useControlledDebounce(
    externalValue,
    (debouncedValue) => {
      const rawInput = displayToRawInput(debouncedValue);
      const validationResult = validateInputAgainstSchema(rawInput, inputData.type);
      const valueToStore = validationResult.valid
        ? validationResult.value
        : debouncedValue;
      void updateNodeData([...path, "value"], valueToStore, { fromUser: true });
    },
    200,
  );

  const validationResult = useMemo(() => {
    const rawInput = displayToRawInput(value);
    return validateInputAgainstSchema(rawInput, inputData.type);
  }, [displayToRawInput, inputData.type, value]);

  const resolvedPlaceholder = placeholder ?? formatTypeForDisplay(inputData.type);

  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  const connections = useNodeConnections({ handleType: "target", handleId });
  const isConnected =
    connections.length > 0 && connections[0].targetHandle === handleId;

  const storedHeight = useNodeData([...path, "_expandedHeight"]) as
    | number
    | undefined;
  const height = storedHeight ?? DEFAULT_AND_MIN_HEIGHT;
  const setHeight = (newHeight: number) =>
    void updateNodeData([...path, "_expandedHeight"], newHeight);

  return (
    <div className="flex flex-col nodrag nopan nowheel">
      <ResizableHeight
        height={height}
        setHeight={setHeight}
        minHeight={DEFAULT_AND_MIN_HEIGHT}
        maxHeight={MAX_HEIGHT}
        useTailwindScale={true}
      >
        <div
          className={cn(
            "w-full h-full flex items-center justify-center bg-muted/30 rounded-md border border-input nodrag nopan nowheel",
            !validationResult.valid && "border-destructive",
          )}
        >
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={(e) => setValue(e.target.value)}
            disabled={isConnected}
            className={cn("nodrag nopan nowheel border-none", "w-full h-full")}
            placeholder={resolvedPlaceholder}
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

export default memo(function GenericSchemaInput({
  inputData,
  path,
  placeholder,
  displayToRawInput,
  valueToDisplay,
}: GenericSchemaInputProps) {
  if (inputData._expanded) {
    return (
      <GenericSchemaExpandedView
        inputData={inputData}
        path={path}
        placeholder={placeholder}
        displayToRawInput={displayToRawInput}
        valueToDisplay={valueToDisplay}
      />
    );
  }

  return (
    <GenericSchemaCompact
      inputData={inputData}
      path={path}
      placeholder={placeholder}
      displayToRawInput={displayToRawInput}
      valueToDisplay={valueToDisplay}
    />
  );
});
