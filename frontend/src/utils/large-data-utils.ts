import type { FrontendFieldDataWrapper } from "../types/types";

export const CACHE_KEY_PREFIX = "$cacheKey:";

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

export const getConcreteType = (wrapper: FrontendFieldDataWrapper | undefined) => {
  if (!wrapper) return undefined;
  if (typeof wrapper._selectedType === "string") return wrapper._selectedType;
  if (typeof wrapper.type === "string") return wrapper.type;
  return undefined;
};

export const uploadLargeData = async (
  typeName: string,
  value: unknown,
  callableId: string,
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
      callableId,
      type: typeName,
      filename,
      data: payload,
    }),
  });

  if (!response.ok) {
    let message = `Failed to upload large data (type: ${typeName})`;
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.detail === "string") {
        message = errorBody.detail;
      }
    } catch {
      // Ignore JSON parse errors and use default message.
    }

    console.error("Large data upload failed:", message);
    throw new Error(message);
  }

  return (await response.json()) as FrontendFieldDataWrapper;
};
