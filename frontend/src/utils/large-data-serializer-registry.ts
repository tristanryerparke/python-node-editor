export type LargeDataSerializer = (
  value: unknown,
) => Promise<Record<string, unknown>> | Record<string, unknown>;

const serializers: Record<string, LargeDataSerializer> = {};

export function registerLargeDataSerializer(
  typeName: string,
  serializer: LargeDataSerializer,
) {
  serializers[typeName] = serializer;
}

export async function serializeLargeData(
  typeName: string,
  value: unknown,
): Promise<Record<string, unknown>> {
  const serializer = serializers[typeName];
  if (serializer) {
    return serializer(value);
  }

  return { value };
}
