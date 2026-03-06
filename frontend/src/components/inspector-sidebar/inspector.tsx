import { useRef, useEffect, useState } from "react";
import { useNodeData } from "../../stores/flowStore";
import useInspectorStore from "../../stores/inspectorStore";
import { Toggle } from "../../components/ui/toggle";
import { Button } from "../../components/ui/button";
import { SquareMousePointer, Eye, EyeOff, Copy, Check } from "lucide-react";
import JsonViewer from "../custom-node/json-viewer";
import { JsonViewer as JsonTreeViewer } from "../ui/json-tree-viewer";
import useFlowStore from "../../stores/flowStore";

export default function Inspector() {
  const {
    isSelecting,
    setIsSelecting,
    selectedTarget,
    showBorders,
    setShowBorders,
    clearSelectedTarget,
  } = useInspectorStore();

  const { nodes } = useFlowStore();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [isPathCopied, setIsPathCopied] = useState(false);

  // Clear selection if the selected node no longer exists
  useEffect(() => {
    if (selectedTarget) {
      const nodeExists = nodes.some(
        (node) => node.id === selectedTarget.nodeId,
      );
      if (!nodeExists) {
        clearSelectedTarget();
      }
    }
  }, [nodes, selectedTarget, clearSelectedTarget]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        toggleRef.current &&
        !toggleRef.current.contains(event.target as Node)
      ) {
        setIsSelecting(false);
      }
    };

    if (isSelecting) {
      document.addEventListener("mousedown", handleClickOutside);
      // Set cursor to pointer (hand) globally when selecting
      document.body.style.cursor = "pointer";
    } else {
      // Reset cursor when not selecting
      document.body.style.cursor = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // Clean up cursor on unmount
      document.body.style.cursor = "";
    };
  }, [isSelecting, setIsSelecting]);

  const handleToggleSelection = (pressed: boolean) => {
    setIsSelecting(pressed);
  };

  const handleToggleBorders = () => {
    setShowBorders(!showBorders);
  };

  const copyPathToClipboard = async () => {
    if (!selectedTarget) return;

    const copyText = JSON.stringify(selectedTarget.path, null, 2);

    await navigator.clipboard.writeText(copyText);
    setIsPathCopied(true);
    setTimeout(() => setIsPathCopied(false), 2000);
  };

  const selectedData = useNodeData(selectedTarget?.path ?? []);

  return (
    <div className="min-w-60 w-full h-full flex flex-col overflow-hidden">
      <div className="w-full flex flex-row gap-2 p-1 items-center justify-between shrink-0">
        <Toggle
          ref={toggleRef}
          size="sm"
          pressed={isSelecting}
          onPressedChange={handleToggleSelection}
        >
          <SquareMousePointer className={isSelecting ? "text-red-500" : ""} />
        </Toggle>
        <h5>Inspector</h5>
        <Button size="icon-sm" variant="ghost" onClick={handleToggleBorders}>
          {showBorders ? <Eye /> : <EyeOff />}
        </Button>
      </div>
      {/*<div>isSelecting: {isSelecting.toString()}</div>*/}
      <div className="flex-1 flex flex-col gap-2 p-2 overflow-y-auto overflow-x-hidden min-h-0">
        {isSelecting}
        {selectedTarget ? (
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold">
              {selectedTarget.path.length === 1
                ? "Selected Node"
                : "Selected Field"}
            </div>
            <div className="text-xs text-muted-foreground">Path:</div>
            <div className="relative w-full p-2 rounded border border-input bg-muted/50 shrink-0">
              <button
                type="button"
                onClick={copyPathToClipboard}
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
                data={selectedTarget.path}
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
            <p className="text-neutral-500 text-sm text-center px-2">
              {isSelecting
                ? "Click a field to inspect..."
                : "Click the selector to begin"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
