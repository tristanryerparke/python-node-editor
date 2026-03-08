export const BACKEND_URL = "http://localhost:8000";

export const fetcher = async <T>(endpoint: string): Promise<T> => {
  const response = await fetch(`${BACKEND_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`Failed request ${endpoint}: ${response.status}`);
  }
  return response.json() as Promise<T>;
};
