import { memo } from "react";
import { Grip } from "lucide-react";
import {
  ResizableHeight,
  ResizableHeightHandle,
} from "./resizable-height";
import { SyncedWidthHandle } from "./synced-width-resizable";
import { Textarea } from "../../components/ui/textarea";
import { cn } from "@/lib/utils";
import { useResizableHeight } from "@/hooks/useResizableHeight";

const DEFAULT_MIN_HEIGHT = 30;
const DEFAULT_MAX_HEIGHT = 200;

export interface StringAreaProps {
  value: string;
  /** Called on every keystroke when editable=true. Omit for read-only. */
  onChange?: (value: string) => void;
  editable: boolean;
  path: (string | number)[];
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  /** Draws a destructive border – only relevant when editable=true */
  isInvalid?: boolean;
  /** Disables typing even when editable=true (e.g. port is connected) */
  isConnected?: boolean;
}

export default memo(function StringArea({
  value,
  onChange,
  editable,
  path,
  defaultHeight = DEFAULT_MIN_HEIGHT,
  minHeight = DEFAULT_MIN_HEIGHT,
  maxHeight = DEFAULT_MAX_HEIGHT,
  isInvalid = false,
  isConnected = false,
}: StringAreaProps) {
  const { height, setHeight } = useResizableHeight(path, defaultHeight);
  return (
    <ResizableHeight
      height={height}
      setHeight={setHeight}
      minHeight={minHeight}
      maxHeight={maxHeight}
      useTailwindScale={true}
    >
      <div
        className={cn(
          "w-full h-full flex items-center justify-center bg-muted/30 rounded-md border border-input",
          editable && isInvalid && "border-destructive",
        )}
      >
        <Textarea
          value={value}
          onChange={
            editable && onChange ? (e) => onChange(e.target.value) : undefined
          }
          onBlur={
            editable && onChange ? (e) => onChange(e.target.value) : undefined
          }
          disabled={!editable || isConnected}
          className={cn(
            "nopan nowheel border-none w-full h-full",
            editable ? "nodrag" : "cursor-default",
          )}
          placeholder=""
          style={{
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            // prevent the disabled-state from dimming the read-only view
            opacity: !editable ? 1 : undefined,
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
  );
});
