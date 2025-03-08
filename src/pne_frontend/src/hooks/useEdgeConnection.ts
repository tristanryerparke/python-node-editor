import { useNodeId } from '@xyflow/react';
import { useEffect, useState } from 'react';
import useStore from '../components/store';
import { type InputField } from '../types/nodeTypes';

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
  const [isConnected, setIsConnected] = useState(field.is_edge_connected || false);
  
  // Get edges directly from the store
  const edges = useStore(state => state.edges);
  
  useEffect(() => {
    // Check if any edge is connected to this input
    const connected = edges.some(edge => 
      edge.target === nodeId && 
      edge.targetHandle === `${nodeId}-input-${index}`
    );
    
    // Only update if connection state has changed
    if (connected !== isConnected) {
      setIsConnected(connected);
      
      // Update the field if the connection state has changed
      if (connected !== field.is_edge_connected) {
        updateField({
          ...field, 
          is_edge_connected: connected
        }, index);
      }
    }
  }, [edges, nodeId, index, field, updateField, isConnected]);

  return isConnected;
} 