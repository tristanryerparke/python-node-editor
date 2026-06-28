import { memo, type ReactNode } from "react";
import { ResizableHeightProvider } from "@/common/utility-components/resizable-height";
import UserModelDisplay from "@/common/utility-components/user-model-display";
import { getInputRenderer } from "./input-type-registry";
import HostResizableRendererFrame from "@/common/utility-components/host-resizable-renderer-frame";
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
  menu?: ReactNode;
  renderFieldName?: (fieldName: string | number) => ReactNode;
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

  const typeInfo =
    typeof actualType === "string" ? types[actualType] : undefined;
  const isUserModel = Boolean(typeInfo && typeInfo.kind === "user_model");
  const typeName = formatTypeForDisplay(actualType);
  const registryEntry =
    typeof actualType === "string" ? getInputRenderer(actualType) : undefined;
  const { height, setHeight } = useResizableHeight(
    path,
    registryEntry?.defaultExpandedHeight ?? DEFAULT_INPUT_HEIGHT,
  );
  const usesGenericRenderer = !registryEntry && !isUserModel;

  const controlledProps = {
    value,
    onChange: setValue,
    disabled,
    expanded: isExpanded,
    typeSchema: actualType as TypeSchema,
  };

  const inputContainerStyle =
    registryEntry?.minWidth !== undefined
      ? {
          minWidth:
            typeof registryEntry.minWidth === "number"
              ? `${registryEntry.minWidth}px`
              : registryEntry.minWidth,
        }
      : undefined;

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
      // When expanded, hide the base component only when a single component
      // renders both states (it draws its own minimized form inside the
      // expanded content). If a dedicated expandedComponent is registered,
      // keep the base (minimized) component visible above the expanded content
      // instead of blanking it out.
      if (
        isExpanded &&
        registryEntry.expandable &&
        !registryEntry.expandedComponent
      ) {
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
      <div className={`flex flex-col flex-1 ${isExpanded ? "gap-2" : ""}`}>
        <div className="flex flex-1 items-center gap-1">
          {renderFieldName ? (
            renderFieldName(fieldName)
          ) : (
            <span className="shrink-0">{fieldName}</span>
          )}
          <span className="shrink-0">:</span>
          <div className="flex-1 min-w-0" style={inputContainerStyle}>
            {renderMainInput()}
          </div>
          {menu}
        </div>
        {renderExpandedContent()}
      </div>
    </ResizableHeightProvider>
  );
});
