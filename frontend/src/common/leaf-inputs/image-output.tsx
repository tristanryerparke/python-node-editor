import { memo } from "react";
import useFlowStore, { useNodeData } from "../../stores/flowStore";
import SingleLineTextDisplay from "./single-line-text-display";
import ImagePreview from "./image-preview";
import {
  getCacheKeyFromValue,
  isCachedValueReference,
} from "../../utils/large-data-utils";

const DEFAULT_PREVIEW_HEIGHT = 60;

interface ImageOutputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputData: any;
  path: (string | number)[];
}

const ExpandedImageOutput = memo(function ExpandedImageOutput({
  outputData,
  path,
}: ImageOutputProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const storedHeight = useNodeData([...path, "_expandedHeight"]) as
    | number
    | undefined;
  const height = storedHeight ?? DEFAULT_PREVIEW_HEIGHT;
  const setHeight = (h: number) =>
    void updateNodeData([...path, "_expandedHeight"], h);

  const imageValue = isCachedValueReference(outputData?.value)
    ? outputData.value
    : undefined;
  const cacheKey = getCacheKeyFromValue(outputData?.value);
  const preview =
    typeof imageValue?.preview === "string" ? imageValue.preview : undefined;
  const displayName =
    (typeof imageValue?.displayName === "string"
      ? imageValue.displayName
      : undefined) ?? "Generated Image";

  return (
    <div className="flex flex-col flex-1 gap-1.5">
      <SingleLineTextDisplay
        content={cacheKey ? displayName : "No image"}
        dimmed={!cacheKey}
      />
      <ImagePreview
        preview={preview}
        height={height}
        setHeight={setHeight}
      />
    </div>
  );
});

export default memo(function ImageOutput({ outputData, path }: ImageOutputProps) {
  const isExpanded = outputData?._expanded ?? false;

  if (isExpanded) {
    return <ExpandedImageOutput outputData={outputData} path={path} />;
  }

  const imageValue = isCachedValueReference(outputData?.value)
    ? outputData.value
    : undefined;
  const cacheKey = getCacheKeyFromValue(outputData?.value);

  if (!cacheKey) {
    return <SingleLineTextDisplay content="No image" dimmed={true} />;
  }

  const displayName =
    (typeof imageValue?.displayName === "string"
      ? imageValue.displayName
      : undefined) ?? "Generated Image";

  return <SingleLineTextDisplay content={displayName} dimmed={false} />;
});
