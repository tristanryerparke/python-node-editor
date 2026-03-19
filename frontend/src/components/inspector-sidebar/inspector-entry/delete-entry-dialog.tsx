import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteInspectorData,
  type InspectorPathSegment,
} from "@/stores/inspectorStore";

interface DeleteEntryDialogProps {
  entryPath: InspectorPathSegment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteEntryDialog({
  entryPath,
  open,
  onOpenChange,
}: DeleteEntryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete inspector entry?</DialogTitle>
          <DialogDescription>
            This will remove this inspector entry and its selected reference.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteInspectorData(entryPath[0])}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
