import React, { useCallback, useContext, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  useReactFlow,
  type NodeTypes,
  useOnSelectionChange,
} from '@xyflow/react';
import { Panel } from 'react-resizable-panels';
import CustomNode, { NodeData } from './CustomNode';
import { NodeSelectionContext, AutoExecuteContext } from '../GlobalContext';
import { parseNodeForCreation } from '../utils/nodeProcessing';
import { useExecutionManager } from '../hooks/useExecutionManager';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const nodeTypes: NodeTypes = {
  customNode: CustomNode,
};

const NodeGraph: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  const { selectedNodeId, setSelectedNodeId } = useContext(NodeSelectionContext);
  const { autoExecute } = useContext(AutoExecuteContext);
  const { debouncedExecute } = useExecutionManager();

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const nodeData: NodeData = JSON.parse(event.dataTransfer.getData('application/reactflow'));

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = parseNodeForCreation({
        ...nodeData,
        position: {
          x: position.x - 75,
          y: position.y - 37.5,
        },
      });

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  const onSelectionChange = useCallback(({ nodes, edges }) => {
    if (nodes.length > 0) {
      setSelectedNodeId(nodes[0].id);
    } else {
      setSelectedNodeId(null);
    }
  }, [setSelectedNodeId]);

  useOnSelectionChange({
    onChange: onSelectionChange,
  });

  useEffect(() => {
    if (autoExecute) {
      debouncedExecute();
    }
  }, [nodes.length, edges.length, autoExecute]);

  return (
    <Panel id="node-graph" order={1}>
      <ReactFlow
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </Panel>
  );
};

export default NodeGraph;