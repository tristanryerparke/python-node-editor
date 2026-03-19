import type { InspectorEntryState, InspectorTarget } from "@/stores/inspectorStore";

export function isFieldTarget(target: InspectorTarget | null): boolean {
  if (!target) return false;
  return (
    target.path.length === 3 &&
    (target.path[1] === "arguments" || target.path[1] === "outputs")
  );
}

export function isInputFieldTarget(target: InspectorTarget): boolean {
  return target.path[1] === "arguments";
}

export function formatInspectorTargetSummary(
  nodeId: string,
  path: (string | number)[],
) {
  const remainingPath = path.slice(1).map(String).join(":");
  const compactNodeId = nodeId.slice(0, 8);

  return remainingPath ? `${compactNodeId}:${remainingPath}` : compactNodeId;
}

export function getDefaultEntryTitle(
  entry: InspectorEntryState,
  index: number,
) {
  return entry.selectedTarget
    ? entry.selectedTarget.path.length === 1
      ? `Node ${index + 1}`
      : `Field ${index + 1}`
    : `Entry ${index + 1}`;
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
