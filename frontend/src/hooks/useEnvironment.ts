import { useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import useFlowStore from "@/stores/flowStore";
import type { EnvironmentResponse } from "@/types/environment";
import { buildEnvironmentMismatchWarningFromResponse } from "@/utils/environment-mismatch";
import useSettingsStore from "@/stores/settingsStore";
import { loadFrontendPlugins } from "@/plugins-runtime";

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
    if (!data) {
      return;
    }

    let cancelled = false;
    const environment = data;

    async function applyEnvironment() {
      try {
        await loadFrontendPlugins(environment.plugins ?? []);
      } catch (error) {
        console.error("Failed to load frontend plugins:", error);
      }

      if (cancelled) {
        return;
      }

      const currentState = useFlowStore.getState();
      if (warnOnEnvironmentMismatch) {
        const warning = buildEnvironmentMismatchWarningFromResponse({
          source: "backend-refetch",
          incomingEnvironment: environment,
          currentFunctionSchemas: currentState.functionSchemas,
          currentTypes: currentState.types,
        });
        if (warning) {
          setEnvironmentMismatchWarning(warning);
        }
      }
      setEnvironment(environment);
    }

    void applyEnvironment();

    return () => {
      cancelled = true;
    };
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
