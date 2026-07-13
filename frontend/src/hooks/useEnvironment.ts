import { useEffect, useState } from "react";
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

  const [pluginError, setPluginError] = useState<Error | null>(null);
  const [isLoadingPlugins, setIsLoadingPlugins] = useState(false);
  const [appliedEnvironment, setAppliedEnvironment] =
    useState<EnvironmentResponse | null>(null);

  const { data, isLoading, error: fetchError, mutate } =
    useSWR<EnvironmentResponse>("/api/environment", fetcher);

  useEffect(() => {
    if (!data) {
      return;
    }

    let cancelled = false;
    setIsLoadingPlugins(true);
    setPluginError(null);

    void (async () => {
      try {
        await loadFrontendPlugins(data.plugins ?? []);
        if (cancelled) {
          return;
        }

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
        setAppliedEnvironment(data);
      } catch (error) {
        if (!cancelled) {
          setPluginError(
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPlugins(false);
        }
      }
    })();

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
    isPending:
      isLoading ||
      isLoadingPlugins ||
      (data !== undefined && appliedEnvironment !== data && !pluginError),
    error: fetchError ?? pluginError,
    refetch: mutate,
  };
}

export default useEnvironment;
