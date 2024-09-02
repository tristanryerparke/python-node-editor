import { useRef, useEffect, useCallback, useState } from 'react';
import { useNodes, useEdges, useReactFlow } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';

export function useExecutionManager() {
  const websocketRef = useRef<WebSocket | null>(null);
  const autoExecuteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const nodes = useNodes();
  const edges = useEdges();
  const reactFlow = useReactFlow();

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const execute = useCallback(() => {
    if (nodesRef.current.length === 0) return;
    setIsExecuting(true);

    // Update all nodes to 'pending' status
    nodesRef.current.forEach(node => {
      reactFlow.setNodes(nds => 
        nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: 'pending' } } : n)
      );
    });

    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      websocketRef.current = new WebSocket('ws://localhost:8000/execute');
      websocketRef.current.onopen = () => {
        console.log('WebSocket connection established');
        sendExecuteMessage();
      };

      websocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === 'node_data_update') {
          const { node_id, updates } = data;
          reactFlow.setNodes(nds => 
            nds.map(n => n.id === node_id ? { ...n, data: { ...n.data, ...updates } } : n)
          );
        } else if (data.event === 'full_node_update') {
          const { node_id, node } = data;
          const updatedNode = JSON.parse(node);
          reactFlow.setNodes(nds => 
            nds.map(n => n.id === updatedNode.id ? { ...n, data: updatedNode.data } : n)
          );
        } else if (data.event === 'execution_finished') {
          resetPendingNodes();
          setIsExecuting(false);
        }
      };

      websocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      websocketRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        websocketRef.current = null;
      };
    } else {
      sendExecuteMessage();
    }
  }, [reactFlow]);

  const sendExecuteMessage = useCallback(() => {
    const graph_def = { nodes: nodesRef.current, edges: edgesRef.current };
    
    websocketRef.current?.send(JSON.stringify({
      action: 'execute',
      graph_def: graph_def
    }));
    console.log(graph_def)
  }, []);

  const resetPendingNodes = useCallback(() => {
    reactFlow.setNodes(nds => 
      nds.map(node => 
        node.data.status === 'pending' 
          ? { ...node, data: { ...node.data, status: 'not evaluated' } } 
          : node
      )
    );
  }, [reactFlow]);

  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (autoExecuteTimeoutRef.current) {
        clearTimeout(autoExecuteTimeoutRef.current);
      }
    };
  }, []);

  return { execute, isExecuting };
}