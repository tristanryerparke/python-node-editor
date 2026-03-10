import { SquareMousePointer } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import {
  setActiveSelectingEntryId,
  type InspectorPathSegment,
  type InspectorEntryState,
} from "@/stores/inspectorStore";
import EntryMenu from "./entry-menu";
import { getEntrySummary, getEntryTitle } from "./shared";

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
  return (
    <div className="w-full px-1 pt-1 flex flex-row items-center gap-1">
      <Toggle
        data-inspector-entry-toggle={entry.id}
        size="icon-sm"
        pressed={isSelecting}
        onPressedChange={(pressed) =>
          setActiveSelectingEntryId(pressed ? entry.id : null)
        }
      >
        <SquareMousePointer className={isSelecting ? "text-red-500" : ""} />
      </Toggle>
      <div className="min-w-0 flex-1 px-1">
        <div className="text-sm font-medium truncate">
          {getEntryTitle(entry, index)}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {getEntrySummary(entry)}
        </div>
      </div>
      <EntryMenu
        entry={entry}
        entryPath={entryPath}
        onOpenRenameDialog={onOpenRenameDialog}
        onOpenDeleteDialog={onOpenDeleteDialog}
      />
    </div>
  );
}
