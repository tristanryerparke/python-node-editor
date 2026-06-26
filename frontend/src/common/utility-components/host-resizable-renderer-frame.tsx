import { useRef } from "react";
import { Grip } from "lucide-react";
import { useFieldRenderContext } from "./field-render-context";
import {
  ResizableHeight,
  ResizableHeightHandle,
} from "./resizable-height";
import { SyncedWidthHandle } from "./synced-width-resizable";

const MIN_HEIGHT = 15; // Tailwind units
const MAX_HEIGHT = 125; // Tailwind units

interface HostResizableRendererFrameProps {
  children: React.ReactNode;
  minSize?: number;
}

export function HostResizableRendererFrame({
  children,
  minSize = MIN_HEIGHT,
}: HostResizableRendererFrameProps) {
  const fieldRenderContext = useFieldRenderContext();
  const isInspector = fieldRenderContext?.mode === "inspector";
  const minSquareSize = Math.max(MIN_HEIGHT, minSize);
  const frameRef = useRef<HTMLDivElement>(null);
  const handle = (
    <div
      className={`nodrag shrink-0 absolute bottom-0 right-0 p-0.5 opacity-50 hover:opacity-100 transition-opacity ${
        isInspector ? "cursor-ns-resize" : "cursor-nwse-resize"
      }`}
    >
      <Grip className="h-3 w-3 text-muted-foreground" />
    </div>
  );

  return (
    <ResizableHeight minHeight={MIN_HEIGHT} maxHeight={MAX_HEIGHT}>
      <div
        ref={frameRef}
        className="relative flex h-full w-full min-w-0 flex-col overflow-hidden"
      >
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
        <ResizableHeightHandle>
          {isInspector ? (
            handle
          ) : (
            <SyncedWidthHandle
              minWidth={minSquareSize}
              minWidthTargetRef={frameRef}
            >
              {handle}
            </SyncedWidthHandle>
          )}
        </ResizableHeightHandle>
      </div>
    </ResizableHeight>
  );
}
