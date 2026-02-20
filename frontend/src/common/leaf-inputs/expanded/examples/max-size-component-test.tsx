import {
  ResizableHeight,
  ResizableHeightHandle,
} from "../../../utility-components/resizable-height";
import { SyncedWidthHandle } from "../../../utility-components/synced-width-resizable";
import useFlowStore, { useNodeData } from "@/stores/flowStore";
import { Grip } from "lucide-react";

const DEFAULT_AND_MIN_HEIGHT = 60; // Tailwind units
const MAX_HEIGHT = 200; // Tailwind units

interface GrowingComponentProps {
  path: (string | number)[];
}

export function GrowingComponent({ path }: GrowingComponentProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Get height from store
  const storedHeight = useNodeData([...path, "_expandedHeight"]) as
    | number
    | undefined;
  const height = storedHeight || DEFAULT_AND_MIN_HEIGHT;

  const setHeight = (newHeight: number) => {
    void updateNodeData([...path, "_expandedHeight"], newHeight);
  };

  return (
    <ResizableHeight
      height={height}
      setHeight={setHeight}
      minHeight={DEFAULT_AND_MIN_HEIGHT}
      maxHeight={MAX_HEIGHT}
      useTailwindScale={true}
    >
      <div className="bg-red-400 w-full h-full relative">
        growing component
        <ResizableHeightHandle>
          <SyncedWidthHandle>
            <div className="nodrag shrink-0 cursor-nwse-resize absolute bottom-0 right-0 p-0.5 opacity-50 hover:opacity-100 transition-opacity">
              <Grip className="h-3 w-3 text-muted-foreground" />
            </div>
          </SyncedWidthHandle>
        </ResizableHeightHandle>
      </div>
    </ResizableHeight>
  );
}
