import { memo } from "react";
import SingleLineTextDisplay from "./single-line-text-display";
import type { FrontendFieldDataWrapper } from "@/types/types";
import type { StructDescrJson } from "@/types/backend-schema";

interface DictDisplayProps {
  inputData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export default memo(function DictDisplay({ inputData }: DictDisplayProps) {
  const dictType = inputData.type as StructDescrJson;
  const value = inputData.value as Record<string, unknown> | null;

  // If there's no value, show the "attach" message
  if (value === null || value === undefined) {
    return <SingleLineTextDisplay dimmed content={"no data"} />;
  }

  // If there's a value, display it
  const displayValue = (() => {
    if (typeof value !== "object" || Array.isArray(value)) {
      return JSON.stringify(value);
    }

    const itemTypeName =
      typeof dictType.itemsType === "string" ? dictType.itemsType : "Any";

    const entries = Object.entries(value);
    if (entries.length === 0) {
      return "{}";
    }

    // Check if values are objects (show type name) or primitives (show actual value)
    const firstValue = entries[0][1];
    const valuesAreObjects =
      typeof firstValue === "object" && firstValue !== null;

    return `{${entries
      .map(([k, v]) =>
        valuesAreObjects ? `${k}: ${itemTypeName}` : `${k}: ${v}`,
      )
      .join(", ")}}`;
  })();

  return <SingleLineTextDisplay content={displayValue} dimmed />;
});
