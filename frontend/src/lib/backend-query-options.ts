import { queryOptions } from "@tanstack/react-query";

const BACKEND_URL = "http://localhost:8000";

const fetchJson = async <T>(
  endpoint: string,
  signal?: AbortSignal,
): Promise<T> => {
  const response = await fetch(`${BACKEND_URL}${endpoint}`, { signal });

  if (!response.ok) {
    throw new Error(`Failed request ${endpoint}: ${response.status}`);
  }

  return (await response.json()) as T;
};

export interface HealthResponse {
  status?: string;
}

export const healthQueryOptions = queryOptions({
  queryKey: ["health"],
  queryFn: ({ signal }) => fetchJson<HealthResponse>("/health", signal),
  retry: false,
});

export const nodeSchemasQueryOptions = queryOptions({
  queryKey: ["nodes"],
  queryFn: ({ signal }) => fetchJson<unknown>("/nodes", signal),
});

export const typesQueryOptions = queryOptions({
  queryKey: ["types"],
  queryFn: ({ signal }) => fetchJson<unknown>("/types", signal),
});
