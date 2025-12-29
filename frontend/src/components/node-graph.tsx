import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  type NodeTypes,
  useReactFlow,
  type OnMove,
} from "@xyflow/react";
import { useCallback, useEffect } from "react";
import CustomNode from "./custom-node/custom-node";
import useFlowStore from "../stores/flowStore";
import { useTheme } from "./theme-provider";
import { initializeUIData } from "../utils/add-ui-data";
import type { FrontendNodeData, FunctionNode } from "../types/types";
import GraphToolbar from "./graph-toolbar/graph-toolbar";
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

  const { copy, cut, paste } = useCopyPaste();

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

      if (cmdOrCtrl && event.key === "c") {
        event.preventDefault();
        copy();
      } else if (cmdOrCtrl && event.key === "x") {
        event.preventDefault();
        cut();
      } else if (cmdOrCtrl && event.key === "v") {
        event.preventDefault();
        paste();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [copy, cut, paste]);

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
    (event: React.DragEvent<HTMLDivElement>) => {
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

      // Use functional update to avoid dependency on nodes array
      setNodes((currentNodes) => [...currentNodes, newNode]);
    },
    [screenToFlowPosition, setNodes],
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div
      style={{ width: "100%", height: "100%" }}
      className="relative flex items-center justify-center"
    >
      <GraphToolbar />
      <ReactFlow
        proOptions={{ hideAttribution: true }}
        nodes={nodes}
        edges={edges}
        defaultEdgeOptions={{ style: { strokeWidth: 2 } }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
