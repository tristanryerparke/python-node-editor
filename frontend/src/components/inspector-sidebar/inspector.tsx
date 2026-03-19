import { useEffect } from "react";
import { Plus, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import useInspectorStore from "../../stores/inspectorStore";
import useFlowStore from "../../stores/flowStore";
import InspectorEntry from "./inspector-entry";

export default function Inspector() {
  const nodes = useFlowStore((state) => state.nodes);
  const {
    entries,
    activeSelectingEntryId,
    addEntry,
    showBorders,
    setShowBorders,
    clearMissingTargets,
    setActiveSelectingEntryId,
  } = useInspectorStore((state) => ({
    entries: state.entries,
    activeSelectingEntryId: state.activeSelectingEntryId,
    addEntry: state.addEntry,
    showBorders: state.showBorders,
    setShowBorders: state.setShowBorders,
    clearMissingTargets: state.clearMissingTargets,
    setActiveSelectingEntryId: state.setActiveSelectingEntryId,
  }));

  useEffect(() => {
    clearMissingTargets(nodes.map((node) => node.id));
  }, [nodes, clearMissingTargets]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        setActiveSelectingEntryId(null);
        return;
      }

      if (
        target.closest("[data-inspector-entry-toggle]") ||
        target.closest("[data-inspectable-field-wrapper]")
      ) {
        return;
      }

      setActiveSelectingEntryId(null);
    };

    if (activeSelectingEntryId) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.cursor = "";
    };
  }, [activeSelectingEntryId, setActiveSelectingEntryId]);

  const handleToggleBorders = () => {
    setShowBorders(!showBorders);
  };

  return (
    <div className="min-w-60 w-full h-full flex flex-col overflow-hidden">
      <div className="w-full flex flex-row gap-2 p-1 items-center justify-between shrink-0">
        <Button size="icon-sm" variant="ghost" onClick={addEntry}>
          <Plus />
        </Button>
        <h5>Inspector</h5>
        <Button size="icon-sm" variant="ghost" onClick={handleToggleBorders}>
          {showBorders ? <Eye /> : <EyeOff />}
        </Button>
      </div>
      <Separator />
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0">
        {entries.length > 0 ? (
          entries.map((entry, index) => (
            <InspectorEntry key={entry.id} entryId={entry.id} index={index} />
          ))
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-neutral-500 text-sm text-center px-2">
              Click + to add an inspector entry
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
