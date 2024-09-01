import React, { useCallback, useContext, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  useReactFlow,
  type NodeTypes,
  useOnSelectionChange,
  BackgroundVariant,
} from '@xyflow/react';
import { Panel } from 'react-resizable-panels';
import CustomNode from './CustomNode';
import { NodeSelectionContext } from '../GlobalContext';
import { BaseNodeData } from '../types/DataTypes';
import type { Node, Edge } from '@xyflow/react';

const nodeTypes: NodeTypes = {
  customNode: CustomNode,
};

const NodeGraph: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition, getViewport, setViewport } = useReactFlow();
  const { setSelectedNodeId } = useContext(NodeSelectionContext);

  useEffect(() => {
    const savedFlow = localStorage.getItem('savedFlow');
    if (savedFlow) {
      const { nodes: savedNodes, edges: savedEdges, viewport: savedViewport } = JSON.parse(savedFlow);
      setNodes(savedNodes);
      setEdges(savedEdges);
      if (savedViewport) {
        setViewport(savedViewport);
      }
    }
  }, [setNodes, setEdges, setViewport]);

  useEffect(() => {
    const saveFlow = () => {
      const flow = { 
        nodes, 
        edges,
        viewport: getViewport()
      };
      localStorage.setItem('savedFlow', JSON.stringify(flow));
    };
    window.addEventListener('beforeunload', saveFlow);
    return () => window.removeEventListener('beforeunload', saveFlow);
  }, [nodes, edges, getViewport]);

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
      const droppedNodeData: BaseNodeData = JSON.parse(event.dataTransfer.getData('application/reactflow')).data;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode: Node = {
        id: crypto.randomUUID(),
        position: {
          x: position.x - 75,
          y: position.y - 37.5,
        },
        type: 'customNode',
        data: {...droppedNodeData},
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    if (nodes.length > 0) {
      setSelectedNodeId(nodes[0].id);
    } else {
      setSelectedNodeId(null);
    }
  }, [setSelectedNodeId]);

  useOnSelectionChange({
    onChange: onSelectionChange,
  });

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
        onMoveEnd={(_, viewport) => {
          localStorage.setItem('savedViewport', JSON.stringify(viewport));
        }}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </Panel>
  );
};

export default NodeGraph;