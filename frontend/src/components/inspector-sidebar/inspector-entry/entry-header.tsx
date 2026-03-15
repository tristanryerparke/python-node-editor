import { SquareMousePointer } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import {
  setActiveSelectingEntryId,
  type InspectorPathSegment,
  type InspectorEntryState,
} from "@/stores/inspectorStore";
import { useNodeData } from "@/stores/flowStore";
import InputFieldDisplay from "@/common/inputs/input-field-display";
import OutputFieldDisplay from "@/common/outputs/output-field-display";
import { InspectorFieldRenderProvider } from "@/common/field-render-context";
import EntryMenu from "./entry-menu";
import { getEntrySummary, getEntryTitle, isFieldTarget, isInputFieldTarget } from "./shared";
import type { FrontendFieldDataWrapper } from "@/types/types";

interface EntryHeaderProps {
  entry: InspectorEntryState;
  entryPath: InspectorPathSegment[];
  index: number;
  isSelecting: boolean;
  onOpenRenameDialog: () => void;
  onOpenDeleteDialog: () => void;
}

export default function EntryHeader({
  entry,
  entryPath,
  index,
  isSelecting,
  onOpenRenameDialog,
  onOpenDeleteDialog,
}: EntryHeaderProps) {
  const isField = isFieldTarget(entry.selectedTarget);
  const isRichField = entry.viewMode === "rich" && isField;
  const isInput =
    isField && entry.selectedTarget
      ? isInputFieldTarget(entry.selectedTarget)
      : false;

  const selectedPath = entry.selectedTarget?.path ?? [];
  const fieldData = useNodeData(selectedPath) as
    | FrontendFieldDataWrapper
    | undefined;
  const entryMenu = (
    <EntryMenu
      entry={entry}
      entryPath={entryPath}
      onOpenRenameDialog={onOpenRenameDialog}
      onOpenDeleteDialog={onOpenDeleteDialog}
    />
  );

  const renderFieldDisplay = () => {
    if (!fieldData || !entry.selectedTarget) return null;

    if (isInput) {
      return (
        <InputFieldDisplay
          fieldData={fieldData}
          path={selectedPath}
          isExpanded={entry.isExpanded}
          menu={entryMenu}
        />
      );
    }

    return (
      <OutputFieldDisplay
        fieldData={fieldData}
        path={selectedPath}
        isExpanded={entry.isExpanded}
        menu={entryMenu}
      />
    );
  };

  return (
    <>
      <Toggle
        data-inspector-entry-toggle={entry.id}
        size="icon-xs"
        className="shrink-0 self-center"
        pressed={isSelecting}
        onPressedChange={(pressed) =>
          setActiveSelectingEntryId(pressed ? entry.id : null)
        }
      >
        <SquareMousePointer
          className={`h-3 w-3 ${isSelecting ? "text-red-500" : ""}`}
        />
      </Toggle>
      {isRichField ? (
        <div className="min-w-0 flex-1">
          <InspectorFieldRenderProvider entryId={entry.id}>
            {renderFieldDisplay()}
          </InspectorFieldRenderProvider>
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">
            {getEntryTitle(entry, index)}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {getEntrySummary(entry)}
          </div>
        </div>
      )}
      {!isRichField ? entryMenu : null}
    </>
  );
}
