import React, { useCallback } from 'react';
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
} from '@xyflow/react';
import { Panel } from 'react-resizable-panels';
import CustomNode from './CustomNode';

const initialNodes: Node[] = [
];

const initialEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

let id = 0;
const getId = () => `dndnode_${id++}`;

const nodeTypes = {
  customNode: CustomNode,
};

const NodeGraph: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

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

      const nodeData = JSON.parse(event.dataTransfer.getData('application/reactflow'));

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getId(),
        type: 'customNode',
        position: {
          x: position.x - nodeData.width / 2,
          y: position.y - nodeData.height / 2,
        },
        data: nodeData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition]
  );

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