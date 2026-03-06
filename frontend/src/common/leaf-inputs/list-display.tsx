import { memo } from "react";
import { Pencil } from "lucide-react";
import SingleLineTextDisplay from "./single-line-text-display";
import { Button } from "@/components/ui/button";
import type { FrontendFieldDataWrapper } from "@/types/types";
import type { StructDescrJson } from "@/types/backend-schema";

interface ListDisplayProps {
  inputData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

function ListEditButton() {
  return (
    <Button variant="ghost" size="icon-xs" className="shrink-0 rounded-sm">
      <Pencil className="h-3 w-3" />
    </Button>
  );
}

export default memo(function ListDisplay({ inputData, path }: ListDisplayProps) {
  const listType = inputData.type as StructDescrJson;
  const value = inputData.value as unknown[] | null;

  // If there's no value, show the "attach" message
  if (value === null || value === undefined) {
    return (
      <SingleLineTextDisplay
        dimmed
        content={"no data"}
        path={path}
        rightButton={ListEditButton}
      />
    );
  }

  // If there's a value, display it
  const displayValue = (() => {
    if (!Array.isArray(value)) {
      return JSON.stringify(value);
    }

    if (value.length === 0) {
      return "[]";
    }

    const itemTypeName =
      typeof listType.itemsType === "string" ? listType.itemsType : "Any";

    // For arrays of objects, show the type name for each item
    if (typeof value[0] === "object" && value[0] !== null) {
      return `[${value.map(() => itemTypeName).join(", ")}]`;
    }

    // For arrays of primitives, show the actual values
    return `[${value.map((v) => String(v)).join(", ")}]`;
  })();

  return <SingleLineTextDisplay content={displayValue} dimmed />;
});
