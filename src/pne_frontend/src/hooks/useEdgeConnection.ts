import { 
  useStore, 
  useNodeId, 
  useReactFlow,
  type ReactFlowState,
  type Edge,
} from '@xyflow/react';
import { type InputField } from '../types/nodeTypes';
import { useEffect, useRef } from 'react';

const edgesLengthSelector = (state: ReactFlowState) => state.edges.length || 0;

interface UseEdgeConnectionProps {
  field: InputField;
  index: number;
  updateField: (field: InputField, index: number) => void;
}

// This hook is used to check if an edge is connected to an input field and update
// the node's input data field via the callback function
// Used for disabling user input fields when an edge is connected
export function useEdgeConnection({ field, index, updateField }: UseEdgeConnectionProps) {
  const nodeId = useNodeId();
  const prevEdgesLength = useRef(0);
  const edgesLength = useStore(edgesLengthSelector);
  const reactFlow = useReactFlow();

  useEffect(() => {
    if (prevEdgesLength.current !== edgesLength) {
      const edges = reactFlow.getEdges();
      const isConnected = edges.some((edge: Edge) => 
        edge.target === nodeId && 
        edge.targetHandle === `${nodeId}-input-${index}`
      );
      if (isConnected !== field.is_edge_connected) {
        updateField({
          ...field, 
          is_edge_connected: isConnected
        }, index);
        // console.log(`Edge connected: ${isConnected}`);
      }
      prevEdgesLength.current = edgesLength;
    }
  }, [edgesLength, nodeId, index, reactFlow, field, updateField]);

  return field.is_edge_connected;
} 