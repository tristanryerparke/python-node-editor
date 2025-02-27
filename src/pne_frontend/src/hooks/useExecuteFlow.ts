import { useCallback, useRef } from "react";
import { useReactFlow, type ReactFlowJsonObject, Node } from '@xyflow/react';
import { BaseNodeData, InputField, OutputField } from '../types/nodeTypes';
import { preserveExpandedState } from '../utils/preserveMetadata';


// Define TypeScript interfaces for our data structures
interface NodeData extends BaseNodeData {
  inputs: InputField[];
  outputs: OutputField[];
  [key: string]: any;
}

interface CustomNode extends Node {
  data: NodeData;
}

export default function useExecuteFlow() {
  const websocketRef = useRef<WebSocket | null>(null);
  const reactFlow = useReactFlow()


  const sendExecuteMessage = useCallback(() => {
    const flow: ReactFlowJsonObject = reactFlow.toObject()


    // prepare the data in an additional dict for sending
    const sendData = {
      action: 'execute',
      flow: flow,
    }

    websocketRef.current?.send(JSON.stringify(sendData))
    console.log('sent execute message:', sendData)
  }, [reactFlow])


  const execute = useCallback(() => {
    const nodes = reactFlow.getNodes()
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
          reactFlow.setNodes(nds => 
            nds.map(node => {
              const statusUpdate = updates.find((u: {node_id: string}) => u.node_id === node.id);
              if (statusUpdate) {
                console.log(`DEBUG: Updating status for node ${node.id} to ${statusUpdate.status}`);
                return { ...node, data: { ...node.data, status: statusUpdate.status }};
              }
              return node;
            })
          );
        } else if (data.event === 'single_node_update') {
          // Handle full node update
          
          const { node } = data;
          const updatedNode = JSON.parse(node) as CustomNode;
          console.log('DEBUG: Single node update received:', updatedNode);
          
          // Replace the existing node update logic
          reactFlow.setNodes(nds => 
            nds.map(n => {
              if (n.id === updatedNode.id) {
                // Find existing node to preserve its expanded state
                const existingNode = nds.find(existing => existing.id === updatedNode.id) as CustomNode;
                if (existingNode) {
                  // Process inputs
                  const processedInputs = updatedNode.data.inputs.map((newInput: InputField, idx: number) => {
                    return existingNode.data.inputs[idx] ? 
                      { ...newInput, data: preserveExpandedState(existingNode.data.inputs[idx].data, newInput.data) } : 
                      newInput;
                  });
                  
                  // Process outputs
                  const processedOutputs = updatedNode.data.outputs.map((newOutput: OutputField, idx: number) => {
                    return existingNode.data.outputs[idx] ? 
                      { ...newOutput, data: preserveExpandedState(existingNode.data.outputs[idx].data, newOutput.data) } : 
                      newOutput;
                  });
                  
                  return { 
                    ...n, 
                    data: { 
                      ...updatedNode.data,
                      inputs: processedInputs,
                      outputs: processedOutputs
                    } 
                  };
                }
                return { ...n, data: updatedNode.data };
              }
              return n;
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
    }
  }, [reactFlow, sendExecuteMessage]);



  



  return { execute };
}