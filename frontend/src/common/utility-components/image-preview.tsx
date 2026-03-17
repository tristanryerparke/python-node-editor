import { memo } from "react";
import { Grip } from "lucide-react";
import {
  ResizableHeight,
  ResizableHeightHandle,
} from "./resizable-height";
import { SyncedWidthHandle } from "./synced-width-resizable";

const DEFAULT_MIN_HEIGHT = 60;
const DEFAULT_MAX_HEIGHT = 200;

export interface ImagePreviewProps {
  /** base64-encoded webp thumbnail string */
  preview?: string;
  minHeight?: number;
  maxHeight?: number;
}

export default memo(function ImagePreview({
  preview,
  minHeight = DEFAULT_MIN_HEIGHT,
  maxHeight = DEFAULT_MAX_HEIGHT,
}: ImagePreviewProps) {
  return (
    <ResizableHeight
      minHeight={minHeight}
      maxHeight={maxHeight}
      useTailwindScale={true}
    >
      <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-md border border-input overflow-hidden relative">
        {preview ? (
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
  );
});
