import { memo } from "react";
import {
  ResizableHeight,
  ResizableHeightHandle,
  ResizableHeightProvider,
} from "@/common/utility-components/resizable-height";
import { SyncedWidthHandle } from "@/common/utility-components/synced-width-resizable";
import useFlowStore, { useNodeData } from "@/stores/flowStore";
import { Grip } from "lucide-react";

type NodeDrawerProps = {
  isExpanded: boolean;
  terminalOutput?: string;
  path: (string | number)[];
};

const DEFAULT_AND_MIN_HEIGHT = 25; // Tailwind units
const MAX_HEIGHT = 125; // Tailwind units

export default memo(function NodeDrawer({
  isExpanded,
  terminalOutput,
  path,
}: NodeDrawerProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // console.log("NodeDrawer:", {
  //   isExpanded,
  //   hasTerminalOutput: !!terminalOutput,
  //   path,
  // });

  // Get height from store
  const storedHeight = useNodeData([
    ...path,
    "_terminal_drawer",
    "_expandedHeight",
  ]) as number | undefined;
  const height = storedHeight || DEFAULT_AND_MIN_HEIGHT;

  const setHeight = (newHeight: number) => {
    void updateNodeData([...path, "_terminal_drawer", "_expandedHeight"], newHeight);
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <ResizableHeightProvider height={height} setHeight={setHeight}>
      <ResizableHeight
        minHeight={DEFAULT_AND_MIN_HEIGHT}
        maxHeight={MAX_HEIGHT}
      >
        <div className="absolute w-full h-4 top-0 left-0 -translate-y-4 border-x border-input z-0"></div>

        <div className="nodrag nopan nowheel bg-card/50 border-x border-b border-input rounded-b-lg overflow-hidden h-full relative w-full z-1">
          {terminalOutput ? (
            <div
              className="px-2 pt-2 pb-0 h-full overflow-auto select-text cursor-text w-full"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="font-mono text-xs whitespace-pre-wrap break-all select-text w-full">
                {terminalOutput}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No Terminal Output</p>
            </div>
          )}
          <ResizableHeightHandle>
            <SyncedWidthHandle>
              <div className="nodrag shrink-0 cursor-nwse-resize absolute bottom-0.5 right-0.5 p-0.5 opacity-50 hover:opacity-100 transition-opacity">
                <Grip className="h-3 w-3 text-muted-foreground" />
              </div>
            </SyncedWidthHandle>
          </ResizableHeightHandle>
        </div>
      </ResizableHeight>
    </ResizableHeightProvider>
  );
});
