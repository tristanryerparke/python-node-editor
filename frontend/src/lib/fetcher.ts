export const API_PREFIX = "/api";

export const buildApiPath = (endpoint: string): string => {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (normalizedEndpoint === API_PREFIX) {
    return normalizedEndpoint;
  }

  if (normalizedEndpoint.startsWith(`${API_PREFIX}/`)) {
    return normalizedEndpoint;
  }

  return `${API_PREFIX}${normalizedEndpoint}`;
};

export const fetcher = async <T>(endpoint: string): Promise<T> => {
  const response = await fetch(buildApiPath(endpoint));
  if (!response.ok) {
    throw new Error(`Failed request ${endpoint}: ${response.status}`);
  }
  return response.json() as Promise<T>;
};
