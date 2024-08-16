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
  NodeTypes,
} from '@xyflow/react';
import { Panel } from 'react-resizable-panels';
import CustomNode, { NodeData } from './CustomNode';

type CustomNode = Node<NodeData>;

const initialNodes: Node[] = [
];

const initialEdges: Edge[] = [];


let id = 0;
const getId = () => id++;

const nodeTypes: NodeTypes = {
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

      const nodeData: NodeData = JSON.parse(event.dataTransfer.getData('application/reactflow'));

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const id = String(getId());

      nodeData.id = id;

      const newNode: Node<NodeData> = {
        id: id,
        type: 'customNode',
        position: {
          x: position.x - 75,
          y: position.y - 37.5,
        },
        data: {
          ...nodeData,
          name: nodeData.name || nodeData.type.replace('Node', ''),
        },
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