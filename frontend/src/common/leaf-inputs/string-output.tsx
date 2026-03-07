import { memo } from "react";
import useFlowStore, { useNodeData } from "../../stores/flowStore";
import SingleLineTextDisplay from "./single-line-text-display";
import StringArea from "./string-area";

const DEFAULT_HEIGHT = 30;

interface StringOutputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputData: any;
  path: (string | number)[];
}

const ExpandedStringOutput = memo(function ExpandedStringOutput({
  outputData,
  path,
}: StringOutputProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const storedHeight = useNodeData([...path, "_expandedHeight"]) as
    | number
    | undefined;
  const height = storedHeight ?? DEFAULT_HEIGHT;
  const setHeight = (h: number) =>
    void updateNodeData([...path, "_expandedHeight"], h);

  const value =
    typeof outputData?.value === "string" ? outputData.value : "";

  return (
    <StringArea
      value={value}
      editable={false}
      height={height}
      setHeight={setHeight}
    />
  );
});

export default memo(function StringOutput({
  outputData,
  path,
}: StringOutputProps) {
  const isExpanded = outputData?._expanded ?? false;

  if (isExpanded) {
    return <ExpandedStringOutput outputData={outputData} path={path} />;
  }

  return (
    <SingleLineTextDisplay
      content={outputData?.value ? String(outputData.value) : ""}
      dimmed={!outputData?.value}
    />
  );
});
