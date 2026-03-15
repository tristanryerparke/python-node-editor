import { memo } from "react";
import useTypesStore from "@/stores/typesStore";
import UserModelDisplay from "./user-model-display";
import { INPUT_TYPE_COMPONENT_REGISTRY, isObjectRegistryEntry } from "./input-type-registry";
import GenericSchemaInput from "./generic-schema-input";
import type { FrontendFieldDataWrapper } from "@/types/types";

interface InputFieldDisplayProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
  isExpanded?: boolean;
  menu?: React.ReactNode;
  renderFieldName?: (fieldName: string | number) => React.ReactNode;
}

export default memo(function InputFieldDisplay({
  fieldData,
  path,
  isExpanded: isExpandedProp,
  menu,
  renderFieldName,
}: InputFieldDisplayProps) {
  const types = useTypesStore((state) => state.types);
  const fieldName = path[path.length - 1];

  if (!fieldData) {
    return <div>No data</div>;
  }

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

  const hasRegistryComponent =
    typeof actualType === "string" &&
    Boolean(INPUT_TYPE_COMPONENT_REGISTRY[actualType]);

  const typeInfo =
    typeof actualType === "string" ? types[actualType] : undefined;
  const isUserModel = Boolean(typeInfo && typeInfo.kind === "user_model");

  const usesGenericRenderer = !hasRegistryComponent && !isUserModel;

  // Function to render the main input component
  const renderMainInput = () => {
    if (typeof actualType === "string") {
      const registryEntry = INPUT_TYPE_COMPONENT_REGISTRY[actualType];
      if (registryEntry) {
        if (isExpanded && isObjectRegistryEntry(registryEntry) && registryEntry.expandable) {
          return <div className="flex flex-1 min-h-8" />;
        }
        const Component = isObjectRegistryEntry(registryEntry)
          ? registryEntry.main
          : registryEntry;
        return (
          <Component
            inputData={{ ...fieldData, type: actualType, _expanded: isExpanded }}
            path={path}
          />
        );
      }
    }

    // Check if this type exists in the store and is a user_model
    if (typeof actualType === "string" && typeInfo && typeInfo.kind === "user_model") {
      return (
        <UserModelDisplay
          inputData={{ ...fieldData, type: actualType, _expanded: isExpanded }}
          path={path}
          typeInfo={typeInfo}
        />
      );
    }

    if (usesGenericRenderer && isExpanded) {
      return <div className="flex flex-1 min-h-8" />;
    }

    return (
      <GenericSchemaInput
        inputData={{ ...fieldData, type: actualType, _expanded: isExpanded }}
        path={path}
      />
    );
  };

  // Function to render the expanded component if it exists and is enabled
  const renderExpandedContent = () => {
    if (typeof actualType === "string") {
      const registryEntry = INPUT_TYPE_COMPONENT_REGISTRY[actualType];
      if (isObjectRegistryEntry(registryEntry) && registryEntry.expandable && isExpanded) {
        const Component = registryEntry.main;
        return (
          <div className="flex-1">
            <Component
              inputData={{ ...fieldData, type: actualType, _expanded: isExpanded }}
              path={path}
            />
          </div>
        );
      }
    }

    if (!usesGenericRenderer || !isExpanded) {
      return null;
    }

    return (
      <div className="flex-1">
        <GenericSchemaInput
          inputData={{ ...fieldData, type: actualType, _expanded: isExpanded }}
          path={path}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-1 items-center gap-1">
        {renderFieldName ? (
          renderFieldName(fieldName)
        ) : (
          <span className="shrink-0">{fieldName}</span>
        )}
        <span className="shrink-0">:</span>
        <div className="flex-1 min-w-0">{renderMainInput()}</div>
        {menu}
      </div>
      {renderExpandedContent()}
    </div>
  );
});
