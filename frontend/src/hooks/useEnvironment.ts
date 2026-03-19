import { useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import useFlowStore from "@/stores/flowStore";
import type { EnvironmentResponse } from "@/types/environment";
import { buildEnvironmentMismatchWarningFromResponse } from "@/utils/environment-mismatch";
import useSettingsStore from "@/stores/settingsStore";

function useEnvironment() {
  const setEnvironment = useFlowStore((state) => state.setEnvironment);
  const functionSchemas = useFlowStore((state) => state.functionSchemas);
  const types = useFlowStore((state) => state.types);
  const setEnvironmentMismatchWarning = useFlowStore(
    (state) => state.setEnvironmentMismatchWarning,
  );
  const warnOnEnvironmentMismatch = useSettingsStore(
    (state) => state.warnOnEnvironmentMismatch,
  );

  const { data, isLoading, error, mutate } = useSWR<EnvironmentResponse>(
    "/api/environment",
    fetcher,
  );

  useEffect(() => {
    if (data) {
      const currentState = useFlowStore.getState();
      if (warnOnEnvironmentMismatch) {
        const warning = buildEnvironmentMismatchWarningFromResponse({
          source: "backend-refetch",
          incomingEnvironment: data,
          currentFunctionSchemas: currentState.functionSchemas,
          currentTypes: currentState.types,
        });
        if (warning) {
          setEnvironmentMismatchWarning(warning);
        }
      }
      setEnvironment(data);
    }
  }, [
    data,
    warnOnEnvironmentMismatch,
    setEnvironment,
    setEnvironmentMismatchWarning,
  ]);

  return {
    functionSchemas,
    types,
    isPending: isLoading,
    error,
    refetch: mutate,
  };
}

export default useEnvironment;
