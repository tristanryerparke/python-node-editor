import { getOutputRenderer } from "./output-type-registry";
import SingleLineTextDisplay from "../utility-components/single-line-text-display";
import HostResizableRendererFrame from "../utility-components/host-resizable-renderer-frame";
import { ResizableHeightProvider } from "../utility-components/resizable-height";
import useFlowStore from "@/stores/flowStore";
import { useResizableHeight } from "@/hooks/useResizableHeight";
import type { StructDescr, TypeSchema } from "@/types/backend-schema";
import type { TypeInfo } from "@/types/environment";
import type { FrontendFieldDataWrapper } from "@/types/types";

const DEFAULT_OUTPUT_HEIGHT = 30;

interface OutputFieldDisplayProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
  isExpanded?: boolean;
  menu?: React.ReactNode;
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

    return `[${value.map((v) => String(v)).join(", ")}]`;
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value)
      .map(([key, v]) => {
        // Show the actual value for primitives, but the type name for
        // nested objects/arrays (mirrors how lists are formatted).
        const valStr =
          typeof v === "object" && v !== null ? itemsType : String(v);
        return `${key}: ${valStr}`;
      })
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
      const fields = Object.entries(value)
        .map(([key, fieldValue]) => `${key}=${fieldValue}`)
        .join(", ");
      return `${type}(${fields})`;
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

export default function OutputFieldDisplay({
  fieldData,
  path,
  isExpanded: isExpandedProp,
  menu,
}: OutputFieldDisplayProps) {
  const types = useFlowStore((state) => state.types);
  const fieldName = path[path.length - 1];

  // Handle union types - check if type is an object with anyOf
  let actualType = fieldData.type;
  if (
    typeof fieldData.type === "object" &&
    "anyOf" in fieldData.type &&
    fieldData.type.anyOf
  ) {
    actualType = fieldData._selectedType || fieldData.type.anyOf[0];
  }

  const isExpanded = isExpandedProp ?? (fieldData._expanded ?? false);
  const registryEntry =
    typeof actualType === "string" ? getOutputRenderer(actualType) : undefined;
  const defaultExpandedHeight =
    registryEntry?.defaultExpandedHeight ?? DEFAULT_OUTPUT_HEIGHT;
  const { height, setHeight } = useResizableHeight(path, defaultExpandedHeight);
  const controlledProps = {
    value: fieldData.value,
    expanded: isExpanded,
    typeSchema: actualType as TypeSchema,
  };

  // Function to render the main output component
  const renderMainOutput = () => {
    // When expanded, hide the base component only when a single component
    // renders both states. If a dedicated expandedComponent is registered,
    // keep the base (minimized) component visible above the expanded content
    // instead of blanking it out.
    if (
      registryEntry?.expandable &&
      isExpanded &&
      !registryEntry.expandedComponent
    ) {
      return <div className="flex flex-1 min-h-8" />;
    }

    if (registryEntry) {
      const Component = registryEntry.component;
      return <Component {...controlledProps} />;
    }

    return (
      <SingleLineTextDisplay
        content={formatOutputValue(fieldData.value, actualType, types)}
      />
    );
  };

  // Function to render the expanded component if it exists and is enabled
  const renderExpandedContent = () => {
    if (!registryEntry?.expandable || !isExpanded) return null;

    const ExpandedComponent =
      registryEntry.expandedComponent ?? registryEntry.component;
    const expandedContent = (
      <ExpandedComponent {...controlledProps} expanded={true} />
    );

    if (registryEntry.expandedComponent) {
      return (
        <HostResizableRendererFrame
          minHeight={registryEntry.minExpandedHeight}
          maxHeight={registryEntry.maxExpandedHeight}
        >
          {expandedContent}
        </HostResizableRendererFrame>
      );
    }

    return <div className="flex-1">{expandedContent}</div>;
  };

  const content = (
    <div className="flex flex-col flex-1">
      <div className="flex flex-1 items-center gap-1">
        <span className="shrink-0">{fieldName}</span>
        <span className="shrink-0">:</span>
        <div className="flex-1 min-w-0">{renderMainOutput()}</div>
        {menu}
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
}
