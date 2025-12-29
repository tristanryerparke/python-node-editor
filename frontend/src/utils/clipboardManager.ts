import type { Edge, Node } from "@xyflow/react";

interface ClipboardChain {
  nodes: Node[];
  edges: Edge[];
}

const CLIPBOARD_KEY = "application/x-reactflow-nodes";

class ClipboardManager {
  private static inMemoryClipboard: ClipboardChain | null = null;

  /**
   * Copy selected nodes and their connecting edges to clipboard
   */
  static async copyToClipboard(
    nodes: readonly Node[],
    edges: readonly Edge[],
  ): Promise<void> {
    const selectedNodes = nodes.filter((n) => n.selected);
    const selectedIds = new Set(selectedNodes.map((n) => n.id));

    const data: ClipboardChain = {
      nodes: selectedNodes,
      edges: edges.filter(
        (e) => selectedIds.has(e.source) && selectedIds.has(e.target),
      ),
    };

    // Try using Clipboard API with custom MIME type
    try {
      const blob = new Blob([JSON.stringify(data)], {
        type: CLIPBOARD_KEY,
      });
      const clipboardItem = new ClipboardItem({
        [CLIPBOARD_KEY]: blob,
        "text/plain": new Blob([JSON.stringify(data)], { type: "text/plain" }),
      });
      await navigator.clipboard.write([clipboardItem]);
    } catch {
      // Fallback to in-memory storage
      this.inMemoryClipboard = data;

      // Try plain text clipboard as backup
      try {
        await navigator.clipboard.writeText(JSON.stringify(data));
      } catch (e) {
        console.warn("Clipboard access denied", e);
      }
    }
  }

  /**
   * Read nodes and edges from clipboard
   */
  static async pasteFromClipboard(): Promise<ClipboardChain | null> {
    try {
      const clipboardItems = await navigator.clipboard.read();

      for (const item of clipboardItems) {
        // Try custom format first
        if (item.types.includes(CLIPBOARD_KEY)) {
          const blob = await item.getType(CLIPBOARD_KEY);
          const text = await blob.text();
          return JSON.parse(text);
        }

        // Fallback to plain text
        if (item.types.includes("text/plain")) {
          const blob = await item.getType("text/plain");
          const text = await blob.text();
          try {
            return JSON.parse(text);
          } catch {
            // Not JSON, ignore
          }
        }
      }
    } catch {
      // Fallback to in-memory storage
      if (this.inMemoryClipboard) {
        return this.inMemoryClipboard;
      }

      // Try plain text clipboard as last resort
      try {
        const text = await navigator.clipboard.readText();
        return JSON.parse(text);
      } catch (e) {
        console.warn("Failed to read from clipboard", e);
      }
    }

    return null;
  }
}

export default ClipboardManager;
