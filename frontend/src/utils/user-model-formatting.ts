export function formatUserModelValue(value: unknown, typeName: string): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return typeName;
  }

  const fields = Object.entries(value)
    .map(([key, fieldValue]) => `${key}=${fieldValue}`)
    .join(", ");

  return `${typeName}(${fields})`;
}

function formatUserModelFieldValue(value: unknown): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (
    value === null ||
    value === undefined ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function formatExpandedUserModelValue(
  value: unknown,
  typeName: string,
): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return `${typeName}()`;
  }

  const fields = Object.entries(value);

  if (fields.length === 0) {
    return `${typeName}()`;
  }

  const formattedFields = fields
    .map(
      ([key, fieldValue]) =>
        `    ${key}=${formatUserModelFieldValue(fieldValue)},`,
    )
    .join("\n");

  return `${typeName}(\n${formattedFields}\n)`;
}
