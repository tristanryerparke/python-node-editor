import { memo, useMemo } from "react";
import { Grip } from "lucide-react";
import { useNodeConnections } from "@xyflow/react";
import {
  ResizableHeight,
  ResizableHeightHandle,
} from "@/common/utility-components/resizable-height";
import { SyncedWidthHandle } from "@/common/utility-components/synced-width-resizable";
import { Textarea } from "@/components/ui/textarea";
import { useControlledDebounce } from "@/hooks/useControlledDebounce";
import { cn } from "@/lib/utils";
import useFlowStore, { useNodeData } from "@/stores/flowStore";
import type { DataWrapper } from "@/types/types";
import { validateInputAgainstSchema } from "@/utils/schema-input-validator";
import { formatTypeForDisplay } from "@/utils/type-formatting";
import {
  defaultValueToDisplay,
  type DisplayToRawInput,
  type ValueToDisplay,
} from "../generic-schema-input";

interface GenericSchemaExpandedProps {
  inputData: DataWrapper;
  path: (string | number)[];
  placeholder?: string;
  displayToRawInput?: DisplayToRawInput;
  valueToDisplay?: ValueToDisplay;
}

const DEFAULT_AND_MIN_HEIGHT = 30;
const MAX_HEIGHT = 200;
const defaultDisplayToRawInput: DisplayToRawInput = (value) => value;

export default memo(function GenericSchemaExpanded({
  inputData,
  path,
  placeholder,
  displayToRawInput = defaultDisplayToRawInput,
  valueToDisplay = defaultValueToDisplay,
}: GenericSchemaExpandedProps) {
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

      void updateNodeData([...path, "value"], valueToStore, {
        fromUser: true,
      });
    },
    200,
  );

  const validationResult = useMemo(() => {
    const rawInput = displayToRawInput(value);
    return validateInputAgainstSchema(rawInput, inputData.type);
  }, [displayToRawInput, inputData.type, value]);
  const resolvedPlaceholder = placeholder ?? formatTypeForDisplay(inputData.type);

  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  const connections = useNodeConnections({
    handleType: "target",
    handleId: handleId,
  });
  const isConnected =
    connections.length > 0 && connections[0].targetHandle === handleId;

  const storedHeight = useNodeData([...path, "_expandedHeight"]) as
    | number
    | undefined;
  const height = storedHeight || DEFAULT_AND_MIN_HEIGHT;
  const setHeight = (newHeight: number) => {
    void updateNodeData([...path, "_expandedHeight"], newHeight);
  };

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
