import { memo } from "react";
import { ResizableHeightProvider } from "@/common/utility-components/resizable-height";
import { useOutputField } from "@/hooks/useOutputField";
import { useResizableHeight } from "@/hooks/useResizableHeight";
import type { FrontendFieldDataWrapper } from "../../../types/types";
import OutputMenu from "./output-menu";
import OutputRenderer from "./output-renderer";
import { OUTPUT_TYPE_COMPONENT_REGISTRY } from "./output-type-registry";

const DEFAULT_OUTPUT_HEIGHT = 30;

interface OutputDisplayProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export interface ControlledOutputProps {
  value: unknown;
  expanded?: boolean;
}

export default memo(function OutputDisplay({
  fieldData,
  path,
}: OutputDisplayProps) {
  const { value } = useOutputField(path);
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
  };
  const resolvedFieldData: FrontendFieldDataWrapper = {
    ...fieldData,
    type: actualType,
    value: value as FrontendFieldDataWrapper["value"],
  };

  const renderMainOutput = () => {
    if (registryEntry) {
      if (isExpanded && registryEntry.expandable) {
        return <div className="flex flex-1 min-h-8" />;
      }

      const Component = registryEntry.component;
      return <Component {...controlledProps} />;
    }

    return <OutputRenderer outputData={resolvedFieldData} />;
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
