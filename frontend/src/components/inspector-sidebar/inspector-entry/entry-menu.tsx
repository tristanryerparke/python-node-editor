import {
  Braces,
  Maximize2,
  Minimize2,
  MoreVertical,
  Pencil,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "t-components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  updateInspectorData,
  type InspectorPathSegment,
  type InspectorEntryState,
} from "@/stores/inspectorStore";
import { useNodeData } from "@/stores/flowStore";
import {
  useInputFieldExpandable,
  useOutputFieldExpandable,
} from "@/common/field-menu-items/use-field-expandable";
import UnionTypeMenuItems from "@/common/field-menu-items/union-type-menu-items";
import { isFieldTarget, isInputFieldTarget } from "./shared";
import type { FrontendFieldDataWrapper } from "@/types/types";

interface EntryMenuProps {
  entry: InspectorEntryState;
  entryPath: InspectorPathSegment[];
  onOpenRenameDialog: () => void;
  onOpenDeleteDialog: () => void;
}

export default function EntryMenu({
  entry,
  entryPath,
  onOpenRenameDialog,
  onOpenDeleteDialog,
}: EntryMenuProps) {
  const isField = isFieldTarget(entry.selectedTarget);
  const isInput =
    isField && entry.selectedTarget
      ? isInputFieldTarget(entry.selectedTarget)
      : false;
  const isRichMode = entry.viewMode === "rich" && isField;

  const selectedPath = entry.selectedTarget?.path ?? [];
  const fieldData = useNodeData(selectedPath) as
    | FrontendFieldDataWrapper
    | undefined;

  // Call both hooks unconditionally (React rules) but pass null when not applicable
  const inputExpandable = useInputFieldExpandable(
    isField && isInput ? fieldData ?? null : null,
  );
  const outputExpandable = useOutputFieldExpandable(
    isField && !isInput ? fieldData ?? null : null,
  );
  const hasExpandable = isInput ? inputExpandable : outputExpandable;

  // In rich mode: only show expand if field supports it
  // In JSON mode: always show expand (controls JSON viewer visibility)
  const showExpandItem = isRichMode ? hasExpandable : true;

  // View mode toggle only available when targeting a specific field
  const showViewModeToggle = isField;

  // Union type selector only in rich mode for input fields
  const hasUnionTypes =
    isRichMode &&
    isInput &&
    fieldData &&
    typeof fieldData.type === "object" &&
    "anyOf" in fieldData.type &&
    fieldData.type.anyOf &&
    fieldData.type.anyOf.length > 1;

  const handleToggleViewMode = () => {
    const newMode = entry.viewMode === "rich" ? "json" : "rich";
    updateInspectorData([...entryPath, "viewMode"], newMode);
  };

  const handleToggleExpanded = () => {
    updateInspectorData([...entryPath, "isExpanded"], !entry.isExpanded);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" className="shrink-0">
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
        <DropdownMenuItem
          onClick={onOpenRenameDialog}
          className="cursor-pointer"
        >
          <Pencil className="h-4 w-4" />
          Rename
        </DropdownMenuItem>
        {showViewModeToggle && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleToggleViewMode}
              className="cursor-pointer"
            >
              {isRichMode ? (
                <>
                  <Braces className="h-4 w-4" />
                  View as JSON
                </>
              ) : (
                <>
                  <SlidersHorizontal className="h-4 w-4" />
                  View as Rich
                </>
              )}
            </DropdownMenuItem>
          </>
        )}
        {showExpandItem && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleToggleExpanded}
              className="cursor-pointer"
            >
              {entry.isExpanded ? (
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
          </>
        )}
        {hasUnionTypes && fieldData && (
          <>
            <DropdownMenuSeparator />
            <UnionTypeMenuItems
              fieldData={fieldData}
              path={selectedPath}
            />
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={onOpenDeleteDialog}
          className="cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
