import { Button } from "@/components/ui/button";
import useFlowStore from "../../stores/flowStore";
import useInspectorStore, {
  type InspectorEntryState,
  type InspectorPathSegment,
  type InspectorTarget,
} from "../../stores/inspectorStore";
import { useReactFlow } from "@xyflow/react";
import { useRef } from "react";

type SavedInspectorState = {
  entries?: unknown;
  showBorders?: unknown;
};

type SavedFlowFile = {
  nodes?: unknown;
  edges?: unknown;
  viewport?: {
    x?: unknown;
    y?: unknown;
    zoom?: unknown;
  };
  inspector?: SavedInspectorState;
};

function isInspectorPath(path: unknown): path is InspectorPathSegment[] {
  return Array.isArray(path) &&
    path.every((segment) => typeof segment === "string" || typeof segment === "number");
}

function isInspectorTarget(target: unknown): target is InspectorTarget {
  return !!target &&
    typeof target === "object" &&
    "nodeId" in target &&
    "path" in target &&
    typeof target.nodeId === "string" &&
    isInspectorPath(target.path);
}

function isInspectorEntryState(entry: unknown): entry is InspectorEntryState {
  return !!entry &&
    typeof entry === "object" &&
    "id" in entry &&
    "isExpanded" in entry &&
    "selectedTarget" in entry &&
    typeof entry.id === "string" &&
    typeof entry.isExpanded === "boolean" &&
    (entry.selectedTarget === null || isInspectorTarget(entry.selectedTarget));
}

function normalizeInspectorState(
  inspector: SavedInspectorState | undefined,
  nodeIds: Set<string>,
) {
  const entries = Array.isArray(inspector?.entries)
    ? inspector.entries
        .filter(isInspectorEntryState)
        .map((entry) => ({
          ...entry,
          selectedTarget:
            entry.selectedTarget &&
            nodeIds.has(entry.selectedTarget.nodeId)
              ? entry.selectedTarget
              : null,
        }))
    : [];

  return {
    entries,
    activeSelectingEntryId: null,
    deleteDialogEntryId: null,
    copiedPathEntryId: null,
    showBorders:
      typeof inspector?.showBorders === "boolean" ? inspector.showBorders : true,
  };
}

export const LoadButton = () => {
  const { setNodes, setEdges, setViewport: setStoreViewport } = useFlowStore();
  const { setViewport } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onLoad = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const flow = JSON.parse(content) as SavedFlowFile;

        if (flow) {
          const nodes = Array.isArray(flow.nodes) ? flow.nodes : [];
          const edges = Array.isArray(flow.edges) ? flow.edges : [];
          const nodeIds = new Set(
            nodes
              .filter(
                (node): node is { id: string } =>
                  !!node &&
                  typeof node === "object" &&
                  "id" in node &&
                  typeof node.id === "string",
              )
              .map((node) => node.id),
          );
          const viewport = {
            x: typeof flow.viewport?.x === "number" ? flow.viewport.x : 0,
            y: typeof flow.viewport?.y === "number" ? flow.viewport.y : 0,
            zoom: typeof flow.viewport?.zoom === "number" ? flow.viewport.zoom : 1,
          };
          setNodes(nodes);
          setEdges(edges);
          setStoreViewport(viewport);
          setViewport(viewport);
          useInspectorStore.setState(normalizeInspectorState(flow.inspector, nodeIds));
        }
      } catch (error) {
        console.error("Error loading flow:", error);
        alert("Failed to load flow. Please check the file format.");
      }
    };

    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <Button className="flex-1" onClick={onLoad} size="sm" variant="outline">
        Load
      </Button>
    </>
  );
};
