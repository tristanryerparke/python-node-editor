import { memo } from "react";
import SingleLineTextDisplay from "../utility-components/single-line-text-display";
import useTypesStore from "@/stores/typesStore";
import { OUTPUT_TYPE_COMPONENT_REGISTRY, type OutputRendererProps, isObjectRegistryEntry } from "./output-type-registry";
import type { StructDescr } from "@/types/backend-schema";

function isStructDescr(type: unknown): type is StructDescr {
  return (
    typeof type === "object" &&
    type !== null &&
    "structureType" in type &&
    "itemsType" in type
  );
}

export default memo(function OutputRenderer({
  outputData,
  path,
}: OutputRendererProps) {
  const types = useTypesStore((state) => state.types);

  // Check if there's a custom component for this type (only works for string types)
  if (typeof outputData?.type === "string") {
    const registryEntry = OUTPUT_TYPE_COMPONENT_REGISTRY[outputData.type];
    if (registryEntry) {
      // Handle new pattern with main/expanded
      if (isObjectRegistryEntry(registryEntry)) {
        const Component = registryEntry.main;
        return <Component outputData={outputData} path={path} />;
      } else {
        // Legacy direct component reference
        const Component = registryEntry;
        return <Component outputData={outputData} path={path} />;
      }
    }
  }

  const formatStructuredValue = (value: unknown, itemsType: string): string => {
    if (Array.isArray(value)) {
      if (value.length === 0) return "[]";

      // For arrays of objects, show the type name for each item
      if (typeof value[0] === "object" && value[0] !== null) {
        return `[${value.map(() => itemsType).join(", ")}]`;
      }

      // For arrays of primitives, show the actual values
      return `[${value.map((v) => String(v)).join(", ")}]`;
    }

    if (typeof value === "object" && value !== null) {
      // For dict/object structures
      const entries = Object.entries(value)
        .map(([key]) => `${key}: ${itemsType}`)
        .join(", ");
      return `{${entries}}`;
    }

    return String(value);
  };

  const displayValue = () => {
    if (outputData?.value !== undefined) {
      // Handle StructDescr types (list[T], dict[str, T], etc.)
      if (isStructDescr(outputData.type)) {
        const { itemsType, structureType } = outputData.type;
        const itemTypeName = typeof itemsType === "string" ? itemsType : "Any";

        if (structureType === "list") {
          return formatStructuredValue(outputData.value, itemTypeName);
        } else if (structureType === "dict") {
          return formatStructuredValue(outputData.value, itemTypeName);
        }
      }

      // For string types, look up type info
      if (typeof outputData.type === "string") {
        const typeInfo = types[outputData.type];

        // Handle user_model types generically
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

      // Handle different types of values
      if (typeof outputData.value === "object") {
        // Handle dicts (plain objects) without quotes on keys
        if (!Array.isArray(outputData.value) && outputData.value !== null) {
          const entries = Object.entries(outputData.value)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ");
          return `{${entries}}`;
        }
        // Handle arrays
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
