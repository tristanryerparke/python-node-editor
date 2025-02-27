/**
 * Recursively preserves metadata (like expanded state) from old data structure to new data structure
 * This is particularly useful when receiving updated data from the backend while wanting to maintain
 * UI state like expanded/collapsed sections
 */
export const preserveExpandedState = (oldData: any, newData: any): any => {
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
    
    // Map through old payload items to find matches in new payload by ID
    const oldPayloadById = new Map();
    oldData.payload.forEach((item: any) => {
      if (item && item.id) oldPayloadById.set(item.id, item);
    });
    
    // Process each item in the new payload
    result.payload = newData.payload.map((newItem: any) => {
      if (newItem && newItem.id && oldPayloadById.has(newItem.id)) {
        // If we have a matching old item, preserve its expanded state
        return preserveExpandedState(oldPayloadById.get(newItem.id), newItem);
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
        result[key] = preserveExpandedState(oldData[key], newData[key]);
      }
    });
  }
  
  return result;
}; 