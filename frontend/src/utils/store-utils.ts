export const findNodeIndexById = <T extends { id: string | number }>(
  nodes: T[],
  nodeId: string | number,
): number => {
  return nodes.findIndex((node) => node.id === nodeId);
};
