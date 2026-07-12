import type {
  CachedValueReference,
  FrontendFieldDataWrapper,
} from "../types/types";
import { buildApiPath } from "@/lib/fetcher";

export const isArgumentValuePath = (path: (string | number)[]) =>
  path.length >= 4 && path[1] === "arguments" && path[3] === "value";

export const isCachedValueReference = (
  value: unknown,
): value is CachedValueReference => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const cacheKey = (value as CachedValueReference).cacheKey;
  return typeof cacheKey === "string" && cacheKey.length > 0;
};

const normalizeCachedValueReference = (value: unknown): CachedValueReference => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Invalid cached reference response: expected object");
  }

  const raw = value as Record<string, unknown>;
  const cacheKey = typeof raw.cacheKey === "string" ? raw.cacheKey : undefined;
  if (!cacheKey || cacheKey.length === 0) {
    throw new Error(
      "Invalid cached reference response: missing required cacheKey",
    );
  }

  const instanceType =
    typeof raw.instanceType === "string" ? raw.instanceType : undefined;
  const displayName =
    typeof raw.displayName === "string" ? raw.displayName : undefined;
  const filename = typeof raw.filename === "string" ? raw.filename : undefined;
  const preview = typeof raw.preview === "string" ? raw.preview : undefined;

  return {
    cacheKey,
    ...(instanceType ? { instanceType } : {}),
    ...(preview ? { preview } : {}),
    ...(displayName ? { displayName } : {}),
    ...(filename ? { filename } : {}),
  };
};

export type LargeDataSerializer = (
  value: unknown,
) => Promise<Record<string, unknown>> | Record<string, unknown>;

const largeDataSerializers: Record<string, LargeDataSerializer> = {};

export function registerLargeDataSerializer(
  typeName: string,
  serializer: LargeDataSerializer,
): void {
  largeDataSerializers[typeName] = serializer;
}

export async function serializeLargeData(
  typeName: string,
  value: unknown,
): Promise<Record<string, unknown>> {
  const serializer = largeDataSerializers[typeName];
  if (serializer) {
    return await serializer(value);
  }
  return { value };
}

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
  const payload = await serializeLargeData(typeName, value);

  const response = await fetch(buildApiPath("/data/cache"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      callableId,
      type: typeName,
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

  const cachedValue = normalizeCachedValueReference(await response.json());
  return {
    type: typeName,
    value: cachedValue,
  } as FrontendFieldDataWrapper;
};
