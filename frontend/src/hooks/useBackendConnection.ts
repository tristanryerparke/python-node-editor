import { useQuery } from "@tanstack/react-query";
import { healthQueryOptions } from "@/lib/backend-query-options";

const POLL_INTERVAL_CONNECTED = 10000; // 10 seconds when connected
const POLL_INTERVAL_DISCONNECTED = 5000; // 5 seconds when disconnected (reduced console spam)

export function useBackendConnection() {
  const { data, isPending } = useQuery({
    ...healthQueryOptions,
    // NOTE: When backend is down, browser will log ERR_CONNECTION_REFUSED to console.
    // This is normal browser behavior and cannot be suppressed programmatically.
    refetchInterval: (query) => {
      const isConnected = query.state.data?.status === "ok";
      return isConnected
        ? POLL_INTERVAL_CONNECTED
        : POLL_INTERVAL_DISCONNECTED;
    },
    refetchIntervalInBackground: true,
  });

  return {
    isConnected: data?.status === "ok",
    isChecking: isPending,
  };
}
