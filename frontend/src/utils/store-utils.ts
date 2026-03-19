export type NestedPath = (string | number)[];
export type NestedRecord = Record<string | number, unknown>;

export const findItemIndexById = <T extends { id: string | number }>(
  items: T[],
  itemId: string | number,
): number => {
  return items.findIndex((item) => item.id === itemId);
};

export const findNodeIndexById = <T extends { id: string | number }>(
  nodes: T[],
  nodeId: string | number,
): number => {
  return findItemIndexById(nodes, nodeId);
};

export function isNestedRecord(value: unknown): value is NestedRecord {
  return typeof value === "object" && value !== null;
}

export function getDataAtPath(current: unknown, path: NestedPath): unknown {
  let value = current;

  for (const key of path) {
    if (!isNestedRecord(value) || !(key in value)) {
      return undefined;
    }

    value = value[key];
  }

  return value;
}

export function setDataAtPath(
  current: NestedRecord,
  path: NestedPath,
  newData: unknown,
) {
  if (path.length === 0) {
    return;
  }

  let target = current;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const next = target[key];

    if (!isNestedRecord(next)) {
      target[key] = {};
    }

    target = target[key] as NestedRecord;
  }

  target[path[path.length - 1]] = newData;
}
