import { memo } from "react";
import EditableKey from "./dynamic/editable-key";
import InputMenu from "./input-menu";
import { useNodeData } from "../../../stores/flowStore";
import useTypesStore from "@/stores/typesStore";
import UserModelDisplay from "../../../common/leaf-inputs/user-model-display";
import { INPUT_TYPE_COMPONENT_REGISTRY } from "./input-type-registry";
import GenericSchemaInput from "@/common/leaf-inputs/generic-schema-input";
import GenericSchemaExpanded from "@/common/leaf-inputs/expanded/generic-schema-expanded";
import type { FrontendFieldDataWrapper } from "../../../types/types";
import type { StructDescr } from "@/types/backend-schema";

interface InputFieldDisplayProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export default memo(function InputFieldDisplay({
  fieldData,
  path,
}: InputFieldDisplayProps) {
  const types = useTypesStore((state) => state.types);
  const nodeId = path[0];
  const fieldName = path[path.length - 1];

  // Detect if this is a dynamic dict input as dict inputs have editable keys
  const dynamicInputType = useNodeData([nodeId, "dynamicInputType"]) as
    | StructDescr
    | null
    | undefined;
  const isDynamicDictInput =
    fieldData._dynamicInputType === "dict" &&
    dynamicInputType?.structureType === "dict";
  const isEditableKey = isDynamicDictInput;

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
    // For union types, use _selectedType if available, otherwise default to first type
    actualType = fieldData._selectedType || fieldData.type.anyOf[0];
  }

  const isExpanded = fieldData._expanded ?? false;

  const hasRegistryComponent =
    typeof actualType === "string" &&
    Boolean(INPUT_TYPE_COMPONENT_REGISTRY[actualType]);

  const typeInfo =
    typeof actualType === "string" ? types[actualType] : undefined;
  const isUserModel = Boolean(typeInfo && typeInfo.kind === "user_model");

  const usesGenericRenderer = !hasRegistryComponent && !isUserModel;
  const genericHideMainWhenExpanded = true;

  // Function to render the main input component
  const renderMainInput = () => {
    // Check if we have a specific component for this type
    if (typeof actualType !== "string") {
      // actualType is StructDescr or UnionDescr, handle below
    } else {
      const registryEntry = INPUT_TYPE_COMPONENT_REGISTRY[actualType];
      if (
        registryEntry &&
        typeof registryEntry === "object" &&
        "main" in registryEntry
      ) {
        // Check if we should hide the main component when expanded
        const shouldHide = isExpanded && registryEntry.hideMainWhenExpanded;

        if (shouldHide) {
          return <div className="flex flex-1 min-h-8" />;
        }

        const Component = registryEntry.main;
        return (
          <Component
            inputData={{ ...fieldData, type: actualType }}
            path={path}
          />
        );
      }
    }

    // Check if this type exists in the store and is a user_model
    if (typeof actualType === "string" && typeInfo && typeInfo.kind === "user_model") {
      return (
        <UserModelDisplay
          inputData={{ ...fieldData, type: actualType }}
          path={path}
          typeInfo={typeInfo}
        />
      );
    }

    if (usesGenericRenderer && isExpanded && genericHideMainWhenExpanded) {
      return <div className="flex flex-1 min-h-8" />;
    }

    return (
      <GenericSchemaInput
        inputData={{ ...fieldData, type: actualType }}
        path={path}
      />
    );
  };

  // Function to render the expanded component if it exists and is enabled
  const renderExpandedContent = () => {
    if (typeof actualType === "string") {
      const registryEntry = INPUT_TYPE_COMPONENT_REGISTRY[actualType];
      if (registryEntry && typeof registryEntry === "object") {
        // Check if expanded component exists and is enabled
        const expandedComponent = registryEntry.expanded;

        if (expandedComponent && isExpanded) {
          const ExpandedComponent = expandedComponent;

          return (
            <div
              className={
                registryEntry.hideMainWhenExpanded ? "flex-1" : "flex-1 mt-1.5"
              }
            >
              <ExpandedComponent
                inputData={{ ...fieldData, type: actualType }}
                path={path}
              />
            </div>
          );
        }
      }
    }

    if (!usesGenericRenderer || !isExpanded) {
      return null;
    }

    return (
      <div className={genericHideMainWhenExpanded ? "flex-1" : "flex-1 mt-1.5"}>
        <GenericSchemaExpanded
          inputData={{ ...fieldData, type: actualType }}
          path={path}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-1 items-center gap-1">
        {isEditableKey ? (
          <EditableKey fieldName={fieldName} path={path} />
        ) : (
          <span className="shrink-0">{fieldName}</span>
        )}
        <span className="shrink-0">:</span>
        <div className="flex-1 min-w-0">{renderMainInput()}</div>
        <InputMenu path={path} fieldData={fieldData} />
      </div>
      {renderExpandedContent()}
    </div>
  );
});
