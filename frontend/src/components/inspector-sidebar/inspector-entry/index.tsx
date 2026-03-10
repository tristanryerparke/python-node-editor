import { useState } from "react";
import useInspectorStore, {
  type InspectorPathSegment,
} from "@/stores/inspectorStore";
import DeleteEntryDialog from "./delete-entry-dialog";
import EntryContent from "./entry-content";
import EntryHeader from "./entry-header";
import RenameEntryDialog from "./rename-entry-dialog";

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

  return (
    <div className="w-full border-b border-input overflow-hidden shrink-0 pb-1">
      <EntryHeader
        entry={entry}
        entryPath={entryPath}
        index={index}
        isSelecting={isSelecting}
        onOpenRenameDialog={() => setIsRenameDialogOpen(true)}
        onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)}
      />
      {entry.isExpanded ? <EntryContent entry={entry} /> : null}
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
