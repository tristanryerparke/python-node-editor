import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  type NodeTypes,
  useReactFlow,
  useStoreApi,
  type OnMove,
} from "@xyflow/react";
import { useCallback, useEffect } from "react";
import CustomNode from "./custom-node/custom-node";
import useFlowStore from "../stores/flowStore";
import { useTheme } from "./theme-provider";
import { initializeUIData } from "../utils/add-ui-data";
import { nodeToHookAction, runHookActions } from "../lib/hook-actions";
import type { FrontendNodeData, FunctionNode } from "../types/types";
import { useCopyPaste } from "../hooks/useCopyPaste";

const nodeTypes: NodeTypes = {
  customNode: CustomNode,
};

function NodeGraph() {
  const { theme } = useTheme();
  const {
    nodes,
    edges,
    viewport,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setViewport,
    setRfInstance,
  } = useFlowStore();

  const { screenToFlowPosition, setViewport: setReactFlowViewport } =
    useReactFlow();
  const storeApi = useStoreApi();

  const { copy, cut, paste } = useCopyPaste();

  const isTextEditable = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    return Boolean(
      target.closest(
        'input, textarea, select, [contenteditable="true"], [role="textbox"]',
      ),
    );
  };

  // Restore viewport on mount
  useEffect(() => {
    if (viewport) {
      setReactFlowViewport(viewport, { duration: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setup keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;
      const key = event.key.toLowerCase();
      const isEditingText =
        isTextEditable(event.target) || isTextEditable(document.activeElement);
      const hasSelectedNodes = storeApi
        .getState()
        .nodes.some((node) => node.selected);

      if (cmdOrCtrl && key === "a") {
        if (isEditingText) return;
        event.preventDefault();
        setNodes((currentNodes) => {
          if (currentNodes.length === 0) return currentNodes;
          storeApi.setState({
            nodesSelectionActive: true,
            userSelectionActive: false,
          });
          return currentNodes.map((node) => ({ ...node, selected: true }));
        });
      } else if (cmdOrCtrl && key === "c") {
        if (isEditingText || !hasSelectedNodes) return;
        event.preventDefault();
        copy();
      } else if (cmdOrCtrl && key === "x") {
        if (isEditingText || !hasSelectedNodes) return;
        event.preventDefault();
        cut();
      } else if (cmdOrCtrl && key === "v") {
        if (isEditingText) return;
        event.preventDefault();
        paste();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [copy, cut, paste, setNodes, storeApi]);

  // Save viewport changes
  const onMoveEnd = useCallback<OnMove>(
    (_event, viewport) => {
      setViewport(viewport);
    },
    [setViewport],
  );

  let colorMode: "dark" | "light";
  if (theme === "system") {
    colorMode = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } else {
    colorMode = theme;
  }

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const nodeDataString = event.dataTransfer.getData(
        "application/reactflow",
      );
      if (!nodeDataString) return;

      const nodeData: FrontendNodeData = JSON.parse(nodeDataString);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Initialize selectedType for union types in arguments
      initializeUIData(nodeData);

      const newNode: FunctionNode = {
        id: crypto.randomUUID(),
        position: {
          x: position.x,
          y: position.y,
        },
        type: "customNode",
        data: nodeData,
      };

      try {
        await runHookActions([nodeToHookAction(newNode, "add")]);
      } catch (error) {
        console.error("Failed to run add hook actions:", error);
        return;
      }

      // Use functional update to avoid dependency on nodes array
      setNodes((currentNodes) => [...currentNodes, newNode]);
    },
    [screenToFlowPosition, setNodes],
  );

  const onNodesDelete = useCallback(async (deletedNodes: FunctionNode[]) => {
    try {
      await runHookActions(
        deletedNodes.map((node) => nodeToHookAction(node, "delete")),
      );
    } catch (error) {
      console.error("Failed to run delete hook actions:", error);
    }
  }, []);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div
      style={{ width: "100%", height: "100%" }}
      className="relative flex items-center justify-center"
    >
      <ReactFlow
        proOptions={{ hideAttribution: true }}
        nodes={nodes}
        edges={edges}
        defaultEdgeOptions={{ style: { strokeWidth: 2 } }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setRfInstance}
        onMoveEnd={onMoveEnd}
        nodeTypes={nodeTypes}
        colorMode={colorMode}
        panOnScroll
      >
        <Controls showInteractive={false} style={{ backgroundColor: "#ccc" }} />
        <MiniMap position="bottom-right" />
        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
          // dark is tailwind neutral-900, light is tailwind gray-100
          bgColor={colorMode === "dark" ? "#171717" : "#f3f4f6"}
        />
      </ReactFlow>
    </div>
  );
}

export default NodeGraph;
