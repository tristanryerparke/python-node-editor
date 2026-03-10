import type { MouseEvent as ReactMouseEvent, ReactElement } from "react";
import useInspectorStore from "@/stores/inspectorStore";
import { cn } from "@/lib/utils";

interface InspectableFieldWrapperProps {
  children: ReactElement<{ path: (string | number)[] }>;
  path: (string | number)[];
}

export default function InspectableFieldWrapper({
  children,
  path,
}: InspectableFieldWrapperProps) {
  const nodeId = path[0] as string;
  const pathString = JSON.stringify(path);

  const {
    activeSelectingEntryId,
    isSelecting,
    amISelectedByActiveEntry,
    showSelectedBorder,
    selectTargetForActiveEntry,
    updateInspectorData,
  } = useInspectorStore((state) => {
    const activeEntry =
      state.entries.find((entry) => entry.id === state.activeSelectingEntryId) ??
      null;
    const amISelectedByActiveEntry =
      activeEntry?.selectedTarget?.nodeId === nodeId &&
      JSON.stringify(activeEntry.selectedTarget.path) === pathString;
    const selectedByAnyEntry = state.entries.some(
      (entry) =>
        entry.selectedTarget?.nodeId === nodeId &&
        JSON.stringify(entry.selectedTarget.path) === pathString,
    );

    return {
      activeSelectingEntryId: state.activeSelectingEntryId,
      isSelecting: state.activeSelectingEntryId !== null,
      amISelectedByActiveEntry,
      showSelectedBorder: state.showBorders && selectedByAnyEntry,
      selectTargetForActiveEntry: state.selectTargetForActiveEntry,
      updateInspectorData: state.updateInspectorData,
    };
  });

  const handleFieldClick = (e: ReactMouseEvent) => {
    if (!isSelecting || !activeSelectingEntryId) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    if (e.shiftKey && amISelectedByActiveEntry) {
      updateInspectorData([activeSelectingEntryId, "selectedTarget"], null);
      return;
    }

    selectTargetForActiveEntry(nodeId, path);
  };

  return (
    <div
      data-inspectable-field-wrapper
      className={cn(
        "transition-all relative",
        isSelecting
          ? "cursor-pointer hover:outline-2 hover:outline-dashed hover:outline-sky-300 hover:rounded-sm hover:z-10"
          : null,
        showSelectedBorder && "outline-2 outline-dashed outline-sky-300 rounded z-10",
      )}
      onClick={handleFieldClick}
    >
      <div className={cn(isSelecting ? "pointer-events-none" : null)}>
        {children}
      </div>
    </div>
  );
}
