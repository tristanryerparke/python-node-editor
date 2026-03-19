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
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const deleteNodeData = useFlowStore((state) => state.deleteNodeData);

  let actualType = fieldData.type;
  if (
    typeof fieldData.type === "object" &&
    "anyOf" in fieldData.type &&
    fieldData.type.anyOf
  ) {
    actualType = fieldData._selectedType || fieldData.type.anyOf[0];
  }

  const registryEntry =
    typeof actualType === "string"
      ? OUTPUT_TYPE_COMPONENT_REGISTRY[actualType]
      : undefined;
  const hasExpandable = registryEntry?.expandable ?? false;
  const isExpanded = fieldData._expanded ?? false;

  if (!hasExpandable) {
    return null;
  }

  const handleToggleExpanded = () => {
    const newExpandedState = !isExpanded;
    void updateNodeData([...path, "_expanded"], newExpandedState);

    // If minimizing, clear the stored height
    if (!newExpandedState) {
      deleteNodeData([...path, "_expandedHeight"]);
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
