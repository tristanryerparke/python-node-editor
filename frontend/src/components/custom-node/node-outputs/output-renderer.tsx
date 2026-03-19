import { memo } from "react";
import SingleLineTextDisplay from "../../../common/utility-components/single-line-text-display";
import useTypesStore from "@/stores/typesStore";
import type { StructDescr } from "@/types/backend-schema";
import type { FrontendFieldDataWrapper } from "../../../types/types";

function isStructDescr(type: unknown): type is StructDescr {
  return (
    typeof type === "object" &&
    type !== null &&
    "structureType" in type &&
    "itemsType" in type
  );
}

interface OutputRendererProps {
  outputData: FrontendFieldDataWrapper;
}

function formatStructuredValue(value: unknown, itemsType: string): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";

    if (typeof value[0] === "object" && value[0] !== null) {
      return `[${value.map(() => itemsType).join(", ")}]`;
    }

    return `[${value.map((item) => String(item)).join(", ")}]`;
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value)
      .map(([key]) => `${key}: ${itemsType}`)
      .join(", ");
    return `{${entries}}`;
  }

  return String(value);
}

export default memo(function OutputRenderer({
  outputData,
}: OutputRendererProps) {
  const types = useTypesStore((state) => state.types);

  const displayValue = () => {
    if (outputData?.value !== undefined) {
      if (isStructDescr(outputData.type)) {
        const { itemsType, structureType } = outputData.type;
        const itemTypeName = typeof itemsType === "string" ? itemsType : "Any";

        if (structureType === "list") {
          return formatStructuredValue(outputData.value, itemTypeName);
        } else if (structureType === "dict") {
          return formatStructuredValue(outputData.value, itemTypeName);
        }
      }

      if (typeof outputData.type === "string") {
        const typeInfo = types[outputData.type];

        if (
          typeInfo &&
          typeInfo.kind === "user_model" &&
          typeof outputData.value === "object" &&
          outputData.value !== null
        ) {
          const fields = Object.entries(outputData.value)
            .map(([key, value]) => `${key}=${value}`)
            .join(", ");
          return `${outputData.type}(${fields})`;
        }
      }

      if (typeof outputData.value === "object") {
        if (!Array.isArray(outputData.value) && outputData.value !== null) {
          const entries = Object.entries(outputData.value)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ");
          return `{${entries}}`;
        }
        if (Array.isArray(outputData.value)) {
          return `[${outputData.value.join(", ")}]`;
        }
        return JSON.stringify(outputData.value);
      }
      return String(outputData.value);
    }
    return "";
  };

  return <SingleLineTextDisplay content={displayValue()} />;
});
