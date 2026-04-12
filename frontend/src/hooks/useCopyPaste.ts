import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { nodeToHookAction, runHookActions } from "@/lib/hook-actions";
import ClipboardManager from "../utils/clipboardManager";
import { copyNodes, copyEdges, setSelected } from "../utils/paste-utils";

export const useCopyPaste = () => {
  const { getNodes, setNodes, getEdges, setEdges } = useReactFlow();

  /**
   * Copy selected nodes and edges to clipboard
   */
  const copy = useCallback(async () => {
    const nodes = getNodes();
    const edges = getEdges();
    await ClipboardManager.copyToClipboard(nodes, edges);
  }, [getNodes, getEdges]);

  /**
   * Cut selected nodes (copy then remove)
   */
  const cut = useCallback(async () => {
    const nodes = getNodes();
    const edges = getEdges();

    // Copy first
    await ClipboardManager.copyToClipboard(nodes, edges);

    // Then remove selected
    const selectedIds = new Set(
      nodes.filter((n) => n.selected).map((n) => n.id),
    );
    const selectedNodes = nodes.filter((n) => selectedIds.has(n.id));

    await runHookActions(
      selectedNodes.map((node) => nodeToHookAction(node, "delete")),
    );

    setNodes((currentNodes) =>
      currentNodes.filter((n) => !selectedIds.has(n.id)),
    );
    setEdges((currentEdges) =>
      currentEdges.filter(
        (e) => !selectedIds.has(e.source) && !selectedIds.has(e.target),
      ),
    );
  }, [getNodes, getEdges, setNodes, setEdges]);

  /**
   * Paste nodes and edges from clipboard
   */
  const paste = useCallback(async () => {
    const clipboardData = await ClipboardManager.pasteFromClipboard();

    if (!clipboardData) return;

    const currentNodes = getNodes();
    const currentEdges = getEdges();

    // Generate unique IDs based on a random seed
    const duplicationId = crypto.randomUUID();
    const deriveId = (oldId: string) =>
      `${duplicationId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${oldId}`;

    // Get current and clipboard ID sets
    const currentIds = new Set(currentNodes.map((n) => n.id));
    const clipboardIds = new Set(clipboardData.nodes.map((n) => n.id));

    // Copy nodes with new IDs
    const newNodes = copyNodes(
      clipboardData.nodes,
      (oldId) => {
        // If the ID is from clipboard, derive new ID
        if (clipboardIds.has(oldId)) return deriveId(oldId);
        // If it already exists in current graph, keep it
        if (currentIds.has(oldId)) return oldId;
        // Otherwise keep the old ID
        return oldId;
      },
      true, // Modify positions
    );

    // Copy edges with updated IDs
    const newEdges = copyEdges(clipboardData.edges, deriveId);

    await runHookActions(
      newNodes.map((node) => nodeToHookAction(node, "add")),
    );

    // Update state: deselect all, add new nodes/edges as selected
    setNodes([
      ...setSelected(currentNodes, false),
      ...setSelected(newNodes, true),
    ]);
    setEdges([
      ...setSelected(currentEdges, false),
      ...setSelected(newEdges, true),
    ]);
  }, [getNodes, getEdges, setNodes, setEdges]);

  return { copy, cut, paste };
};
