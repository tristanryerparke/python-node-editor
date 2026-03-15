import OutputRenderer from "./output-renderer";
import { OUTPUT_TYPE_COMPONENT_REGISTRY, isObjectRegistryEntry } from "./output-type-registry";
import type { FrontendFieldDataWrapper } from "@/types/types";

interface OutputFieldDisplayProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
  isExpanded?: boolean;
  menu?: React.ReactNode;
}

export default function OutputFieldDisplay({
  fieldData,
  path,
  isExpanded: isExpandedProp,
  menu,
}: OutputFieldDisplayProps) {
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

  // Function to render the main output component
  const renderMainOutput = () => {
    if (typeof actualType === "string") {
      const registryEntry = OUTPUT_TYPE_COMPONENT_REGISTRY[actualType];
      if (isObjectRegistryEntry(registryEntry) && registryEntry.expandable && isExpanded) {
        return <div className="flex flex-1 min-h-8" />;
      }
    }

    return <OutputRenderer outputData={fieldData} path={path} />;
  };

  // Function to render the expanded component if it exists and is enabled
  const renderExpandedContent = () => {
    if (typeof actualType !== "string") return null;

    const registryEntry = OUTPUT_TYPE_COMPONENT_REGISTRY[actualType];
    if (!isObjectRegistryEntry(registryEntry) || !registryEntry.expandable || !isExpanded) return null;

    const Component = registryEntry.main;
    return (
      <div className="flex-1">
        <Component
          outputData={{ ...fieldData, type: actualType }}
          path={path}
        />
      </div>
    );
  };

  return (
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
}
