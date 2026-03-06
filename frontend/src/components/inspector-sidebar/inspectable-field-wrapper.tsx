import type { ReactElement } from "react";
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
  const {
    isSelecting,
    selectTarget,
    selectedTarget,
    showBorders,
    clearSelectedTarget,
  } = useInspectorStore();

  const nodeId = path[0] as string;

  // Check if this field is currently selected in the inspector
  const amISelected =
    selectedTarget?.nodeId === nodeId &&
    JSON.stringify(selectedTarget?.path) === JSON.stringify(path);

  // Show light blue dashed outline when borders are enabled and this field is selected
  const showSelectedBorder = showBorders && amISelected;

  const handleFieldClick = (e: React.MouseEvent) => {
    if (isSelecting) {
      // Only stop propagation/prevent default if we're actually in selector mode
      // This prevents interfering with tooltip hover events
      e.stopPropagation();
      e.preventDefault();

      // Shift+click to deselect (keeps selector mode active)
      if (e.shiftKey && amISelected) {
        clearSelectedTarget();
      } else {
        selectTarget(nodeId, path);
      }
    }
  };

  return (
    <div
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
