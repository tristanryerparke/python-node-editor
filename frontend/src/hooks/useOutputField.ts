import useFlowStore, { useNodeData } from "@/stores/flowStore";

export interface OutputFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputData: any;
  path: (string | number)[];
}

interface UseOutputFieldResult {
  isExpanded: boolean;
  height: number;
  setHeight: (h: number) => void;
}

export function useOutputField(
  outputData: OutputFieldProps["outputData"],
  path: OutputFieldProps["path"],
  defaultHeight: number,
): UseOutputFieldResult {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const storedHeight = useNodeData([...path, "_expandedHeight"]) as
    | number
    | undefined;

  const isExpanded = outputData?._expanded ?? false;
  const height = storedHeight ?? defaultHeight;
  const setHeight = (h: number) =>
    void updateNodeData([...path, "_expandedHeight"], h);

  return { isExpanded, height, setHeight };
}
