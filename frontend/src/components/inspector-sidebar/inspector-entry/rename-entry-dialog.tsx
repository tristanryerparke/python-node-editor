import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  updateInspectorData,
  type InspectorPathSegment,
  type InspectorEntryState,
} from "@/stores/inspectorStore";
import { getDefaultEntryTitle } from "./shared";

interface RenameEntryDialogProps {
  entry: InspectorEntryState;
  entryPath: InspectorPathSegment[];
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RenameEntryDialog({
  entry,
  entryPath,
  index,
  open,
  onOpenChange,
}: RenameEntryDialogProps) {
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    if (open) {
      setRenameValue(entry.customName ?? "");
    }
  }, [entry.customName, open]);

  const defaultEntryTitle = getDefaultEntryTitle(entry, index);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateInspectorData([...entryPath, "customName"], renameValue.trim());

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Rename inspector entry</DialogTitle>
            <DialogDescription>
              Set a custom label for this inspector entry.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            placeholder={defaultEntryTitle}
            className="w-full"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
