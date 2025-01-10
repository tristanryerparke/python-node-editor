import { useCallback, useRef, useState } from "react";
import { useReactFlow, type ReactFlowJsonObject } from '@xyflow/react';







export default function useExecuteFlow() {
  const websocketRef = useRef<WebSocket | null>(null);
  const reactFlow = useReactFlow()
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [lastAutosaved, setLastAutosaved] = useState<Date | null>(null);


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
        setIsExecuting(true);
        sendExecuteMessage();
      };

      websocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // this is an update

        if (data.event === 'node_update') {
          console.log('node update', JSON.parse(data.node))
          const { node } = data;
          const updatedNode = JSON.parse(node);
          reactFlow.setNodes(nds => 
            nds.map(n => n.id === updatedNode.id ? { ...n, data: updatedNode.data } : n)
          );
        } else if (data.event === 'graph_update') {
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
          setIsExecuting(false);
          setLastAutosaved(new Date());
        } else if (data.event === "execution_cancelled") {
          setIsExecuting(false);
          setIsCancelling(false);
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
  }, [reactFlow, sendExecuteMessage]);



  



  return { execute };
}