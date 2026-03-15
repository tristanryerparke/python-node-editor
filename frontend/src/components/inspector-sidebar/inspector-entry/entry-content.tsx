import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { JsonViewer } from "@/components/ui/json-tree-viewer";
import { cn } from "@/lib/utils";
import { useNodeData } from "@/stores/flowStore";
import type { InspectorEntryState } from "@/stores/inspectorStore";
import useSettingsStore from "@/stores/settingsStore";

interface EntryContentProps {
  entry: InspectorEntryState;
}

export default function EntryContent({ entry }: EntryContentProps) {
  const [isPathCopied, setIsPathCopied] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);
  const showInspectorPaths = useSettingsStore(
    (state) => state.showInspectorPaths,
  );
  const selectedPath = entry.selectedTarget?.path ?? [];
  const selectedData = useNodeData(selectedPath);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  if (!entry.selectedTarget) {
    return null;
  }

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(entry.selectedTarget?.path, null, 2),
      );
      setIsPathCopied(true);

      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = window.setTimeout(() => {
        setIsPathCopied(false);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch (error) {
      console.error("Failed to copy inspector path", error);
    }
  };

  return (
    <div className="flex flex-col gap-2 px-2 overflow-hidden">
      <div
        className={cn("flex flex-col gap-1", !showInspectorPaths && "pt-1")}
      >
        {showInspectorPaths ? (
          <>
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
              <JsonViewer
                className="w-full h-full"
                containerPadding={false}
                data={entry.selectedTarget.path}
                rootName="path"
                defaultExpanded={true}
                textSize="text-xs"
                showRootCopyButton={false}
              />
            </div>
            <div className="text-xs text-muted-foreground">Data:</div>
          </>
        ) : null}
        <div className="rounded border border-input bg-muted/50 overflow-auto min-h-0">
          <JsonViewer data={selectedData} textSize="text-xs" />
        </div>
      </div>
    </div>
  );
}
