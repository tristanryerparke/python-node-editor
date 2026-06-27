import { memo } from "react";
import SingleLineTextDisplay from "../utility-components/single-line-text-display";
import { StringArea } from "../utility-components/string-area";
import type { ControlledOutputProps } from "@/common/renderers/types";

export default memo(function StringOutput({
  value,
  expanded = false,
}: ControlledOutputProps) {
  const stringValue = typeof value === "string" ? value : "";
  return (
    expanded ? (
      <StringArea value={stringValue} editable={false} />
    ) : (
      <SingleLineTextDisplay content={stringValue} dimmed={!stringValue} />
    )
  );
});
