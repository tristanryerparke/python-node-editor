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
import { InspectorFieldRenderProvider } from "@/common/utility-components/field-render-context";
import EntryMenu from "./entry-menu";
import {
  getEntrySummary,
  getEntryTitle,
  isFieldTarget,
  isInputFieldTarget,
} from "./shared";
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
  const entryTitle = getEntryTitle(entry, index);
  const entrySummary = getEntrySummary(entry);
  const entryMenu = (
    <EntryMenu
      entry={entry}
      entryPath={entryPath}
      onOpenRenameDialog={onOpenRenameDialog}
      onOpenDeleteDialog={onOpenDeleteDialog}
    />
  );
  const selectorToggle = (
    <Toggle
      data-inspector-entry-toggle={entry.id}
      size="icon-xs"
      className="shrink-0"
      pressed={isSelecting}
      onPressedChange={(pressed) =>
        setActiveSelectingEntryId(pressed ? entry.id : null)
      }
    >
      <SquareMousePointer
        className={`h-3 w-3 ${isSelecting ? "text-red-500" : ""}`}
      />
    </Toggle>
  );
  const headerText = (
    <div className="min-w-0 flex-1 flex flex-row items-center gap-1">
      <span className="text-xs font-medium shrink-0 whitespace-nowrap">
        {entryTitle}
      </span>
      <span className="text-[11px] text-muted-foreground min-w-0 flex-1 truncate">
        {entrySummary}
      </span>
    </div>
  );

  const renderFieldDisplay = () => {
    if (!fieldData || !entry.selectedTarget) return null;

    if (isInput) {
      return (
        <InputFieldDisplay
          fieldData={fieldData}
          path={selectedPath}
          isExpanded={entry.isExpanded}
        />
      );
    }

    return (
      <OutputFieldDisplay
        fieldData={fieldData}
        path={selectedPath}
        isExpanded={entry.isExpanded}
      />
    );
  };

  return (
    <>
      {isRichField ? (
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <div className="-mx-1 min-w-0 flex flex-row gap-1 items-center">
            {selectorToggle}
            {headerText}
            {entryMenu}
          </div>
          <InspectorFieldRenderProvider entryId={entry.id}>
            {renderFieldDisplay()}
          </InspectorFieldRenderProvider>
        </div>
      ) : (
        <div className="-mx-1 min-w-0 flex-1 flex flex-row gap-1 items-center">
          {selectorToggle}
          {headerText}
          {entryMenu}
        </div>
      )}
    </>
  );
}
