import { memo } from "react";
import SingleLineTextDisplay from "../utility-components/single-line-text-display";
import ImagePreview from "../utility-components/image-preview";
import {
  getCacheKeyFromValue,
  isCachedValueReference,
} from "../../utils/large-data-utils";
import type { ControlledOutputProps } from "../../components/custom-node/node-outputs/output-field-display";

export default memo(function ImageOutput({
  value,
  expanded = false,
}: ControlledOutputProps) {
  const imageValue = isCachedValueReference(value) ? value : undefined;
  const cacheKey = getCacheKeyFromValue(value);
  const preview =
    typeof imageValue?.preview === "string" ? imageValue.preview : undefined;
  const displayName =
    (typeof imageValue?.displayName === "string"
      ? imageValue.displayName
      : undefined) ?? "Generated Image";

  if (expanded) {
    return (
      <div className="flex flex-col flex-1 gap-1.5">
        <SingleLineTextDisplay
          content={cacheKey ? displayName : "No image"}
          dimmed={!cacheKey}
        />
        <ImagePreview preview={preview} />
      </div>
    );
  }

  if (!cacheKey) {
    return <SingleLineTextDisplay content="No image" dimmed={true} />;
  }

  return <SingleLineTextDisplay content={displayName} dimmed={false} />;
});
