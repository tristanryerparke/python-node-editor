import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  
  type Node,
  type Edge,
  type NodeTypes,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  useOnSelectionChange,
  useReactFlow,
} from '@xyflow/react';
import { Text } from '@mantine/core';
import { Panel } from 'react-resizable-panels';
import CustomNode from './node-elements/CustomNode';
import { AppContext, InspectorContext, FlowMetadataContext } from '../GlobalContext';
import { BaseNodeData, FlowFileObject } from '../types/DataTypes';
import { useAutoSave } from '../hooks/useAutoSave';

const nodeTypes: NodeTypes = {
  customNode: CustomNode,
};

const NodeGraph: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const { screenToFlowPosition, getViewport, setViewport } = useReactFlow();
  const { setSelectedNodeId } = useContext(InspectorContext);
  const { filename, setFilename } = useContext(FlowMetadataContext);
  const { lastAutosaved } = useContext(AppContext);
  
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  useEffect(() => {
    const savedFlow = localStorage.getItem('savedFlow');
    if (savedFlow) {
      const flowFileObject: FlowFileObject = JSON.parse(savedFlow);
      setNodes(flowFileObject.nodes);
      setEdges(flowFileObject.edges);
      if (flowFileObject.viewport) {
        setViewport(flowFileObject.viewport);
      }
      if (flowFileObject.metadata && flowFileObject.metadata.filename) {
        setFilename(flowFileObject.metadata.filename);
      }
    }
  }, [setNodes, setEdges, setViewport, setFilename]);

  useEffect(() => {
    const saveFlow = () => {
      const flowFileObject: FlowFileObject = {
        nodes,
        edges,
        viewport: getViewport(),
        embedded_data: {},
        metadata: {
          filename: filename,
        }
      };
      localStorage.setItem('savedFlow', JSON.stringify(flowFileObject));
    };
    window.addEventListener('beforeunload', saveFlow);
    return () => window.removeEventListener('beforeunload', saveFlow);
  }, [nodes, edges, getViewport, filename]);

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
      setNodes((nds) => [...nds, newNode as Node]);
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

  useAutoSave();

  const [, setForceUpdate] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      setForceUpdate({});
    }, 1000 * 15); // Update every second

    return () => clearInterval(interval);
  }, []);

  const getAutosaveText = useCallback(() => {
    if (!lastAutosaved) return 'Not autosaved';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastAutosaved.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `Autosaved ${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    } else {
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      return `Autosaved ${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
  }, [lastAutosaved]);

  return (
    <Panel id="node-graph" order={1}>
      <div style={{width: '100%', height: '100%', position: 'relative'}}>
        <Text
          ta='right'
          size='xs'
          style={{
            zIndex: 1000,
            position: 'absolute',
            bottom: '0.5rem',
            right: '1rem',
          }}
        >
          {getAutosaveText()}
        </Text>
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
          panOnScroll
        >
          <Controls />
          <MiniMap position='bottom-right' style={{bottom: '1rem'}}/>
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </Panel>
  );
};

export default NodeGraph;