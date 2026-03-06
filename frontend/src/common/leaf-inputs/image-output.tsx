import { memo } from "react";
import SingleLineTextDisplay from "./single-line-text-display";
import {
  getCacheKeyFromValue,
  isCachedValueReference,
} from "../../utils/large-data-utils";

interface ImageOutputProps {
  outputData: any;
}

export default memo(function ImageOutput({ outputData }: ImageOutputProps) {
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
      : undefined) ||
    "Generated Image";

  return <SingleLineTextDisplay content={displayName} dimmed={false} />;
});
