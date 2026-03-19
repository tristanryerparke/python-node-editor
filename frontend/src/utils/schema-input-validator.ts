import type {
  StructDescr,
  TypeSchema,
  UnionDescr,
} from "@/types/backend-schema";
import type { TypeInfo } from "@/types/environment";

// TODO: the frontend type metadata does not currently encode optional-vs-required fields beyond what appears in properties, so validation will have to assume declared properties are required unless the schema itself expresses optionality via unions like str | ...

type TypesMap = Record<string, TypeInfo>;

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
  schema: TypeSchema,
  types: TypesMap = {},
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

  return validateValueAgainstSchema(parsedValue, schema, types);
}

export function validateValueAgainstSchema(
  value: unknown,
  schema: TypeSchema,
  types: TypesMap = {},
): ValidationResult {
  return validateValue(value, schema, "$", types);
}

function validateValue(
  value: unknown,
  schema: TypeSchema,
  path: string,
  types: TypesMap,
): ValidationResult {
  if (typeof schema === "string") {
    return validateNamedType(value, schema, path, types);
  }

  if (isUnionDescr(schema)) {
    for (const option of schema.anyOf) {
      const optionResult = validateValue(value, option, path, types);
      if (optionResult.valid) {
        return optionResult;
      }
    }

    return {
      valid: false,
      error: `Invalid type at ${path}: value does not match any allowed type`,
    };
  }

  return validateStructType(value, schema, path, types);
}

function validateStructType(
  value: unknown,
  schema: StructDescr,
  path: string,
  types: TypesMap,
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
        types,
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
      types,
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

function validateNamedType(
  value: unknown,
  typeName: string,
  path: string,
  types: TypesMap,
): ValidationResult {
  const validator = SCALAR_VALIDATORS[typeName];

  if (validator) {
    if (validator(value)) {
      return { valid: true, value };
    }

    return {
      valid: false,
      error: `Invalid type at ${path}: expected ${typeName}`,
    };
  }

  const typeDef = types[typeName];

  if (typeDef?.kind === "user_model") {
    return validateUserModel(value, typeName, typeDef, path, types);
  }

  return {
    valid: false,
    error: `Unsupported scalar type at ${path}: ${typeName}`,
  };
}

function validateUserModel(
  value: unknown,
  typeName: string,
  typeDef: TypeInfo,
  path: string,
  types: TypesMap,
): ValidationResult {
  if (!isPlainObject(value)) {
    return {
      valid: false,
      error: `Invalid type at ${path}: expected ${typeName} object`,
    };
  }

  const properties = (typeDef.properties ?? {}) as Record<string, TypeSchema>;

  for (const key of Object.keys(value)) {
    if (!(key in properties)) {
      return {
        valid: false,
        error: `Invalid property at ${path}.${key}: unexpected property`,
      };
    }
  }

  for (const [propertyName, propertySchema] of Object.entries(properties)) {
    if (!(propertyName in value)) {
      return {
        valid: false,
        error: `Invalid type at ${path}.${propertyName}: missing required property`,
      };
    }

    const propertyResult = validateValue(
      value[propertyName],
      propertySchema,
      `${path}.${propertyName}`,
      types,
    );

    if (!propertyResult.valid) {
      return propertyResult;
    }
  }

  return {
    valid: true,
    value,
  };
}

function isUnionDescr(schema: TypeSchema): schema is UnionDescr {
  return typeof schema === "object" && schema !== null && "anyOf" in schema;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
