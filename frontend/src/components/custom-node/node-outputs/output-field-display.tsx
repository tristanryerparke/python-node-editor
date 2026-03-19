import { memo } from "react";
import SingleLineTextDisplay from "@/common/utility-components/single-line-text-display";
import { ResizableHeightProvider } from "@/common/utility-components/resizable-height";
import { useOutputField } from "@/hooks/useOutputField";
import { useResizableHeight } from "@/hooks/useResizableHeight";
import useFlowStore from "@/stores/flowStore";
import type { StructDescr, TypeSchema } from "@/types/backend-schema";
import type { TypeInfo } from "@/types/environment";
import { formatUserModelValue } from "@/utils/user-model-formatting";
import type { FrontendFieldDataWrapper } from "../../../types/types";
import OutputMenu from "./output-menu";
import { OUTPUT_TYPE_COMPONENT_REGISTRY } from "@/common/outputs/output-type-registry";

const DEFAULT_OUTPUT_HEIGHT = 30;

interface OutputDisplayProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export interface ControlledOutputProps {
  value: unknown;
  expanded?: boolean;
  typeSchema?: TypeSchema;
}

function isStructDescr(type: unknown): type is StructDescr {
  return (
    typeof type === "object" &&
    type !== null &&
    "structureType" in type &&
    "itemsType" in type
  );
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

function formatOutputValue(
  value: unknown,
  type: FrontendFieldDataWrapper["type"],
  types: Record<string, TypeInfo>,
): string {
  if (value === undefined) {
    return "";
  }

  if (isStructDescr(type)) {
    const { itemsType, structureType } = type;
    const itemTypeName = typeof itemsType === "string" ? itemsType : "Any";

    if (structureType === "list" || structureType === "dict") {
      return formatStructuredValue(value, itemTypeName);
    }
  }

  if (typeof type === "string") {
    const typeInfo = types[type];

    if (
      typeInfo &&
      typeInfo.kind === "user_model" &&
      typeof value === "object" &&
      value !== null
    ) {
      return formatUserModelValue(value, type);
    }
  }

  if (typeof value === "object") {
    if (!Array.isArray(value) && value !== null) {
      const entries = Object.entries(value)
        .map(([key, fieldValue]) => `${key}: ${fieldValue}`)
        .join(", ");
      return `{${entries}}`;
    }
    if (Array.isArray(value)) {
      return `[${value.join(", ")}]`;
    }
    return JSON.stringify(value);
  }

  return String(value);
}

export default memo(function OutputDisplay({
  fieldData,
  path,
}: OutputDisplayProps) {
  const { value } = useOutputField(path);
  const types = useFlowStore((state) => state.types);
  const fieldName = path[path.length - 1];

  let actualType = fieldData.type;
  if (
    typeof fieldData.type === "object" &&
    "anyOf" in fieldData.type &&
    fieldData.type.anyOf
  ) {
    actualType = fieldData._selectedType || fieldData.type.anyOf[0];
  }

  const isExpanded = fieldData._expanded ?? false;
  const registryEntry =
    typeof actualType === "string"
      ? OUTPUT_TYPE_COMPONENT_REGISTRY[actualType]
      : undefined;
  const defaultExpandedHeight =
    registryEntry?.defaultExpandedHeight ?? DEFAULT_OUTPUT_HEIGHT;
  const { height, setHeight } = useResizableHeight(path, defaultExpandedHeight);

  const controlledProps: ControlledOutputProps = {
    value,
    expanded: isExpanded,
    typeSchema: actualType,
  };

  const renderMainOutput = () => {
    if (registryEntry) {
      if (isExpanded && registryEntry.expandable) {
        return <div className="flex flex-1 min-h-8" />;
      }

      const Component = registryEntry.component;
      return <Component {...controlledProps} />;
    }

    return (
      <SingleLineTextDisplay
        content={formatOutputValue(value, actualType, types)}
      />
    );
  };

  const renderExpandedContent = () => {
    if (!registryEntry?.expandable || !isExpanded) return null;

    const Component = registryEntry.component;
    return (
      <div className="flex-1">
        <Component {...controlledProps} />
      </div>
    );
  };

  const content = (
    <div className="flex flex-col flex-1">
      <div className="flex flex-1 items-center gap-1">
        <span className="shrink-0">{fieldName}</span>
        <span className="shrink-0">:</span>
        <div className="flex-1 min-w-0">{renderMainOutput()}</div>
        <OutputMenu path={path} fieldData={fieldData} />
      </div>
      {renderExpandedContent()}
    </div>
  );
  if (!registryEntry?.expandable) {
    return content;
  }

  return (
    <ResizableHeightProvider height={height} setHeight={setHeight}>
      {content}
    </ResizableHeightProvider>
  );
});
