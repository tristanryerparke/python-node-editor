import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow, 
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
  Node,
  Edge,
  Connection,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './index.css';

interface NodePickerItemProps {
  node: { name: string };
}

function NodePickerItem({ node }: NodePickerItemProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="NodePickerItem" onDragStart={(event) => onDragStart(event, node.name)} draggable>
      <div className="NodePickerItemText">{node.name}</div>
    </div>
  );
}

interface NodePickerCategoryProps {
  name: string;
  nodes: { name: string }[];
}

function NodePickerCategory({ name, nodes }: NodePickerCategoryProps) {
  return (
    <div className="NodePickerCategory">
      <div className="NodePickerCategoryName">{name}</div>
      {Array.isArray(nodes) && nodes.map((node, index) => (
        <NodePickerItem key={index} node={node} />
      ))}
    </div>
  );
}

const initialNodes: Node[] = [];

function App() {
  const [nodeCategories, setNodeCategories] = useState<Record<string, { name: string }[]>>({});
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), []);
  
  useEffect(() => {
    fetch('http://127.0.0.1:8000/all_nodes')
      .then((response) => response.json())
      .then((data) => {
        setNodeCategories(data);
        console.log('Fetched node names:', data);
      })
      .catch((error) => console.error('Error fetching node names:', error));
  }, []);

  let id = 0;
  const getId = () => `dndnode_${id++}`;

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  return (
    <div className="App">
      <div className='NodePicker'>
        {Object.keys(nodeCategories).map((categoryName, index) => (
          <NodePickerCategory key={index} name={categoryName} nodes={nodeCategories[categoryName]} />
        ))}
      </div>
      <ReactFlowProvider>
        <div className='ReactFlowWrapper' ref={reactFlowWrapper}>
          <ReactFlow
            colorMode="dark"
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            proOptions={{ hideAttribution: true }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onInit={setReactFlowInstance}
            onConnect={onConnect}
          >
            <Background />
            <MiniMap />
            <Controls />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
}

export default App;