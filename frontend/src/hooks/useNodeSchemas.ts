import { useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import useSchemasStore from "@/stores/schemasStore";

export type { NodesResponse } from "@/stores/schemasStore";

function useNodeSchemas() {
  const setNodeSchemas = useSchemasStore((s) => s.setNodeSchemas);
  const nodeSchemas = useSchemasStore((s) => s.nodeSchemas);

  const { data, isLoading, error, mutate } = useSWR("/nodes", fetcher);

  useEffect(() => {
    if (data) setNodeSchemas(data as typeof nodeSchemas);
  }, [data, setNodeSchemas]);

  return {
    nodeSchemas: nodeSchemas,
    isPending: isLoading,
    error,
    refetch: mutate,
  };
}

export default useNodeSchemas;

