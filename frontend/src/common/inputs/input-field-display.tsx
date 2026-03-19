import { memo } from "react";
import { ResizableHeightProvider } from "@/common/utility-components/resizable-height";
import UserModelDisplay from "@/common/utility-components/user-model-display";
import { INPUT_TYPE_COMPONENT_REGISTRY } from "./input-type-registry";
import GenericSchemaInput from "./generic-schema-input";
import useFlowStore from "@/stores/flowStore";
import { useInputField } from "@/hooks/useInputField";
import { useResizableHeight } from "@/hooks/useResizableHeight";
import { formatTypeForDisplay } from "@/utils/type-formatting";
import type { TypeSchema } from "@/types/backend-schema";
import type { FrontendFieldDataWrapper } from "@/types/types";

const DEFAULT_INPUT_HEIGHT = 30;

interface InputFieldDisplayProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
  disabled?: boolean;
  edgeConnected?: boolean;
  isExpanded?: boolean;
  menu?: React.ReactNode;
  renderFieldName?: (fieldName: string | number) => React.ReactNode;
}

export default memo(function InputFieldDisplay({
  fieldData,
  path,
  disabled = false,
  edgeConnected = false,
  isExpanded: isExpandedProp,
  menu,
  renderFieldName,
}: InputFieldDisplayProps) {
  const { value, setValue } = useInputField(fieldData, path);
  const types = useFlowStore((state) => state.types);
  const { height, setHeight } = useResizableHeight(path, DEFAULT_INPUT_HEIGHT);
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

  const typeInfo =
    typeof actualType === "string" ? types[actualType] : undefined;
  const isUserModel = Boolean(typeInfo && typeInfo.kind === "user_model");
  const typeName = formatTypeForDisplay(actualType);
  const registryEntry =
    typeof actualType === "string"
      ? INPUT_TYPE_COMPONENT_REGISTRY[actualType]
      : undefined;
  const usesGenericRenderer = !registryEntry && !isUserModel;

  const controlledProps = {
    value,
    onChange: setValue,
    disabled,
    expanded: isExpanded,
    typeSchema: actualType as TypeSchema,
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

    if (usesGenericRenderer && isExpanded) {
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

    if (!usesGenericRenderer || !isExpanded) {
      return null;
    }

    return (
      <div className="flex-1">
        <GenericSchemaInput
          {...controlledProps}
          placeholder={typeName}
        />
      </div>
    );
  };

  return (
    <ResizableHeightProvider height={height} setHeight={setHeight}>
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
    </ResizableHeightProvider>
  );
});
