import type { FrontendFieldDataWrapper } from "../types/types";
import useTypesStore from "../stores/typesStore";

export const CACHE_KEY_PREFIX = "$cacheKey:";
export const LARGE_DATA_LIMIT_BYTES = 250 * 1024;

export const isArgumentValuePath = (path: (string | number)[]) =>
  path.length >= 4 && path[1] === "arguments" && path[3] === "value";

export const isCacheKeyString = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith(CACHE_KEY_PREFIX);

const readFileAsDataURL = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const estimateSizeBytes = (value: unknown): number | null => {
  if (value == null) return null;
  if (value instanceof Blob) return value.size;
  if (typeof value === "string") return new TextEncoder().encode(value).length;
  try {
    return new TextEncoder().encode(JSON.stringify(value)).length;
  } catch {
    return null;
  }
};

export const getConcreteType = (wrapper: FrontendFieldDataWrapper | undefined) => {
  if (!wrapper) return undefined;
  if (typeof wrapper._selectedType === "string") return wrapper._selectedType;
  if (typeof wrapper.type === "string") return wrapper.type;
  return undefined;
};

const isCachedType = (typeName: string | undefined) => {
  if (!typeName) return false;
  const types = useTypesStore.getState().types;
  return types[typeName]?.kind === "cached";
};

export const shouldCacheLargeData = (
  typeName: string | undefined,
  value: unknown,
): typeName is string => {
  if (!typeName || typeName === "str") return false;
  if (value == null) return false;

  const cachedType = isCachedType(typeName);
  const sizeBytes = estimateSizeBytes(value);
  const isFileLike = value instanceof Blob;

  return (
    cachedType ||
    isFileLike ||
    (sizeBytes !== null && sizeBytes > LARGE_DATA_LIMIT_BYTES)
  );
};

export const uploadLargeData = async (
  typeName: string,
  value: unknown,
): Promise<FrontendFieldDataWrapper> => {
  let payload: Record<string, unknown> = {};
  let filename: string | null = null;

  if (value instanceof File || value instanceof Blob) {
    const dataUrl = await readFileAsDataURL(value);
    const base64Data = dataUrl.split(",")[1] || "";
    filename = value instanceof File ? value.name : null;
    payload = {
      img_base64: base64Data,
    };
  } else {
    payload = { value };
  }

  const response = await fetch("http://localhost:8000/data/cache", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: typeName,
      filename,
      data: payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to upload large data (type: ${typeName})`);
  }

  return (await response.json()) as FrontendFieldDataWrapper;
};
