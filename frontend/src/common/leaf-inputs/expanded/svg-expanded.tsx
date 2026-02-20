import { memo } from "react";
import {
  ResizableHeight,
  ResizableHeightHandle,
} from "../../utility-components/resizable-height";
import { SyncedWidthHandle } from "../../utility-components/synced-width-resizable";
import type { FrontendFieldDataWrapper } from "@/types/types";
import useFlowStore, { useNodeData } from "@/stores/flowStore";
import { Grip } from "lucide-react";

interface SVGDataWrapper extends Omit<FrontendFieldDataWrapper, "value"> {
  value: string | null;
}

interface SVGExpandedProps {
  inputData?: FrontendFieldDataWrapper;
  outputData?: FrontendFieldDataWrapper;
  path: (string | number)[];
}

const DEFAULT_AND_MIN_HEIGHT = 60; // Tailwind units
const MAX_HEIGHT = 200; // Tailwind units

export default memo(function SVGExpanded({
  inputData,
  outputData,
  path,
}: SVGExpandedProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Get height from store
  const storedHeight = useNodeData([...path, "_expandedHeight"]) as
    | number
    | undefined;
  const height = storedHeight || DEFAULT_AND_MIN_HEIGHT;

  const setHeight = (newHeight: number) => {
    updateNodeData([...path, "_expandedHeight"], newHeight);
  };

  // Support both inputData and outputData
  const data = inputData || outputData;
  if (!data) {
    return <div>No data</div>;
  }

  const svgData = data as SVGDataWrapper;
  const svgContent = svgData.value;
  const hasSVG = svgContent !== null;

  // Convert SVG to data URI for img tag
  const svgDataUri = hasSVG
    ? `data:image/svg+xml;base64,${btoa(svgContent || "")}`
    : "";

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
          {hasSVG ? (
            <img
              src={svgDataUri}
              alt="SVG Graphic"
              className="w-full h-full object-contain"
              style={{ width: "100%", height: "100%" }}
              draggable={false}
            />
          ) : (
            <span className="text-sm text-muted-foreground">No SVG</span>
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
    </div>
  );
});
