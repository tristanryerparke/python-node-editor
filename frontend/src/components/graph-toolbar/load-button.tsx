import { Button } from "@/components/ui/button";
import useFlowStore from "../../stores/flowStore";
import useInspectorStore, {
  type InspectorEntryState,
  type InspectorPathSegment,
  type InspectorTarget,
} from "../../stores/inspectorStore";
import { useReactFlow, type Edge } from "@xyflow/react";
import { useRef } from "react";
import type { FunctionSchemas, TypeInfo } from "@/types/environment";
import type { FunctionNode } from "@/types/types";
import { buildEnvironmentMismatchWarning } from "@/utils/environment-mismatch";
import useSettingsStore from "@/stores/settingsStore";

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
  functionSchemas?: unknown;
  types?: unknown;
  inspector?: SavedInspectorState;
};

type SavedInspectorEntry = Omit<InspectorEntryState, "customName" | "viewMode"> & {
  customName?: unknown;
  viewMode?: unknown;
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

function isInspectorEntryState(entry: unknown): entry is SavedInspectorEntry {
  return !!entry &&
    typeof entry === "object" &&
    "id" in entry &&
    "isExpanded" in entry &&
    "selectedTarget" in entry &&
    typeof entry.id === "string" &&
    typeof entry.isExpanded === "boolean" &&
    (!("customName" in entry) ||
      entry.customName === null ||
      typeof entry.customName === "string") &&
    (!("viewMode" in entry) ||
      entry.viewMode === "json" ||
      entry.viewMode === "rich") &&
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
          customName:
            typeof entry.customName === "string" ? entry.customName : null,
          viewMode: (entry.viewMode === "rich"
            ? "rich"
            : "json") as InspectorEntryState["viewMode"],
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
    showBorders:
      typeof inspector?.showBorders === "boolean" ? inspector.showBorders : true,
  };
}

export const LoadButton = () => {
  const {
    setNodes,
    setEdges,
    setViewport: setStoreViewport,
    functionSchemas,
    types,
    setEnvironmentMismatchWarning,
  } = useFlowStore();
  const warnOnEnvironmentMismatch = useSettingsStore(
    (state) => state.warnOnEnvironmentMismatch,
  );
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
          const nodes = Array.isArray(flow.nodes)
            ? (flow.nodes as FunctionNode[])
            : [];
          const edges = Array.isArray(flow.edges)
            ? (flow.edges as Edge[])
            : [];
          const nodeIds = new Set(
            nodes
              .map((node) =>
                typeof node?.id === "string" ? node.id : null,
              )
              .filter((id): id is string => id !== null),
          );
          const incomingFunctionSchemas = (flow.functionSchemas ??
            {}) as FunctionSchemas;
          const incomingTypes = (flow.types ?? {}) as Record<string, TypeInfo>;
          if (warnOnEnvironmentMismatch) {
            const warning = buildEnvironmentMismatchWarning({
              source: "flow-load",
              incomingFunctionSchemas,
              incomingTypes,
              currentFunctionSchemas: functionSchemas,
              currentTypes: types,
            });

            if (warning) {
              setEnvironmentMismatchWarning(warning);
            }
          }

          const x = typeof flow.viewport?.x === "number" ? flow.viewport.x : 0;
          const y = typeof flow.viewport?.y === "number" ? flow.viewport.y : 0;
          const zoom =
            typeof flow.viewport?.zoom === "number" ? flow.viewport.zoom : 1;
          const viewport = { x, y, zoom };
          setNodes(nodes);
          setEdges(edges);
          setStoreViewport(viewport);
          setViewport(viewport);
          useInspectorStore.setState(
            normalizeInspectorState(flow.inspector, nodeIds),
          );
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
