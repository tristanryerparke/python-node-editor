import type { Edge } from "@xyflow/react";
import type {
  FrontendFieldDataWrapper,
  FunctionNode,
} from "@/types/types";
import type { StructDescr, TypeSchema, UnionDescr } from "@/types/backend-schema";
import { validateValueAgainstSchema } from "./schema-input-validator";

const SUPPORTED_SCALAR_TYPES = new Set(["int", "float", "str", "bool"]);

export interface InvalidInputIssue {
  nodeId: string;
  inputName: string;
  reason: string;
}

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

function isSupportedUnion(schema: UnionDescr): boolean {
  return schema.anyOf.every((typeName) => SUPPORTED_SCALAR_TYPES.has(typeName));
}

function isSupportedStruct(schema: StructDescr): boolean {
  if (typeof schema.itemsType === "string") {
    return SUPPORTED_SCALAR_TYPES.has(schema.itemsType);
  }

  return isSupportedUnion(schema.itemsType);
}

function isSchemaSupported(schema: TypeSchema): boolean {
  if (typeof schema === "string") {
    return SUPPORTED_SCALAR_TYPES.has(schema);
  }

  if ("anyOf" in schema) {
    return isSupportedUnion(schema);
  }

  return isSupportedStruct(schema);
}

function getConnectedTargetHandles(edges: Edge[]): Set<string> {
  const connectedHandles = new Set<string>();

  for (const edge of edges) {
    if (edge.targetHandle) {
      connectedHandles.add(edge.targetHandle);
    }
  }

  return connectedHandles;
}

export function getInvalidNodeInputIssues(
  nodes: FunctionNode[],
  edges: Edge[],
): InvalidInputIssue[] {
  const connectedTargetHandles = getConnectedTargetHandles(edges);
  const invalidIssues: InvalidInputIssue[] = [];

  for (const node of nodes) {
    const argumentsData = node.data.arguments || {};
    for (const [argName, argData] of Object.entries(argumentsData)) {
      const handleId = `${node.id}:arguments:${argName}:handle`;
      if (connectedTargetHandles.has(handleId)) {
        continue;
      }

      if (argData.value === null || argData.value === undefined) {
        continue;
      }

      const schema = getEffectiveSchema(argData);
      if (!isSchemaSupported(schema)) {
        continue;
      }

      const validationResult = validateValueAgainstSchema(argData.value, schema);
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
