import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import useFlowStore from "@/stores/flowStore";
import { useFieldRenderContext } from "@/common/field-render-context";

// Tailwind spacing scale: 1 unit = 0.25rem = 4px
const TAILWIND_UNIT = 4;

interface SyncedWidthHandleContextValue {
  parentWidth: number | null;
  setParentWidth: (width: number) => void;
  parentRef: React.RefObject<HTMLDivElement | null> | null;
  maxWidth?: number;
  useTailwindScale: boolean;
}

const SyncedWidthHandleContext = createContext<
  SyncedWidthHandleContextValue | undefined
>(undefined);

interface SyncedWidthHandleProviderProps {
  children: ReactNode;
  className?: string;
  maxWidth?: number;
  useTailwindScale?: boolean;
  width?: number | null;
  setWidth?: (width: number) => void;
}

export function SyncedWidthHandleProvider({
  children,
  className = "",
  maxWidth = Infinity,
  useTailwindScale = true,
  width: controlledWidth,
  setWidth: controlledSetWidth,
}: SyncedWidthHandleProviderProps) {
  const [internalWidth, setInternalWidth] = useState<number | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // Use controlled width if provided, otherwise use internal state
  const parentWidth =
    controlledWidth !== undefined ? controlledWidth : internalWidth;
  const setParentWidth = controlledSetWidth || setInternalWidth;

  // Measure parent's natural width on first render
  useEffect(() => {
    if (parentWidth !== null || !parentRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const measuredWidth = entry.contentRect.width;
        const widthInUnits = useTailwindScale
          ? Math.round(measuredWidth / TAILWIND_UNIT)
          : measuredWidth;
        setParentWidth(widthInUnits);
        resizeObserver.disconnect();
      }
    });

    resizeObserver.observe(parentRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [parentWidth, useTailwindScale, setParentWidth]);

  return (
    <SyncedWidthHandleContext.Provider
      value={{
        parentWidth,
        setParentWidth,
        parentRef,
        maxWidth,
        useTailwindScale,
      }}
    >
      <div
        ref={parentRef}
        className={parentWidth === null ? `${className} w-fit` : className}
        style={
          parentWidth !== null
            ? {
                width: useTailwindScale
                  ? `${parentWidth * TAILWIND_UNIT}px`
                  : `${parentWidth}px`,
              }
            : undefined
        }
      >
        {children}
      </div>
    </SyncedWidthHandleContext.Provider>
  );
}

function useSyncedWidthHandleContext() {
  const context = useContext(SyncedWidthHandleContext);
  if (!context) {
    throw new Error(
      "SyncedWidthHandle must be used within SyncedWidthHandleProvider",
    );
  }
  return context;
}

interface SyncedWidthHandleProps {
  children?: ReactNode;
  className?: string;
  dragMultiplier?: number;
}

export function SyncedWidthHandle({
  children,
  className = "",
  dragMultiplier,
}: SyncedWidthHandleProps) {
  const fieldCtx = useFieldRenderContext();
  // Use useContext directly (not the throwing wrapper) so we can handle
  // inspector mode gracefully without a SyncedWidthHandleProvider ancestor.
  const syncCtx = useContext(SyncedWidthHandleContext);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const handleRef = useRef<HTMLDivElement>(null);
  const currentDragWidthRef = useRef(0);
  const viewportZoom = useFlowStore((state) => state.viewport.zoom);

  const isInspector = fieldCtx?.mode === "inspector";

  // Derive values from syncCtx with fallbacks (all hooks must be called unconditionally)
  const parentWidth = syncCtx?.parentWidth ?? null;
  const setParentWidth = syncCtx?.setParentWidth ?? (() => {});
  const parentRef = syncCtx?.parentRef ?? null;
  const maxWidth = syncCtx?.maxWidth;
  const useTailwindScale = syncCtx?.useTailwindScale ?? false;

  const disabled = parentWidth === null;

  // Convert to pixels if using Tailwind scale
  const maxWidthPx =
    useTailwindScale && maxWidth !== undefined && maxWidth !== Infinity
      ? maxWidth * TAILWIND_UNIT
      : maxWidth;
  const currentWidthPx =
    useTailwindScale && parentWidth !== null
      ? parentWidth * TAILWIND_UNIT
      : (parentWidth ?? 0);
  const resolvedDragMultiplier = useMemo(() => {
    if (dragMultiplier !== undefined) {
      return dragMultiplier;
    }
    const safeZoom = viewportZoom || 1;
    return safeZoom === 0 ? 1 : 1 / safeZoom;
  }, [dragMultiplier, viewportZoom]);

  useEffect(() => {
    if (!isDragging || isInspector || !syncCtx) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - startXRef.current) * resolvedDragMultiplier;
      const newWidthPx = startWidthRef.current + deltaX;
      const clampedWidthPx =
        maxWidthPx !== undefined
          ? Math.min(newWidthPx, maxWidthPx)
          : newWidthPx;

      const valueToReport = useTailwindScale
        ? clampedWidthPx / TAILWIND_UNIT
        : clampedWidthPx;

      currentDragWidthRef.current = valueToReport;

      // Update visual preview during drag
      if (parentRef?.current) {
        parentRef.current.style.width = `${clampedWidthPx}px`;
      }
    };

    const finishDrag = () => {
      if (!isDragging) return;

      setIsDragging(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "";

      // Update state with the final dragged value
      setParentWidth(currentDragWidthRef.current);
    };

    const handleMouseUp = () => {
      finishDrag();
    };

    const handleWindowBlur = () => {
      finishDrag();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        finishDrag();
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    isDragging,
    isInspector,
    syncCtx,
    maxWidthPx,
    resolvedDragMultiplier,
    setParentWidth,
    useTailwindScale,
    parentRef,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isInspector) return;

    // Don't stopPropagation - allow parent handlers (like ResizableHeightHandle) to also receive the event
    setIsDragging(true);

    startXRef.current = e.clientX;
    startWidthRef.current = currentWidthPx;
    // Initialize the drag ref with current width
    currentDragWidthRef.current = useTailwindScale
      ? (parentWidth ?? 0)
      : currentWidthPx;
    document.body.style.cursor = "ew-resize";
  };

  // In inspector mode (or when no SyncedWidthHandleProvider ancestor exists),
  // render as a plain w-full wrapper – no width-resize behaviour.
  if (isInspector || !syncCtx) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <div
      ref={handleRef}
      className={className}
      onMouseDown={handleMouseDown}
      style={{ cursor: disabled ? "default" : "ew-resize" }}
    >
      {children}
    </div>
  );
}
