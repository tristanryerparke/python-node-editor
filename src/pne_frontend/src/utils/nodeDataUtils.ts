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
  // Function to handle user updates to node data
  const setNodes = useStore.getState().setNodes;
  const nodes = useStore.getState().nodes;

  // If the last but one element is 'inputs', add 'data' to the path
  if (path[path.length - 2] === 'inputs') {
    path = [...path, 'data'];
  }

  console.log('updating ', path);
  console.log('from ', getNodeData(path));
  console.log('to ', newData);

  // Check if we're creating a new property
  const existingData = getNodeData(path);
  const isNewProperty = existingData === undefined;
  
  if (isNewProperty) {
    // Find how far we get in the path before failing
    const currentNode = nodes.find(node => node.id === path[0]);
    let validUntil = 0;
    let failedKey: string | number | undefined = undefined;
    if (currentNode) {
      let currentData = currentNode.data as Record<string | number, unknown>;
      for (let i = 1; i < path.length; i++) {
        const key = path[i];
        if (currentData && currentData[key] !== undefined) {
          currentData = currentData[key] as Record<string | number, unknown>;
          validUntil = i;
        } else {
          failedKey = key;
          break;
        }
      }
    }
    const validPath = path.slice(0, validUntil + 1);
    console.warn(`Creating new property at path: ${path.join('.')}. This may be unintentional. Path was valid up to: ${validPath.join('.')} and failed at key: ${failedKey}`);
    console.log('nodes', nodes);
  }

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
            console.warn(`Creating new nested property: ${key} at path: ${path.slice(0, i + 2).join('.')}`);
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

  // Use setTimeout to log the updated state after the state update has been applied
  setTimeout(() => {
    console.log('updated node data', useStore.getState().nodes);
  }, 0);
}