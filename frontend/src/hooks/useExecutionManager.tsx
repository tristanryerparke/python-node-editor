import { useRef, useEffect, useCallback } from 'react';
import { useNodes, useEdges, useReactFlow } from '@xyflow/react';
import { serializeNodeForBackend, parseNodeForCreation } from '../utils/nodeProcessing';

export function useExecutionManager() {
  const websocketRef = useRef<WebSocket | null>(null);
  const autoExecuteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);

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

    // Update all nodes to 'pending' status
    nodesRef.current.forEach(node => {
      reactFlow.updateNodeData(node.id, { status: 'pending' });
    });

    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      websocketRef.current = new WebSocket('ws://localhost:8000/execute');
      websocketRef.current.onopen = () => {
        console.log('WebSocket connection established');
        sendExecuteMessage();
      };

      websocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status === 'node_update') {
          const updatedNode = parseNodeForCreation(data.node);
          reactFlow.updateNodeData(updatedNode.id, updatedNode.data);
          
          if (updatedNode.data.status === 'error') {
            resetPendingNodes();
          }
        } else if (data.status === 'finished') {
          resetPendingNodes();
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

  const debouncedExecute = useCallback(() => {
    if (autoExecuteTimeoutRef.current) {
      clearTimeout(autoExecuteTimeoutRef.current);
    }
    autoExecuteTimeoutRef.current = setTimeout(() => {
      if (nodesRef.current.length > 0) {
        execute();
      }
    }, 500);
  }, [execute]);

  const sendExecuteMessage = useCallback(() => {
    const serializedNodes = nodesRef.current.map(serializeNodeForBackend);
    const graph_def = { nodes: serializedNodes, edges: edgesRef.current };
    
    websocketRef.current?.send(JSON.stringify({
      action: 'execute',
      graph_def: graph_def
    }));
  }, []);

  const resetPendingNodes = useCallback(() => {
    reactFlow.getNodes().forEach(node => {
      if (node.data.status === 'pending') {
        reactFlow.updateNodeData(node.id, { status: 'not evaluated' });
      }
    });
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

  return { execute, debouncedExecute };
}