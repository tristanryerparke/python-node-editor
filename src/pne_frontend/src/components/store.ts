import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import { produce } from 'immer';

// Define types for the data structures we're working with
interface DataWithMetadata {
  metadata?: {
    expanded?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface ListDataItem {
  id?: string;
  [key: string]: unknown;
}

interface ListData extends DataWithMetadata {
  class_name: 'ListData';
  payload: ListDataItem[];
}

/**
 * Recursively preserves metadata (like expanded state) from old data structure to new data structure
 * This is particularly useful when receiving updated data from the backend while wanting to maintain
 * UI state like expanded/collapsed sections
 */
export const preserveExpandedState = (oldData: DataWithMetadata, newData: DataWithMetadata): DataWithMetadata => {
  // If both are objects but either is null, return the new data
  if (!oldData || !newData) return newData;
  
  // Create a copy of the new data to modify
  const result = { ...newData };
  
  // Preserve expanded state in metadata if it exists
  if (oldData.metadata && newData.metadata) {
    result.metadata = { 
      ...newData.metadata,
      expanded: oldData.metadata.expanded !== undefined ? oldData.metadata.expanded : newData.metadata.expanded 
    };
  }
  
  // Recursively handle payload for list data
  if (oldData.class_name === 'ListData' && newData.class_name === 'ListData' && 
      Array.isArray(oldData.payload) && Array.isArray(newData.payload)) {
    
    const oldListData = oldData as ListData;
    const newListData = newData as ListData;
    
    // Map through old payload items to find matches in new payload by ID
    const oldPayloadById = new Map<string, ListDataItem>();
    oldListData.payload.forEach((item: ListDataItem) => {
      if (item && item.id) oldPayloadById.set(item.id, item);
    });
    
    // Process each item in the new payload
    result.payload = newListData.payload.map((newItem: ListDataItem) => {
      if (newItem && newItem.id && oldPayloadById.has(newItem.id)) {
        // If we have a matching old item, preserve its expanded state
        return preserveExpandedState(oldPayloadById.get(newItem.id) as DataWithMetadata, newItem as DataWithMetadata);
      }
      return newItem;
    });
  }
  
  // Recursively handle all other properties that might contain nested data
  if (typeof oldData === 'object' && typeof newData === 'object') {
    Object.keys(newData).forEach(key => {
      if (key !== 'metadata' && key !== 'payload' && key !== 'id' && 
          typeof newData[key] === 'object' && newData[key] !== null &&
          oldData[key] && typeof oldData[key] === 'object') {
        result[key] = preserveExpandedState(oldData[key] as DataWithMetadata, newData[key] as DataWithMetadata);
      }
    });
  }
  
  return result;
};

// store for NodeGraph state using zustand
export type AppState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
}

const useStore = create<AppState>((set, get) => ({
  nodes: [],  // initial state for nodes, used in NodeGraph
  edges: [],  // initial state for edges, used in NodeGraph
  
  // This is the key fix - create a custom onNodesChange that works with Immer
  onNodesChange: (changes) => {
    set(
      produce((state: AppState) => {
        // Create a mutable copy of nodes just for applyNodeChanges
        const nodesCopy = [...state.nodes];
        // Apply changes to the copy
        const updatedNodes = applyNodeChanges(changes, nodesCopy);
        // Update the state with the results
        state.nodes = updatedNodes;
      })
    );
  },
  
  onEdgesChange: (changes) => {
    set(
      produce((state: AppState) => {
        // Create a mutable copy of edges just for applyEdgeChanges
        const edgesCopy = [...state.edges];
        // Apply changes to the copy
        const updatedEdges = applyEdgeChanges(changes, edgesCopy);
        // Update the state with the results
        state.edges = updatedEdges;
      })
    );
  },
  onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  
}));

export default useStore;
