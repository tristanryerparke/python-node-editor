import { describe, expect, it } from "vitest";
import {
  type SchemaType,
  validateInputAgainstSchema,
  validateValueAgainstSchema,
} from "./schema-input-validator";

describe("validateInputAgainstSchema", () => {
  it("validates int input and returns parsed number", () => {
    const result = validateInputAgainstSchema("1", "int");

    expect(result).toEqual({
      valid: true,
      value: 1,
    });
  });

  it("validates a list of ints", () => {
    const schema: SchemaType = {
      structureType: "list",
      itemsType: "int",
    };

    const result = validateInputAgainstSchema("[1, 2]", schema);

    expect(result).toEqual({
      valid: true,
      value: [1, 2],
    });
  });

  it("fails for invalid JSON list input", () => {
    const schema: SchemaType = {
      structureType: "list",
      itemsType: "int",
    };

    const result = validateInputAgainstSchema("[1, a]", schema);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("Invalid JSON");
    }
  });

  it("fails for valid JSON with invalid item type", () => {
    const schema: SchemaType = {
      structureType: "list",
      itemsType: "int",
    };

    const result = validateInputAgainstSchema('[1, "a"]', schema);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("$[1]");
      expect(result.error).toContain("expected int");
    }
  });

  it("validates list items against union anyOf type", () => {
    const schema: SchemaType = {
      structureType: "list",
      itemsType: {
        anyOf: ["int", "str"],
      },
    };

    const result = validateInputAgainstSchema('[1, "a"]', schema);

    expect(result).toEqual({
      valid: true,
      value: [1, "a"],
    });
  });

  it("validates dict values against itemsType", () => {
    const schema: SchemaType = {
      structureType: "dict",
      itemsType: "float",
    };

    const result = validateInputAgainstSchema('{"x": 1, "y": 2.5}', schema);

    expect(result).toEqual({
      valid: true,
      value: { x: 1, y: 2.5 },
    });
  });

  it("fails when anyOf does not match", () => {
    const schema: SchemaType = {
      anyOf: ["int", "str"],
    };

    const result = validateInputAgainstSchema("true", schema);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("does not match any allowed type");
    }
  });
});

describe("validateValueAgainstSchema", () => {
  it("validates value without JSON parsing", () => {
    const result = validateValueAgainstSchema([1, 2], {
      structureType: "list",
      itemsType: "int",
    });

    expect(result).toEqual({
      valid: true,
      value: [1, 2],
    });
  });

  it("fails value validation for mismatched dict item type", () => {
    const result = validateValueAgainstSchema(
      { a: 1, b: "bad" },
      {
        structureType: "dict",
        itemsType: "float",
      },
    );

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("$.b");
      expect(result.error).toContain("expected float");
    }
  });
});
