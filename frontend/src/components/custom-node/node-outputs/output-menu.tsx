import { useState } from "react";
import { MoreVertical, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import useFlowStore from "../../../stores/flowStore";
import { OUTPUT_TYPE_COMPONENT_REGISTRY } from "./output-type-registry";
import type { FrontendFieldDataWrapper } from "../../../types/types";

interface OutputMenuProps {
  path: (string | number)[];
  fieldData: FrontendFieldDataWrapper;
}

export default function OutputMenu({ path, fieldData }: OutputMenuProps) {
  const [open, setOpen] = useState(false);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const deleteNodeData = useFlowStore((state) => state.deleteNodeData);

  // Handle union types - detect from fieldData
  const isUnionType =
    typeof fieldData.type === "object" && "anyOf" in fieldData.type;
  const selectedType =
    fieldData._selectedType ||
    (isUnionType &&
    typeof fieldData.type === "object" &&
    "anyOf" in fieldData.type
      ? fieldData.type.anyOf[0]
      : undefined);

  // Check if this type has an expandable area
  const effectiveType = selectedType || fieldData.type;
  const registryEntry =
    typeof effectiveType === "string"
      ? OUTPUT_TYPE_COMPONENT_REGISTRY[effectiveType]
      : undefined;
  const hasExpandable = (registryEntry as { expandable?: true } | undefined)?.expandable;
  const isExpanded = fieldData._expanded ?? false;

  // Only show menu if there's something expandable
  const shouldShowMenu = hasExpandable;

  // Return null if there's nothing to show in the menu
  if (!shouldShowMenu) {
    return null;
  }

  const handleToggleExpanded = () => {
    const newExpandedState = !isExpanded;
    void updateNodeData([...path, "_expanded"], newExpandedState);
    setOpen(false);

    // If minimizing, clear the stored height
    if (!newExpandedState) {
      deleteNodeData([...path, "_expandedHeight"]);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" className="shrink-0">
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        side="right"
        sideOffset={5}
        onInteractOutside={() => setOpen(false)}
      >
        {hasExpandable && (
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
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
