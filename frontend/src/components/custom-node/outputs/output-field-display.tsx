import OutputRenderer from "./output-renderer";
import OutputMenu from "./output-menu";
import { OUTPUT_TYPE_COMPONENT_REGISTRY } from "./output-type-registry";
import type { FrontendFieldDataWrapper } from "../../../types/types";

interface OutputDisplayProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export default function OutputDisplay({ fieldData, path }: OutputDisplayProps) {
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

  // Function to render the main output component
  const renderMainOutput = () => {
    if (typeof actualType !== "string") {
      return <OutputRenderer outputData={fieldData} path={path} />;
    }

    const registryEntry = OUTPUT_TYPE_COMPONENT_REGISTRY[actualType];
    if (!registryEntry || typeof registryEntry !== "object") {
      return <OutputRenderer outputData={fieldData} path={path} />;
    }

    // Check if we should hide the main component when expanded
    const isExpanded = fieldData._expanded ?? false;
    const shouldHide = isExpanded && registryEntry.hideMainWhenExpanded;

    if (shouldHide) {
      return <div className="flex flex-1 min-h-8" />;
    }

    return <OutputRenderer outputData={fieldData} path={path} />;
  };

  // Function to render the expanded component if it exists and is enabled
  const renderExpandedContent = () => {
    if (typeof actualType !== "string") {
      return null;
    }

    const registryEntry = OUTPUT_TYPE_COMPONENT_REGISTRY[actualType];
    if (!registryEntry || typeof registryEntry !== "object") {
      return null;
    }

    // Check if expanded component exists and is enabled
    const expandedComponent = registryEntry.expanded;
    const isExpanded = fieldData._expanded ?? false;

    if (!isExpanded) {
      return null;
    }

    if (expandedComponent) {
      const ExpandedComponent = expandedComponent;
      return (
        <div
          className={
            registryEntry.hideMainWhenExpanded ? "flex-1" : "flex-1 mt-1.5"
          }
        >
          <ExpandedComponent
            outputData={{ ...fieldData, type: actualType }}
            path={path}
            readOnly={true}
          />
        </div>
      );
    }

    // No separate expanded component: fall back to main component when expanded
    // (main receives outputData._expanded=true and handles both states itself)
    if (registryEntry.hideMainWhenExpanded) {
      const MainComponent = registryEntry.main;
      return (
        <div className="flex-1">
          <MainComponent
            outputData={{ ...fieldData, type: actualType }}
            path={path}
          />
        </div>
      );
    }

    return null;
  };

  return (
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
}
