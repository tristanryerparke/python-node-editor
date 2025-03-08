import { produce } from 'immer';

/**
 * Merges two objects while preserving expanded metadata states from the original object.
 * This is particularly useful when updating data from the backend to maintain UI state.
 * 
 * @param originalObj The original object that may contain expanded metadata states
 * @param incomingObj The new object from the backend that should be merged with the original
 * @returns A new object with the incoming data but preserving expanded states from the original
 */
export function mergeWithExpandedPreserved<T extends Record<string, unknown>, U extends Record<string, unknown>>(
  originalObj: T | null | undefined, 
  incomingObj: U | null | undefined
): U {
  // If either object is null/undefined, return the other one
  if (!originalObj) return incomingObj as unknown as U;
  if (!incomingObj) return {} as U; // Return empty object if incoming is null/undefined
  
  return produce(incomingObj, (draft: U) => {
    // Helper function to recursively process objects
    function processObjects(source: Record<string, unknown> | unknown[], target: Record<string, unknown> | unknown[]) {
      // Skip if either is not an object or is null
      if (typeof source !== 'object' || source === null || 
          typeof target !== 'object' || target === null) {
        return;
      }
      
      // Handle arrays
      if (Array.isArray(source) && Array.isArray(target)) {
        // Process each array element by position
        source.forEach((sourceItem, index) => {
          if (index < target.length) {
            processObjects(sourceItem as Record<string, unknown>, target[index] as Record<string, unknown>);
          }
        });
        return;
      }
      
      // Check for metadata with expanded: true
      const sourceObj = source as Record<string, unknown>;
      const targetObj = target as Record<string, unknown>;
      
      if (sourceObj.metadata && 
          typeof sourceObj.metadata === 'object' && 
          sourceObj.metadata !== null &&
          (sourceObj.metadata as Record<string, unknown>).expanded === true && 
          targetObj.metadata && 
          typeof targetObj.metadata === 'object') {
        (targetObj.metadata as Record<string, unknown>).expanded = true;
      }
      
      // Continue traversing nested objects and arrays
      Object.keys(sourceObj).forEach(key => {
        if (key in targetObj && 
            typeof sourceObj[key] === 'object' && sourceObj[key] !== null && 
            typeof targetObj[key] === 'object' && targetObj[key] !== null) {
          processObjects(
            sourceObj[key] as Record<string, unknown>, 
            targetObj[key] as Record<string, unknown>
          );
        }
      });
    }
    
    // Start the recursive process
    processObjects(originalObj, draft);
  });
}

export default mergeWithExpandedPreserved; 