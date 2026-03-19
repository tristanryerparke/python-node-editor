import { useNodeData } from "@/stores/flowStore";

interface UseOutputFieldResult<T> {
  value: T | undefined;
}

export function useOutputField<T = unknown>(
  path: (string | number)[],
): UseOutputFieldResult<T> {
  const value = useNodeData([...path, "value"]) as T | undefined;

  return { value };
}
