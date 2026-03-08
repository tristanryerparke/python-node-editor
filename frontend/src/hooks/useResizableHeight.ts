import useFlowStore, { useNodeData } from "@/stores/flowStore";

export function useResizableHeight(
  path: (string | number)[],
  defaultHeight: number,
): { height: number; setHeight: (h: number) => void } {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const storedHeight = useNodeData([...path, "_expandedHeight"]) as
    | number
    | undefined;

  const height = storedHeight ?? defaultHeight;
  const setHeight = (h: number) =>
    void updateNodeData([...path, "_expandedHeight"], h);

  return { height, setHeight };
}
