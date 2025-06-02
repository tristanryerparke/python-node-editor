import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
  type NodeTypes,
  useReactFlow,
} from '@xyflow/react';
import { useCallback } from 'react';
import { BaseNodeData } from '../../types/nodeTypes';
import CustomNode from '../customNode/CustomNode';
import useStore from '../store';
import { useTheme } from '../theme-provider';

const nodeTypes: NodeTypes = {customNode: CustomNode};

function NodeGraph() {
  const { theme } = useTheme();
  // Use the store directly since we need all parts of the state
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    setNodes 
  } = useStore();

  const { screenToFlowPosition } = useReactFlow();

  // Determine colorMode for ReactFlow
  let colorMode: 'dark' | 'light';
  if (theme === 'system') {
    colorMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    colorMode = theme;
  }

  // Handle the spawning of droppped nodes
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const node_data = JSON.parse(event.dataTransfer.getData('application/reactflow'));
      const droppedNodeData: BaseNodeData = node_data.data;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode: Node = {
        id: crypto.randomUUID(),
        position: {
          x: position.x - node_data.data.min_width / 2,
          y: position.y,
        },
        type: 'customNode',
        data: {...droppedNodeData},
        width: node_data.data.min_width,
      };
      setNodes([...nodes, newNode]);
    },
    [screenToFlowPosition, setNodes, nodes]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  return (
    <div style={{width: '100%', height: '100%'}}>
      <ReactFlow
        proOptions={{ hideAttribution: true }}
        nodes={[...nodes]}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        colorMode={colorMode}
        // fitView
        panOnScroll
      >
        <Controls />
        <MiniMap position='bottom-right'/>
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  )
}

export default NodeGraph;