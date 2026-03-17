import { memo } from "react";
import { Grip } from "lucide-react";
import {
  ResizableHeight,
  ResizableHeightHandle,
  ResizableHeightProvider,
} from "./resizable-height";
import { SyncedWidthHandle } from "./synced-width-resizable";
import { Textarea } from "../../components/ui/textarea";
import { cn } from "@/lib/utils";
import { useResizableHeight } from "@/hooks/useResizableHeight";

const DEFAULT_MIN_HEIGHT = 30;
const DEFAULT_MAX_HEIGHT = 200;

export interface StringAreaViewProps {
  value: string;
  /** Called on every keystroke when editable=true. Omit for read-only. */
  onChange?: (value: string) => void;
  /** Called when the user finishes editing, e.g. on blur. */
  onCommit?: (value: string) => void;
  editable: boolean;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  /** Draws a destructive border – only relevant when editable=true */
  isInvalid?: boolean;
  /** Disables typing even when editable=true (e.g. port is connected) */
  disabled?: boolean;
}

export const StringAreaView = memo(function StringAreaView({
  value,
  onChange,
  onCommit,
  editable,
  placeholder = "",
  minHeight = DEFAULT_MIN_HEIGHT,
  maxHeight = DEFAULT_MAX_HEIGHT,
  isInvalid = false,
  disabled = false,
}: StringAreaViewProps) {
  const handleCommit = onCommit ?? onChange;

  return (
    <ResizableHeight
      minHeight={minHeight}
      maxHeight={maxHeight}
      useTailwindScale={true}
    >
      <div
        className={cn(
          "w-full h-full flex items-center justify-center rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
          editable &&
            isInvalid &&
            "border-destructive focus-within:border-destructive",
        )}
      >
        <Textarea
          value={value}
          onChange={
            editable && onChange ? (e) => onChange(e.target.value) : undefined
          }
          onBlur={
            editable && handleCommit
              ? (e) => handleCommit(e.target.value)
              : undefined
          }
          disabled={!editable || disabled}
          className={cn(
            "nopan nowheel border-none bg-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0 w-full h-full px-2 py-1",
            editable ? "nodrag" : "cursor-default",
          )}
          placeholder={placeholder}
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

export interface StringAreaProps
  extends StringAreaViewProps {
  path: (string | number)[];
  defaultHeight?: number;
}

export default memo(function StringArea({
  path,
  defaultHeight = DEFAULT_MIN_HEIGHT,
  ...props
}: StringAreaProps) {
  const { height, setHeight } = useResizableHeight(path, defaultHeight);

  return (
    <ResizableHeightProvider height={height} setHeight={setHeight}>
      <StringAreaView {...props} />
    </ResizableHeightProvider>
  );
});
