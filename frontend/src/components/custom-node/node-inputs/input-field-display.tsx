import { memo, type ComponentType } from "react";
import EditableKey from "./dynamic/editable-key";
import InputMenu from "./input-menu";
import { useNodeData } from "../../../stores/flowStore";
import useTypesStore from "@/stores/typesStore";
import UserModelDisplay from "../../../common/inputs/user-model-display";
import { INPUT_TYPE_COMPONENT_REGISTRY } from "./input-type-registry";
import { ResizableHeightProvider } from "@/common/utility-components/resizable-height";
import GenericSchemaInput from "@/common/inputs/generic-schema-input";
import type { CustomInputProps } from "@/hooks/useInputField";
import { useResizableHeight } from "@/hooks/useResizableHeight";
import type { FrontendFieldDataWrapper } from "../../../types/types";
import type { StructDescr } from "@/types/backend-schema";

const DEFAULT_INPUT_HEIGHT = 30;

interface InputFieldDisplayProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
  disabled: boolean;
}

export default memo(function InputFieldDisplay({
  fieldData,
  path,
  disabled,
}: InputFieldDisplayProps) {
  const types = useTypesStore((state) => state.types);
  const { height, setHeight } = useResizableHeight(path, DEFAULT_INPUT_HEIGHT);
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

  // Handle union types - check if type is an object with anyOf
  let actualType = fieldData.type;
  if (
    typeof fieldData.type === "object" &&
    "anyOf" in fieldData.type
  ) {
    // For union types, use _selectedType if available, otherwise default to first type
    actualType = fieldData._selectedType || fieldData.type.anyOf[0];
  }

  const isExpanded = fieldData._expanded ?? false;
  const registryEntry =
    typeof actualType === "string"
      ? INPUT_TYPE_COMPONENT_REGISTRY[actualType]
      : undefined;
  const typeInfo =
    typeof actualType === "string" ? types[actualType] : undefined;
  const isUserModel = Boolean(typeInfo && typeInfo.kind === "user_model");
  const resolvedFieldData = { ...fieldData, type: actualType };
  const componentEntry = isUserModel
    ? undefined
    : registryEntry ?? {
        component: GenericSchemaInput as ComponentType<CustomInputProps>,
        expandable: true,
      };

  const renderMainInput = () => {
    if (componentEntry) {
      if (isExpanded && componentEntry.expandable) {
        return <div className="flex flex-1 min-h-8" />;
      }

      const Component = componentEntry.component;
      return (
        <Component
          inputData={resolvedFieldData}
          path={path}
          disabled={disabled}
        />
      );
    }

    if (isUserModel && typeInfo) {
      return (
        <UserModelDisplay
          inputData={resolvedFieldData}
          path={path}
          disabled={disabled}
          typeInfo={typeInfo}
        />
      );
    }

    return null;
  };

  const renderExpandedContent = () => {
    if (componentEntry?.expandable && isExpanded) {
      const Component = componentEntry.component;
      return (
        <div className="flex-1">
          <Component
            inputData={resolvedFieldData}
            path={path}
            disabled={disabled}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <ResizableHeightProvider height={height} setHeight={setHeight}>
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
    </ResizableHeightProvider>
  );
});
