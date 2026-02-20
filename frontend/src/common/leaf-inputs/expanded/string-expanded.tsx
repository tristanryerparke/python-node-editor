import { memo } from "react";
import {
  ResizableHeight,
  ResizableHeightHandle,
} from "../../utility-components/resizable-height";
import { SyncedWidthHandle } from "../../utility-components/synced-width-resizable";
import { Textarea } from "../../../components/ui/textarea";
import useFlowStore, { useNodeData } from "../../../stores/flowStore";
import { useNodeConnections } from "@xyflow/react";
import { useControlledDebounce } from "../../../hooks/useControlledDebounce";
import type { DataWrapper } from "@/types/types";
import { cn } from "@/lib/utils";
import { Grip } from "lucide-react";

interface StringExpandedProps {
  inputData?: DataWrapper;
  outputData?: DataWrapper;
  path: (string | number)[];
  readOnly?: boolean;
}

const DEFAULT_AND_MIN_HEIGHT = 30; // Tailwind units
const MAX_HEIGHT = 200; // Tailwind units

export default memo(function StringExpanded({
  inputData,
  outputData,
  path,
  readOnly = false,
}: StringExpandedProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Call all hooks before any early returns
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  const connections = useNodeConnections({
    handleType: "target",
    handleId: handleId,
  });

  // Support both inputData and outputData
  const data = inputData || outputData;

  const externalValue = typeof data?.value === "string" ? data.value : "";

  const [value, setValue] = useControlledDebounce(
    externalValue,
    (debouncedValue) => {
      void updateNodeData([...path, "value"], debouncedValue, {
        fromUser: true,
      });
    },
    200,
  );

  // Get height from store
  const storedHeight = useNodeData([...path, "_expandedHeight"]) as
    | number
    | undefined;
  const height = storedHeight || DEFAULT_AND_MIN_HEIGHT;

  const setHeight = (newHeight: number) => {
    void updateNodeData([...path, "_expandedHeight"], newHeight);
  };

  // Early return after all hooks
  if (!data) {
    return <div>No data</div>;
  }

  const isConnected =
    connections.length > 0 && connections[0].targetHandle === handleId;

  const isDisabled = readOnly || isConnected;

  const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  return (
    <div className="flex flex-col">
      <ResizableHeight
        height={height}
        setHeight={setHeight}
        minHeight={DEFAULT_AND_MIN_HEIGHT}
        maxHeight={MAX_HEIGHT}
        useTailwindScale={true}
      >
        <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-md border border-input">
          <Textarea
            value={value}
            onChange={handleValueChange}
            onBlur={(e) => setValue(e.target.value)}
            disabled={isDisabled}
            className={cn(
              "nopan nowheel border-none",
              "w-full h-full",
              readOnly && "cursor-default",
            )}
            placeholder=""
            style={{
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              opacity: readOnly ? 1 : undefined,
              resize: "none",
              fieldSizing: "fixed",
            }}
          />
          <ResizableHeightHandle>
            <SyncedWidthHandle>
              <div className="nodrag shrink-0 cursor-nwse-resize absolute bottom-0 right-0 p-0.5 opacity-50 hover:opacity-100 transition-opacity">
                <Grip className="h-3 w-3 text-muted-foreground" />
              </div>
            </SyncedWidthHandle>
          </ResizableHeightHandle>
        </div>
      </ResizableHeight>
    </div>
  );
});
