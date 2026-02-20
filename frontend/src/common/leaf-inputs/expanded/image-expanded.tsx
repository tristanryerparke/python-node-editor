import { memo } from "react";
import {
  ResizableHeight,
  ResizableHeightHandle,
} from "../../utility-components/resizable-height";
import { SyncedWidthHandle } from "../../utility-components/synced-width-resizable";
import type { FrontendFieldDataWrapper } from "@/types/types";
import useFlowStore, { useNodeData } from "@/stores/flowStore";
import { Grip } from "lucide-react";

interface ImageExpandedProps {
  inputData?: FrontendFieldDataWrapper;
  outputData?: FrontendFieldDataWrapper;
  path: (string | number)[];
}

const DEFAULT_AND_MIN_HEIGHT = 60; // Tailwind units
const MAX_HEIGHT = 200; // Tailwind units

export default memo(function ImageExpanded({
  inputData,
  outputData,
  path,
}: ImageExpandedProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Get height from store
  const storedHeight = useNodeData([...path, "_expandedHeight"]) as
    | number
    | undefined;
  const height = storedHeight || DEFAULT_AND_MIN_HEIGHT;

  const setHeight = (newHeight: number) => {
    void updateNodeData([...path, "_expandedHeight"], newHeight);
  };

  // Support both inputData and outputData
  const data = inputData || outputData;
  if (!data) {
    return <div>No data</div>;
  }

  const preview = (data as any).preview as string | undefined;
  const filename = (data as any).filename as string | undefined;
  const cacheKey =
    typeof data.value === "string" && data.value.startsWith("$cacheKey:")
      ? data.value.slice("$cacheKey:".length)
      : undefined;
  const hasImage = !!preview || !!cacheKey;

  return (
    <div className="flex flex-col flex-1">
      <ResizableHeight
        height={height}
        setHeight={setHeight}
        minHeight={DEFAULT_AND_MIN_HEIGHT}
        maxHeight={MAX_HEIGHT}
        useTailwindScale={true}
      >
        <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-md border border-input overflow-hidden relative">
          {hasImage && preview ? (
            <img
              src={`data:image/webp;base64,${preview}`}
              alt="Preview"
              className="w-full h-full object-contain"
              draggable={false}
              style={{ maxWidth: "100%", maxHeight: "100%" }}
            />
          ) : (
            <span className="text-sm text-muted-foreground">No image</span>
          )}
          <ResizableHeightHandle>
            <SyncedWidthHandle>
              <div className="nodrag shrink-0 cursor-nwse-resize absolute bottom-0 right-0 p-0.5 opacity-50 hover:opacity-100 transition-opacity">
                <Grip className="h-3 w-3 text-muted-foreground" />
              </div>
            </SyncedWidthHandle>
          </ResizableHeightHandle>
        </div>
      </ResizableHeight>
      {hasImage && filename && (
        <p className="text-xs text-muted-foreground mt-1">{filename}</p>
      )}
    </div>
  );
});
