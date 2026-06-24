import type { Edge } from "@xyflow/react";
import type {
  FrontendFieldDataWrapper,
  FunctionNode,
} from "@/types/types";
import type { StructDescr, TypeSchema, UnionDescr } from "@/types/backend-schema";
import type { TypeInfo } from "@/types/environment";
import { validateValueAgainstSchema } from "./schema-input-validator";

const SUPPORTED_SCALAR_TYPES = new Set(["int", "float", "str", "bool"]);
const SUPPORTED_TARGET_HANDLE_SECTIONS = new Set(["arguments", "inputs"]);

export interface InvalidInputIssue {
  nodeId: string;
  inputName: string;
  reason: string;
}

export interface InvalidInputValidationOptions {
  requireValues?: boolean;
  types?: Record<string, TypeInfo>;
}

export interface InputValidationState {
  invalidInputIssues: InvalidInputIssue[];
  invalidInputIssueByKey: Record<string, InvalidInputIssue>;
  invalidInputCount: number;
}

export const getInputIssueKey = (nodeId: string, inputName: string) =>
  JSON.stringify([nodeId, inputName]);

function getEffectiveSchema(fieldData: FrontendFieldDataWrapper): TypeSchema {
  if (
    typeof fieldData.type === "object" &&
    "anyOf" in fieldData.type &&
    fieldData.type.anyOf
  ) {
    const selectedType = fieldData._selectedType || fieldData.type.anyOf[0];
    return selectedType;
  }

  return fieldData.type as TypeSchema;
}

function isNamedTypeSupported(
  typeName: string,
  types: Record<string, TypeInfo>,
): boolean {
  if (SUPPORTED_SCALAR_TYPES.has(typeName)) {
    return true;
  }

  return types[typeName]?.kind === "user_model";
}

function isSupportedUnion(
  schema: UnionDescr,
  types: Record<string, TypeInfo>,
): boolean {
  return schema.anyOf.every((typeName) => isNamedTypeSupported(typeName, types));
}

function isSupportedStruct(
  schema: StructDescr,
  types: Record<string, TypeInfo>,
): boolean {
  if (typeof schema.itemsType === "string") {
    return isNamedTypeSupported(schema.itemsType, types);
  }

  return isSupportedUnion(schema.itemsType, types);
}

function isSchemaSupported(
  schema: TypeSchema,
  types: Record<string, TypeInfo>,
): boolean {
  if (typeof schema === "string") {
    return isNamedTypeSupported(schema, types);
  }

  if ("anyOf" in schema) {
    return isSupportedUnion(schema, types);
  }

  return isSupportedStruct(schema, types);
}

function getTargetInputName(edge: Edge): string | null {
  const { targetHandle } = edge;
  if (!targetHandle) {
    return null;
  }

  const parts = targetHandle.split(":");
  if (
    parts.length < 4 ||
    parts[parts.length - 1] !== "handle" ||
    !SUPPORTED_TARGET_HANDLE_SECTIONS.has(parts[parts.length - 3])
  ) {
    return null;
  }

  return parts[parts.length - 2];
}

function getConnectedTargetInputKeys(edges: Edge[]): Set<string> {
  const connectedInputKeys = new Set<string>();

  for (const edge of edges) {
    const inputName = getTargetInputName(edge);
    if (inputName !== null) {
      connectedInputKeys.add(getInputIssueKey(edge.target, inputName));
    }
  }

  return connectedInputKeys;
}

export function getInvalidNodeInputIssues(
  nodes: FunctionNode[],
  edges: Edge[],
  options: InvalidInputValidationOptions = {},
): InvalidInputIssue[] {
  const { requireValues = false, types = {} } = options;
  const connectedTargetInputKeys = getConnectedTargetInputKeys(edges);
  const invalidIssues: InvalidInputIssue[] = [];

  for (const node of nodes) {
    const argumentsData = node.data.arguments || {};
    for (const [argName, argData] of Object.entries(argumentsData)) {
      if (connectedTargetInputKeys.has(getInputIssueKey(node.id, argName))) {
        continue;
      }

      if (argData.value === null || argData.value === undefined) {
        if (requireValues) {
          invalidIssues.push({
            nodeId: node.id,
            inputName: argName,
            reason: "Missing required input",
          });
        }
        continue;
      }

      const schema = getEffectiveSchema(argData);
      if (!isSchemaSupported(schema, types)) {
        continue;
      }

      const validationResult = validateValueAgainstSchema(
        argData.value,
        schema,
        types,
      );
      if (!validationResult.valid) {
        invalidIssues.push({
          nodeId: node.id,
          inputName: argName,
          reason: validationResult.error,
        });
      }
    }
  }

  return invalidIssues;
}

export function createInputValidationStateFromIssues(
  invalidInputIssues: InvalidInputIssue[],
): InputValidationState {
  return {
    invalidInputIssues,
    invalidInputIssueByKey: Object.fromEntries(
      invalidInputIssues.map((issue) => [
        getInputIssueKey(issue.nodeId, issue.inputName),
        issue,
      ]),
    ),
    invalidInputCount: invalidInputIssues.length,
  };
}

export function createInputValidationState(
  nodes: FunctionNode[],
  edges: Edge[],
  types: Record<string, TypeInfo> = {},
): InputValidationState {
  return createInputValidationStateFromIssues(
    getInvalidNodeInputIssues(nodes, edges, {
      requireValues: true,
      types,
    }),
  );
}
