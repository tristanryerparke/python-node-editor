import { useRef, useEffect, useCallback, useState, useContext } from 'react';
import { useNodes, useReactFlow } from '@xyflow/react';
import type { Node, ReactFlowJsonObject } from '@xyflow/react';
import { AppContext, FlowMetadataContext } from '../GlobalContext';
import { FlowFileObject } from '../types/DataTypes';


export function useExecutionManager() {
  const websocketRef = useRef<WebSocket | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { filename } = useContext(FlowMetadataContext);
  const { setLastAutosaved } = useContext(AppContext);
  const nodes = useNodes();
  const reactFlow = useReactFlow();

  const resetPendingNodes = useCallback(() => {
    reactFlow.setNodes(nds => 
      nds.map(node => 
        node.data.status === 'pending' 
          ? { ...node, data: { ...node.data, status: 'not evaluated' } } 
          : node
      )
    );
  }, [reactFlow]);

  const sendExecuteMessage = useCallback((quiet: boolean = false) => {
    // Create the file and send it
    const rawFlow: ReactFlowJsonObject = reactFlow.toObject();
    const flow_file: FlowFileObject = {
      ...rawFlow,
      embedded_data: {},
      metadata: {
        filename: filename
      }
    }
    const send_data = {
      action: 'execute',
      flow_file: flow_file,
      quiet: quiet
    };
    websocketRef.current?.send(JSON.stringify(send_data));
    console.log(send_data)
  }, [reactFlow, filename]);

  const execute = useCallback((quiet: boolean = false) => {
    if (nodes.length === 0) return;

    // set all nodes to pending and reset progress on streaming nodes
    nodes.forEach(node => {
      reactFlow.setNodes(nds => 
        nds.map(n => n.id === node.id ? {
          ...n,
          data: {
            ...n.data,
            status: 'pending',
            progress: n.data.streaming ? 0 : n.data.progress
          }
        } : n)
      );
    });

    if (!quiet) {
      console.log('Executing flow')
    }

    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      websocketRef.current = new WebSocket('ws://localhost:8000/execute');
      websocketRef.current.onopen = () => {
        console.log('WebSocket connection established');
        setIsExecuting(true); 
        sendExecuteMessage(quiet);
      };

      websocketRef.current.onmessage = (event) => {
        
        const data = JSON.parse(event.data);
        if (data.event === 'node_data_update') {
          const { node_id, updates } = data;
          reactFlow.setNodes(nds => 
            nds.map(n => n.id === node_id ? { ...n, data: { ...n.data, ...updates } } : n)
          );
        } else if (data.event === 'full_node_update') {
          console.log('full node update', JSON.parse(data.node))
          const { node } = data;
          const updatedNode = JSON.parse(node);
          reactFlow.setNodes(nds => 
            nds.map(n => n.id === updatedNode.id ? { ...n, data: updatedNode.data } : n)
          );
        } else if (data.event === 'full_graph_update') {
          const { all_nodes: updatedNodes } = data;
          reactFlow.setNodes(nds => 
            nds.map(existingNode => {
              const updatedNode = updatedNodes.find((n: Node) => n.id === existingNode.id);
              return updatedNode 
                ? { ...existingNode, data: updatedNode.data }
                : existingNode;
            })
          );
        } else if (data.event === 'execution_finished') {
          resetPendingNodes();
          setIsExecuting(false);
          setLastAutosaved(new Date());
        } else if (data.event === "execution_cancelled") {
          setIsExecuting(false);
          setIsCancelling(false);
          resetPendingNodes();
        }
      };

      websocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsExecuting(false);
      };
      websocketRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        websocketRef.current = null;
        setIsExecuting(false);
      };
    }
  }, [nodes, reactFlow, resetPendingNodes, sendExecuteMessage]);



  const cancel = useCallback(() => {
    setIsCancelling(true);
    websocketRef.current?.send(JSON.stringify({ action: 'cancel' }));
  }, []);

  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  return { execute, cancel, isExecuting, isCancelling };
}