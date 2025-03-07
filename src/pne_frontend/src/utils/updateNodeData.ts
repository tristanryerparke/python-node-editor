import useStore from '../components/store';
import { produce } from 'immer';

interface UpdateNodeDataProps {
  path: (string | number)[];
  newData: string | number | boolean | object;
}

// Function to get data at a specific path without updating
export function getNodeData(path: (string | number)[]) {
  const nodes = useStore.getState().nodes;
  
  const nodeIndex = nodes.findIndex(node => node.id === path[0]);
  if (nodeIndex === -1) {
    return undefined; // Node not found
  }
  
  // Start with the node's data
  let current = nodes[nodeIndex].data;
  const pathToProperty = path.slice(1);
  
  // Navigate through the path
  for (let i = 0; i < pathToProperty.length; i++) {
    const key = pathToProperty[i];
    if (current[key] === undefined) {
      return undefined; // Path doesn't exist
    }
    current = current[key] as Record<string | number, unknown>;
  }
  
  return current; // Return the data at the specified path
}

export function updateNodeData({ path, newData }: UpdateNodeDataProps) {
  const setNodes = useStore.getState().setNodes;
  const nodes = useStore.getState().nodes;

  console.log('updateNodeData', path, newData);

  setNodes(
    produce(nodes, draft => {
      const nodeIndex = draft.findIndex(node => node.id === path[0]);
      if (nodeIndex !== -1) {
        // Navigate to the target property
        let current = draft[nodeIndex].data;
        const pathToProperty = path.slice(1);
        
        for (let i = 0; i < pathToProperty.length - 1; i++) {
          const key = pathToProperty[i];
          if (current[key] === undefined) {
            current[key] = {};
          }
          current = current[key] as Record<string | number, unknown>;
        }
        
        // Update the property
        const finalKey = pathToProperty[pathToProperty.length - 1];
        current[finalKey] = newData;
      }
    })
  );
}