import { useCallback, useRef } from "react";
import { Node } from '@xyflow/react';
import { BaseNodeData } from '../types/nodeTypes';
import useStore from '../components/store';
import { produce } from 'immer';
import mergeWithExpandedPreserved from '../utils/mergeWithExpandedPreserved';

// Define a type that extends Node with our BaseNodeData
// Using Record<string, unknown> & BaseNodeData to satisfy the constraint
type CustomNode = Node<Record<string, unknown> & BaseNodeData>;

export default function useExecuteFlow() {
  const websocketRef = useRef<WebSocket | null>(null);
  const nodes = useStore(state => state.nodes);
  const edges = useStore(state => state.edges);
  const setNodes = useStore(state => state.setNodes);


  const sendExecuteMessage = useCallback(() => {
    const flow = {
      nodes: nodes,
      edges: edges
    }

    // prepare the data in an additional dict for sending
    const sendData = {
      action: 'execute',
      flow: flow,
    }

    websocketRef.current?.send(JSON.stringify(sendData))
    console.log('sent execute message:', sendData)
  }, [nodes, edges])


  const execute = useCallback(() => {
    if (nodes.length === 0) {
      console.log('No nodes to execute')
      return
    }

    // open websocket connection and send execute message
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      websocketRef.current = new WebSocket('ws://localhost:8000/execute');
      websocketRef.current.onopen = () => {
        console.log('WebSocket connection established');
        sendExecuteMessage();
      };

      websocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // console.log("DEBUG: Received websocket message:", data.event);

        if (data.event === 'status_update') {
          // Handle batch status updates
          const { updates } = data;
          setNodes(
            produce(nodes, (draft) => {
              updates.forEach((update: {node_id: string, status: string}) => {
                const nodeIndex = draft.findIndex(node => node.id === update.node_id);
                if (nodeIndex !== -1) {
                  console.log(`DEBUG: Updating status for node ${update.node_id} to ${update.status}`);
                  draft[nodeIndex].data = {
                    ...draft[nodeIndex].data,
                    status: update.status
                  };
                }
              });
            })
          );
        } else if (data.event === 'single_node_update') {
          // Handle full node update
          const { node } = data;
          const updatedNode = JSON.parse(node) as CustomNode;
          // console.log('DEBUG: Single node update received:', updatedNode);
          
          // Use Immer's produce for immutable updates
          const nodeIndex = nodes.findIndex(n => n.id === updatedNode.id);
          const existingNode = nodeIndex !== -1 ? nodes[nodeIndex] : null;

          // console.log('DEBUG: Existing node data:', existingNode?.data);
          console.log('DEBUG: Updated node data:', updatedNode.data);

          // Calculate merged data outside setNodes
          const mergedData = nodeIndex !== -1 
            ? mergeWithExpandedPreserved(existingNode?.data, updatedNode.data)
            : updatedNode.data;

          setNodes(
            produce(nodes, (draft) => {
              if (nodeIndex !== -1) {
                draft[nodeIndex].data = mergedData;
                // console.log('DEBUG: Updated node data with preserved expanded states:', draft[nodeIndex].data);
              }
            })
          );
        } else if (data.event === 'execution_finished') {
          // Handle execution finished event
          console.log('Execution finished');
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
      // If the connection is already open, just send the execute message
      sendExecuteMessage();
    }
  }, [sendExecuteMessage, setNodes, nodes]);

  return { execute };
}