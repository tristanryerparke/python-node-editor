import type {
  StructDescr,
  TypeExpr,
  UnionDescr,
} from "@/types/backend-schema";

export type SchemaType = TypeExpr;

export type ValidationResult<T = unknown> =
  | {
      valid: true;
      value: T;
    }
  | {
      valid: false;
      error: string;
    };

export function validateInputAgainstSchema(
  rawInput: string,
  schema: SchemaType,
): ValidationResult {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(rawInput);
  } catch {
    return {
      valid: false,
      error: "Invalid JSON input",
    };
  }

  return validateValueAgainstSchema(parsedValue, schema);
}

export function validateValueAgainstSchema(
  value: unknown,
  schema: SchemaType,
): ValidationResult {
  return validateValue(value, schema, "$");
}

function validateValue(
  value: unknown,
  schema: SchemaType,
  path: string,
): ValidationResult {
  if (typeof schema === "string") {
    return validateScalarType(value, schema, path);
  }

  if (isUnionDescr(schema)) {
    for (const option of schema.anyOf) {
      const optionResult = validateValue(value, option, path);
      if (optionResult.valid) {
        return optionResult;
      }
    }

    return {
      valid: false,
      error: `Invalid type at ${path}: value does not match any allowed type`,
    };
  }

  return validateStructType(value, schema, path);
}

function validateStructType(
  value: unknown,
  schema: StructDescr,
  path: string,
): ValidationResult {
  if (schema.structureType === "list") {
    if (!Array.isArray(value)) {
      return {
        valid: false,
        error: `Invalid type at ${path}: expected list`,
      };
    }

    for (let index = 0; index < value.length; index += 1) {
      const itemResult = validateValue(
        value[index],
        schema.itemsType,
        `${path}[${index}]`,
      );
      if (!itemResult.valid) {
        return itemResult;
      }
    }

    return {
      valid: true,
      value,
    };
  }

  if (!isPlainObject(value)) {
    return {
      valid: false,
      error: `Invalid type at ${path}: expected dict`,
    };
  }

  for (const [key, dictValue] of Object.entries(value)) {
    const dictValueResult = validateValue(
      dictValue,
      schema.itemsType,
      `${path}.${key}`,
    );
    if (!dictValueResult.valid) {
      return dictValueResult;
    }
  }

  return {
    valid: true,
    value,
  };
}

const SCALAR_VALIDATORS: Record<string, (value: unknown) => boolean> = {
  int: (value) => typeof value === "number" && Number.isInteger(value),
  float: (value) => typeof value === "number" && Number.isFinite(value),
  str: (value) => typeof value === "string",
  bool: (value) => typeof value === "boolean",
};

function validateScalarType(
  value: unknown,
  typeName: string,
  path: string,
): ValidationResult {
  const validator = SCALAR_VALIDATORS[typeName];

  if (!validator) {
    return {
      valid: false,
      error: `Unsupported scalar type at ${path}: ${typeName}`,
    };
  }

  if (validator(value)) {
    return { valid: true, value };
  }

  return {
    valid: false,
    error: `Invalid type at ${path}: expected ${typeName}`,
  };
}

function isUnionDescr(schema: TypeExpr): schema is UnionDescr {
  return typeof schema === "object" && schema !== null && "anyOf" in schema;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
