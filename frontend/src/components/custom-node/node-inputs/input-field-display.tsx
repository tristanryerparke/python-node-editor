import { memo } from "react";
import EditableKey from "./dynamic/editable-key";
import InputMenu from "./input-menu";
import { useNodeData } from "../../../stores/flowStore";
import { INPUT_TYPE_COMPONENT_REGISTRY } from "./input-type-registry";
import { ResizableHeightProvider } from "@/common/utility-components/resizable-height";
import UserModelDisplay from "@/common/utility-components/user-model-display";
import GenericSchemaInput from "@/common/inputs/generic-schema-input";
import useTypesStore from "@/stores/typesStore";
import { useResizableHeight } from "@/hooks/useResizableHeight";
import type { FrontendFieldDataWrapper } from "../../../types/types";
import type { StructDescr, TypeSchema } from "@/types/backend-schema";
import { useInputField } from "@/hooks/useInputField";
import { formatTypeForDisplay } from "@/utils/type-formatting";

const DEFAULT_INPUT_HEIGHT = 30;

interface InputFieldDisplayProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
  disabled: boolean;
  edgeConnected: boolean;
}

export interface ControlledInputProps {
  value: unknown;
  onChange: (value: unknown, debounce?: number) => Promise<void> | void;
  disabled: boolean;
  expanded?: boolean;
  setValid?: (valid: boolean) => void;
  typeSchema?: TypeSchema;
}

export default memo(function InputFieldDisplay({
  fieldData,
  path,
  disabled,
  edgeConnected,
}: InputFieldDisplayProps) {
  const { value, setValue } = useInputField(fieldData, path);
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
  const typeName = formatTypeForDisplay(actualType);

  const controlledProps: ControlledInputProps = {
    value,
    onChange: setValue,
    disabled,
    expanded: isExpanded,
    typeSchema: actualType,
  };

  const renderMainInput = () => {
    if (isUserModel && edgeConnected) {
      if (isExpanded) {
        return <div className="flex flex-1 min-h-8" />;
      }

      return (
        <UserModelDisplay
          value={value}
          disabled={disabled}
          expanded={false}
          showEmptyTypeName={false}
          typeName={typeName}
          typeSchema={actualType}
        />
      );
    }

    if (registryEntry) {
      if (isExpanded && registryEntry.expandable) {
        return <div className="flex flex-1 min-h-8" />;
      }

      const Component = registryEntry.component;
      return <Component {...controlledProps} />;
    }

    if (isExpanded) {
      return <div className="flex flex-1 min-h-8" />;
    }

    return (
      <GenericSchemaInput
        {...controlledProps}
        placeholder={typeName}
      />
    );
  };

  const renderExpandedContent = () => {
    if (isUserModel && edgeConnected && isExpanded) {
      return (
        <div className="flex-1">
          <UserModelDisplay
            value={value}
            disabled={disabled}
            expanded={true}
            showEmptyTypeName={false}
            typeName={typeName}
            typeSchema={actualType}
          />
        </div>
      );
    }

    if (registryEntry?.expandable && isExpanded) {
      const Component = registryEntry.component;
      return (
        <div className="flex-1">
          <Component {...controlledProps} />
        </div>
      );
    }

    if (!registryEntry && isExpanded) {
      return (
        <div className="flex-1">
          <GenericSchemaInput
            {...controlledProps}
            placeholder={typeName}
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
