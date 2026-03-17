import { memo, type NamedExoticComponent } from "react";
import SingleLineTextDisplay from "../utility-components/single-line-text-display";
import ImagePreview from "../utility-components/image-preview";
import {
  getCacheKeyFromValue,
  isCachedValueReference,
} from "../../utils/large-data-utils";
import { ResizableHeightProvider } from "../utility-components/resizable-height";
import { useResizableHeight } from "@/hooks/useResizableHeight";

const DEFAULT_PREVIEW_HEIGHT = 60;

interface ImageOutputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputData: any;
  path: (string | number)[];
}

type ImageOutput = NamedExoticComponent<ImageOutputProps> & {
  expandable: true;
};

const ExpandedImageOutput = memo(function ExpandedImageOutput({
  outputData,
  path,
}: ImageOutputProps) {
  const { height, setHeight } = useResizableHeight(path, DEFAULT_PREVIEW_HEIGHT);
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
      <ResizableHeightProvider height={height} setHeight={setHeight}>
        <ImagePreview preview={preview} />
      </ResizableHeightProvider>
    </div>
  );
});

const ImageOutputMain = memo(function ImageOutput({ outputData, path }: ImageOutputProps) {
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
}) as ImageOutput;

ImageOutputMain.expandable = true;

export default ImageOutputMain as ImageOutput;
