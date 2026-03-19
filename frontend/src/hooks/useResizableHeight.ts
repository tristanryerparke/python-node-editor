import useFlowStore, { useNodeData } from "@/stores/flowStore";
import { useFieldRenderContext } from "@/common/field-render-context";

export function useResizableHeight(
  path: (string | number)[],
  defaultHeight: number,
): { height: number; setHeight: (h: number) => void } {
  const ctx = useFieldRenderContext();
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  // Always call – satisfies React hook rules even in inspector mode
  const storedNodeHeight = useNodeData([...path, "_expandedHeight"]) as
    | number
    | undefined;

  if (ctx?.mode === "inspector") {
    const height =
      ctx.getHeightForPath([...path, "_expandedHeight"]) ?? defaultHeight;
    const setHeight = (h: number) =>
      ctx.setHeightForPath([...path, "_expandedHeight"], h);
    return { height, setHeight };
  }

  const height = storedNodeHeight ?? defaultHeight;
  const setHeight = (h: number) =>
    void updateNodeData([...path, "_expandedHeight"], h);
  return { height, setHeight };
}
