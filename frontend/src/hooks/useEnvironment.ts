import { useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import useFlowStore from "@/stores/flowStore";
import type { EnvironmentResponse } from "@/types/environment";

function useEnvironment() {
  const setEnvironment = useFlowStore((state) => state.setEnvironment);
  const functionSchemas = useFlowStore((state) => state.functionSchemas);
  const types = useFlowStore((state) => state.types);

  const { data, isLoading, error, mutate } = useSWR<EnvironmentResponse>(
    "/api/environment",
    fetcher,
  );

  useEffect(() => {
    if (data) {
      setEnvironment(data);
    }
  }, [data, setEnvironment]);

  return {
    functionSchemas,
    types,
    isPending: isLoading,
    error,
    refetch: mutate,
  };
}

export default useEnvironment;
