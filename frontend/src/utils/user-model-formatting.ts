export function formatUserModelValue(value: unknown, typeName: string): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return typeName;
  }

  const fields = Object.entries(value)
    .map(([key, fieldValue]) => `${key}=${fieldValue}`)
    .join(", ");

  return `${typeName}(${fields})`;
}
