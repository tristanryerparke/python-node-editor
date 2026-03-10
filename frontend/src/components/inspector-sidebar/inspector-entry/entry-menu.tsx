import {
  Maximize2,
  Minimize2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost">
          <MoreVertical />
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
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            updateInspectorData([...entryPath, "isExpanded"], !entry.isExpanded)
          }
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
