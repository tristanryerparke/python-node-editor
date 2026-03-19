import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

const POLL_INTERVAL_CONNECTED = 10000; // 10 seconds when connected
const POLL_INTERVAL_DISCONNECTED = 5000; // 5 seconds when disconnected (reduced console spam)

interface HealthResponse {
  status?: string;
}

export function useBackendConnection() {
  // NOTE: When backend is down, browser will log ERR_CONNECTION_REFUSED to console.
  // This is normal browser behavior and cannot be suppressed programmatically.
  const { data, isLoading } = useSWR<HealthResponse>("/api/health", fetcher, {
    refreshInterval: (latestData) =>
      latestData?.status === "ok"
        ? POLL_INTERVAL_CONNECTED
        : POLL_INTERVAL_DISCONNECTED,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return {
    isConnected: data?.status === "ok",
    isChecking: isLoading,
  };
}
