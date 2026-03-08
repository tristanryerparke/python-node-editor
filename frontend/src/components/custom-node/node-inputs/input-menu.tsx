import { MoreVertical, Trash2, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import useFlowStore, { useNodeData } from "../../../stores/flowStore";
import { INPUT_TYPE_COMPONENT_REGISTRY } from "./input-type-registry";
import useTypesStore from "@/stores/typesStore";
import type { FrontendFieldDataWrapper } from "../../../types/types";
import type { StructDescr } from "@/types/backend-schema";

interface InputMenuProps {
  path?: (string | number)[];
  fieldData: FrontendFieldDataWrapper;
}

export default function InputMenu({ path, fieldData }: InputMenuProps) {
  const deleteNodeData = useFlowStore((state) => state.deleteNodeData);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const getNodeData = useFlowStore((state) => state.getNodeData);
  const types = useTypesStore((state) => state.types);

  const nodeId = path ? path[0] : undefined;

  // Get data from Zustand store
  const dynamicInputType = useNodeData(
    nodeId ? [nodeId, "dynamicInputType"] : [],
  ) as StructDescr | null | undefined;
  const arguments_ = useNodeData(nodeId ? [nodeId, "arguments"] : []) as
    | Record<string, FrontendFieldDataWrapper>
    | undefined;

  // Handle union types - detect from fieldData
  const isUnionType =
    typeof fieldData.type === "object" && "anyOf" in fieldData.type;
  const unionTypes =
    isUnionType &&
    typeof fieldData.type === "object" &&
    "anyOf" in fieldData.type
      ? fieldData.type.anyOf
      : undefined;
  const selectedType =
    fieldData._selectedType || (unionTypes ? unionTypes[0] : undefined);
  const hasUnionTypes = unionTypes && unionTypes.length > 1;

  // Check if this type has an expandable area
  const effectiveType = selectedType || fieldData.type;
  const registryEntry =
    typeof effectiveType === "string"
      ? INPUT_TYPE_COMPONENT_REGISTRY[effectiveType]
      : undefined;

  const hasRegistryExpandable = Boolean((registryEntry as { expandable?: true } | undefined)?.expandable);
  const isUserModelType =
    typeof effectiveType === "string" &&
    Boolean(types[effectiveType] && types[effectiveType].kind === "user_model");
  const hasGenericExpandable =
    (typeof effectiveType === "object" &&
      "structureType" in effectiveType &&
      (effectiveType.structureType === "list" ||
        effectiveType.structureType === "dict")) ||
    (typeof effectiveType === "string" &&
      !registryEntry &&
      !isUserModelType);
  const hasExpandable = hasRegistryExpandable || hasGenericExpandable;
  const isExpanded = fieldData._expanded ?? false;

  // Detect if this is a dynamic list input
  const argName = path ? String(path[path.length - 1]) : "";
  const isDynamicListInput =
    fieldData._dynamicInputType === "list" &&
    dynamicInputType?.structureType === "list";

  // Detect if this is a dynamic dict input
  const isDynamicDictInput =
    fieldData._dynamicInputType === "dict" &&
    dynamicInputType?.structureType === "dict";

  // Calculate if this is the highest numbered list input for deletion purposes
  const numberedArgs = Object.keys(arguments_ || {})
    .filter((name) => /^\d+$/.test(name))
    .map((name) => parseInt(name));
  const maxListInputNumber =
    numberedArgs.length > 0 ? Math.max(...numberedArgs) : -1;
  const isHighestListInput =
    isDynamicListInput && parseInt(argName) === maxListInputNumber;

  // Show delete button if it's a dynamically created input
  // For list inputs, only show for the highest numbered input
  // For dict inputs, show for all dict inputs
  const showDeleteButton = isHighestListInput || isDynamicDictInput;

  // Determine if menu should be shown at all
  const shouldShowMenu =
    isHighestListInput || isDynamicDictInput || isUnionType || hasExpandable;

  // Return null if there's nothing to show in the menu
  if (!shouldShowMenu) {
    return null;
  }

  const handleTypeChange = (newType: string) => {
    if (path) {
      void updateNodeData([...path, "_selectedType"], newType);
    }
  };

  const handleToggleExpanded = () => {
    if (!path) return;

    const newExpandedState = !isExpanded;
    void updateNodeData([...path, "_expanded"], newExpandedState);

    // If minimizing, clear the stored height
    if (!newExpandedState) {
      deleteNodeData([...path, "_expandedHeight"]);
    }
  };

  const handleDelete = () => {
    if (!path) return;

    if (isDynamicListInput) {
      // For list inputs, only allow deleting the highest numbered input
      const argName = String(path[path.length - 1]);
      const argumentsPath = [...path.slice(0, -1)];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const argumentsData = getNodeData(argumentsPath) as Record<string, any>;

      if (!argumentsData) return;

      const argNames = Object.keys(argumentsData);
      const argNumbers = argNames
        .filter((name) => /^\d+$/.test(name))
        .map((name) => parseInt(name));

      const maxNumber = Math.max(...argNumbers);
      const currentNumber = parseInt(argName);

      // Only allow deleting the highest numbered input
      if (currentNumber !== maxNumber) {
        console.warn(
          `Can only delete the highest numbered input (${maxNumber})`,
        );
        return;
      }

      // Simple deletion - no renumbering needed
      deleteNodeData(path);
    } else {
      // For dict inputs and other cases, simple deletion
      deleteNodeData(path);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" className="shrink-0">
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="right" sideOffset={5}>
        {hasExpandable && (
          <>
            <DropdownMenuItem
              onClick={handleToggleExpanded}
              className="cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  Minimize
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  Maximize
                </>
              )}
            </DropdownMenuItem>
            {(hasUnionTypes || showDeleteButton) && <DropdownMenuSeparator />}
          </>
        )}
        {hasUnionTypes && (
          <>
            <DropdownMenuLabel>Input Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={selectedType}
              onValueChange={handleTypeChange}
            >
              {unionTypes.map((type: string) => (
                <DropdownMenuRadioItem key={type} value={type}>
                  {type}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            {showDeleteButton && <DropdownMenuSeparator />}
          </>
        )}
        {showDeleteButton && (
          <DropdownMenuItem
            variant="destructive"
            onClick={handleDelete}
            className="cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
