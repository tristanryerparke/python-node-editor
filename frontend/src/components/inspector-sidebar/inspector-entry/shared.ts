import type { InspectorEntryState } from "@/stores/inspectorStore";

export function formatInspectorTargetSummary(
  nodeId: string,
  path: (string | number)[],
) {
  const remainingPath = path.slice(1).map(String).join(":");
  const compactNodeId =
    nodeId.length > 12 ? `${nodeId.slice(0, 8)}-...-${nodeId.slice(-4)}` : nodeId;

  return remainingPath ? `${compactNodeId}:${remainingPath}` : nodeId;
}

export function getDefaultEntryTitle(
  entry: InspectorEntryState,
  index: number,
) {
  return entry.selectedTarget
    ? entry.selectedTarget.path.length === 1
      ? "Selected Node"
      : "Selected Field"
    : `Inspector Entry ${index + 1}`;
}

export function getEntryTitle(entry: InspectorEntryState, index: number) {
  return entry.customName?.trim() || getDefaultEntryTitle(entry, index);
}

export function getEntrySummary(entry: InspectorEntryState) {
  return entry.selectedTarget
    ? formatInspectorTargetSummary(
        entry.selectedTarget.nodeId,
        entry.selectedTarget.path,
      )
    : "No target selected";
}
