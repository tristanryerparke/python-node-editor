import type { ReactNode } from "react";
import { Grip } from "lucide-react";
import {
  ResizableHeight,
  ResizableHeightHandle,
} from "./resizable-height";
import { SyncedWidthHandle } from "./synced-width-resizable";

interface HostResizableRendererFrameProps {
  children: ReactNode;
  minHeight?: number;
  maxHeight?: number;
}

export default function HostResizableRendererFrame({
  children,
  minHeight = 30,
  maxHeight = 200,
}: HostResizableRendererFrameProps) {
  return (
    <ResizableHeight minHeight={minHeight} maxHeight={maxHeight}>
      <div className="nodrag nopan nowheel relative flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden">
        <div className="flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden rounded-md border border-input">
          {children}
        </div>
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
