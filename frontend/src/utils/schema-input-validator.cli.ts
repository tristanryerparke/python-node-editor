import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import type { SchemaType } from "./schema-input-validator";
import { validateInputAgainstSchema } from "./schema-input-validator";

function shouldExit(input: string): boolean {
  const normalized = input.trim().toLowerCase();
  return normalized === "exit" || normalized === "quit" || normalized === "q";
}

function parseSchemaInput(rawSchema: string): SchemaType | null {
  const trimmed = rawSchema.trim();
  if (!trimmed) {
    return null;
  }

  // Allow shorthand scalar types (int, float, str, bool) without JSON quotes.
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return isSchemaType(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isSchemaType(value: unknown): value is SchemaType {
  if (typeof value === "string") {
    return true;
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  if ("anyOf" in value) {
    return isUnionDescriptor(value);
  }

  if ("structureType" in value && "itemsType" in value) {
    return isStructDescriptor(value);
  }

  return false;
}

function isUnionDescriptor(value: unknown): value is { anyOf: string[] } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  if (!("anyOf" in value)) {
    return false;
  }

  const anyOfValue = (value as { anyOf?: unknown }).anyOf;
  return Array.isArray(anyOfValue) && anyOfValue.every((entry) => typeof entry === "string");
}

function isStructDescriptor(value: unknown): value is {
  structureType: "list" | "dict";
  itemsType: string | { anyOf: string[] };
} {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const struct = value as { structureType?: unknown; itemsType?: unknown };
  if (struct.structureType !== "list" && struct.structureType !== "dict") {
    return false;
  }

  return (
    typeof struct.itemsType === "string" || isUnionDescriptor(struct.itemsType)
  );
}

async function runInteractiveCli(): Promise<void> {
  const rl = createInterface({
    input: stdin,
    output: stdout,
  });

  console.log("Schema Input Validator CLI");
  console.log("Enter 'exit' to quit at any prompt.\n");
  console.log("Schema examples:");
  console.log("  int");
  console.log('  {"anyOf":["int","str"]}');
  console.log('  {"structureType":"list","itemsType":"int"}');
  console.log(
    '  {"structureType":"list","itemsType":{"anyOf":["int","str"]}}\n',
  );

  try {
    while (true) {
      const rawSchema = await rl.question("Schema> ");
      if (shouldExit(rawSchema)) {
        break;
      }

      const schema = parseSchemaInput(rawSchema);
      if (!schema) {
        console.log(
          "Invalid schema. Use a scalar type (e.g. int) or JSON object matching backend schema.\n",
        );
        continue;
      }

      const rawInput = await rl.question("Input JSON> ");
      if (shouldExit(rawInput)) {
        break;
      }

      const result = validateInputAgainstSchema(rawInput, schema);
      if (result.valid) {
        console.log("VALID");
        console.log(`Parsed value: ${JSON.stringify(result.value)}\n`);
      } else {
        console.log("INVALID");
        console.log(`Reason: ${result.error}\n`);
      }
    }
  } finally {
    rl.close();
  }

  console.log("Exiting validator CLI.");
}

void runInteractiveCli();
