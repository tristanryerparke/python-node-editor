import { useState } from "react";
import useInspectorStore, {
  type InspectorPathSegment,
} from "@/stores/inspectorStore";
import DeleteEntryDialog from "./delete-entry-dialog";
import EntryContent from "./entry-content";
import EntryHeader from "./entry-header";
import RenameEntryDialog from "./rename-entry-dialog";
import { isFieldTarget } from "./shared";

interface InspectorEntryProps {
  entryId: string;
  index: number;
}

export default function InspectorEntry({
  entryId,
  index,
}: InspectorEntryProps) {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { entry, activeSelectingEntryId } = useInspectorStore((state) => ({
    entry: state.entries.find((inspectorEntry) => inspectorEntry.id === entryId),
    activeSelectingEntryId: state.activeSelectingEntryId,
  }));

  if (!entry) {
    return null;
  }

  const entryPath: InspectorPathSegment[] = [entryId];
  const isSelecting = activeSelectingEntryId === entryId;
  const isRichField =
    entry.viewMode === "rich" && isFieldTarget(entry.selectedTarget);

  return (
    <div className="w-full border-b border-input overflow-hidden shrink-0">
      <div
        className={`flex flex-row gap-1 px-2 py-2 ${
          isRichField ? "items-start" : "items-center"
        }`}
      >
        <EntryHeader
          entry={entry}
          entryPath={entryPath}
          index={index}
          isSelecting={isSelecting}
          onOpenRenameDialog={() => setIsRenameDialogOpen(true)}
          onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)}
        />
      </div>
      {entry.isExpanded && !isRichField ? <EntryContent entry={entry} /> : null}
      <RenameEntryDialog
        entry={entry}
        entryPath={entryPath}
        index={index}
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
      />
      <DeleteEntryDialog
        entryPath={entryPath}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </div>
  );
}
