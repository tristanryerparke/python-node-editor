import { memo } from "react";
import { Grip } from "lucide-react";
import {
  ResizableHeight,
  ResizableHeightHandle,
} from "../../utility-components/resizable-height";
import { SyncedWidthHandle } from "../../utility-components/synced-width-resizable";
import { Textarea } from "../../../components/ui/textarea";
import useFlowStore, { useNodeData } from "../../../stores/flowStore";
import type { DataWrapper } from "@/types/types";
import GenericSchemaExpanded from "./generic-schema-expanded";
import { cn } from "@/lib/utils";

interface StringExpandedProps {
  inputData?: DataWrapper;
  outputData?: DataWrapper;
  path: (string | number)[];
  readOnly?: boolean;
}

const DEFAULT_AND_MIN_HEIGHT = 30;
const MAX_HEIGHT = 200;

const encodeAsJsonString = (value: string) => JSON.stringify(value);
const valueToPlainText = (value: unknown): string =>
  typeof value === "string" ? value : "";

const ReadOnlyStringExpanded = memo(function ReadOnlyStringExpanded({
  data,
  path,
}: {
  data: DataWrapper;
  path: (string | number)[];
}) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const storedHeight = useNodeData([...path, "_expandedHeight"]) as
    | number
    | undefined;
  const height = storedHeight || DEFAULT_AND_MIN_HEIGHT;

  const setHeight = (newHeight: number) => {
    void updateNodeData([...path, "_expandedHeight"], newHeight);
  };

  const value = typeof data.value === "string" ? data.value : "";

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
            disabled={true}
            className={cn("nopan nowheel border-none", "w-full h-full", "cursor-default")}
            placeholder=""
            style={{
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              opacity: 1,
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

const InputStringExpanded = memo(function InputStringExpanded({
  inputData,
  path,
}: {
  inputData: DataWrapper;
  path: (string | number)[];
}) {
  return (
    <GenericSchemaExpanded
      inputData={inputData}
      path={path}
      displayToRawInput={encodeAsJsonString}
      valueToDisplay={valueToPlainText}
    />
  );
});

export default memo(function StringExpanded({
  inputData,
  outputData,
  path,
  readOnly = false,
}: StringExpandedProps) {
  if (readOnly || outputData) {
    if (!outputData) {
      return <div>No data</div>;
    }

    return <ReadOnlyStringExpanded data={outputData} path={path} />;
  }

  if (!inputData) {
    return <div>No data</div>;
  }

  return <InputStringExpanded inputData={inputData} path={path} />;
});
