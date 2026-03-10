import { Copy, Check, PanelTopClose, PanelTopOpen, SquareMousePointer, Trash } from "lucide-react";
import { useNodeData } from "../../stores/flowStore";
import useInspectorStore from "../../stores/inspectorStore";
import { Toggle } from "../../components/ui/toggle";
import { Button } from "../../components/ui/button";
import JsonViewer from "../custom-node/json-viewer";
import { JsonViewer as JsonTreeViewer } from "../ui/json-tree-viewer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface InspectorEntryProps {
  entryId: string;
  index: number;
}

function formatInspectorTargetSummary(
  nodeId: string,
  path: (string | number)[],
) {
  const remainingPath = path.slice(1).map(String).join(":");
  const compactNodeId =
    nodeId.length > 12 ? `${nodeId.slice(0, 8)}-...-${nodeId.slice(-4)}` : nodeId;

  return remainingPath ? `${compactNodeId}:${remainingPath}` : nodeId;
}

export default function InspectorEntry({
  entryId,
  index,
}: InspectorEntryProps) {
  const {
    entry,
    activeSelectingEntryId,
    deleteDialogEntryId,
    copiedPathEntryId,
    setActiveSelectingEntryId,
    setEntryExpanded,
    setDeleteDialogEntryId,
    setCopiedPathEntryId,
    removeEntry,
  } = useInspectorStore((state) => ({
    entry: state.entries.find((inspectorEntry) => inspectorEntry.id === entryId),
    activeSelectingEntryId: state.activeSelectingEntryId,
    deleteDialogEntryId: state.deleteDialogEntryId,
    copiedPathEntryId: state.copiedPathEntryId,
    setActiveSelectingEntryId: state.setActiveSelectingEntryId,
    setEntryExpanded: state.setEntryExpanded,
    setDeleteDialogEntryId: state.setDeleteDialogEntryId,
    setCopiedPathEntryId: state.setCopiedPathEntryId,
    removeEntry: state.removeEntry,
  }));

  const selectedPath = entry?.selectedTarget?.path ?? [];
  const selectedData = useNodeData(selectedPath);

  if (!entry) {
    return null;
  }

  const isSelecting = activeSelectingEntryId === entryId;
  const isPathCopied = copiedPathEntryId === entryId;
  const entryTitle = entry.selectedTarget
    ? entry.selectedTarget.path.length === 1
      ? "Selected Node"
      : "Selected Field"
    : `Inspector Entry ${index + 1}`;
  const entrySummary = entry.selectedTarget
    ? formatInspectorTargetSummary(
        entry.selectedTarget.nodeId,
        entry.selectedTarget.path,
      )
    : "No target selected";

  const handleToggleSelection = (pressed: boolean) => {
    setActiveSelectingEntryId(pressed ? entryId : null);
  };

  const handleCopyPath = async () => {
    if (!entry.selectedTarget) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(entry.selectedTarget.path, null, 2),
      );
      setCopiedPathEntryId(entryId);
      window.setTimeout(() => {
        if (useInspectorStore.getState().copiedPathEntryId === entryId) {
          useInspectorStore.getState().setCopiedPathEntryId(null);
        }
      }, 2000);
    } catch (error) {
      console.error("Failed to copy inspector path", error);
    }
  };

  const handleDeleteEntry = () => {
    removeEntry(entryId);
  };

  return (
    <div className="w-full border-b border-input overflow-hidden shrink-0 pb-1">
      <div className="w-full px-1 pt-1 flex flex-row items-center gap-1">
        <Toggle
          data-inspector-entry-toggle={entryId}
          size="icon-sm"
          pressed={isSelecting}
          onPressedChange={handleToggleSelection}
        >
          <SquareMousePointer className={isSelecting ? "text-red-500" : ""} />
        </Toggle>
        <div className="min-w-0 flex-1 px-1">
          <div className="text-sm font-medium truncate">{entryTitle}</div>
          <div className="text-xs text-muted-foreground truncate">
            {entrySummary}
          </div>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => setDeleteDialogEntryId(entryId)}
        >
          <Trash />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => setEntryExpanded(entryId, !entry.isExpanded)}
        >
          {entry.isExpanded ? <PanelTopOpen /> : <PanelTopClose />}
        </Button>
      </div>
      {entry.isExpanded ? (
        <div className="flex flex-col gap-2 px-2 overflow-hidden pb-1">
          {entry.selectedTarget ? (
            <div className="flex flex-col gap-1">
              <div className="text-xs text-muted-foreground">Path:</div>
              <div className="relative w-full p-2 rounded border border-input bg-muted/50 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyPath}
                  className="absolute right-2 top-2 z-10 hover:bg-muted p-1 rounded"
                  title="Copy path"
                >
                  {isPathCopied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
                <style>{`
                  .inspector-path-tree button[title="Copy to clipboard"] {
                    display: none !important;
                  }
                `}</style>
                <JsonTreeViewer
                  className="inspector-path-tree w-full h-full pr-6"
                  data={entry.selectedTarget.path}
                  rootName="path"
                  defaultExpanded={true}
                  textSize="text-xs"
                />
              </div>
              <div className="text-xs text-muted-foreground">Data:</div>
              <div className="rounded border border-input bg-muted/50 overflow-auto min-h-0">
                <JsonViewer data={selectedData} textSize="text-xs" />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-neutral-500 text-sm text-center px-2 pt-1">
                {isSelecting
                  ? "Click a field to inspect..."
                  : "Click the selector to begin"}
              </p>
            </div>
          )}
        </div>
      ) : null}
      <Dialog
        open={deleteDialogEntryId === entryId}
        onOpenChange={(open) => setDeleteDialogEntryId(open ? entryId : null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete inspector entry?</DialogTitle>
            <DialogDescription>
              This will remove this inspector entry and its selected reference.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogEntryId(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteEntry}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
