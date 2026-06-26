import { getInputRenderer } from "@/common/inputs/input-type-registry";
import { getOutputRenderer } from "@/common/outputs/output-type-registry";
import useFlowStore from "@/stores/flowStore";
import type { FrontendFieldDataWrapper } from "@/types/types";

function getEffectiveType(fieldData: FrontendFieldDataWrapper) {
  if (
    typeof fieldData.type === "object" &&
    "anyOf" in fieldData.type &&
    fieldData.type.anyOf
  ) {
    return fieldData._selectedType || fieldData.type.anyOf[0];
  }
  return fieldData.type;
}

export function useInputFieldExpandable(
  fieldData: FrontendFieldDataWrapper | null | undefined,
): boolean {
  const types = useFlowStore((state) => state.types);

  if (!fieldData) return false;

  const effectiveType = getEffectiveType(fieldData);

  const registryEntry =
    typeof effectiveType === "string" ? getInputRenderer(effectiveType) : undefined;

  const hasRegistryExpandable = Boolean(
    (registryEntry as { expandable?: true } | undefined)?.expandable,
  );

  const isUserModelType =
    typeof effectiveType === "string" &&
    Boolean(types[effectiveType] && types[effectiveType].kind === "user_model");

  const hasGenericExpandable =
    (typeof effectiveType === "object" &&
      "structureType" in effectiveType &&
      (effectiveType.structureType === "list" ||
        effectiveType.structureType === "dict")) ||
    (typeof effectiveType === "string" &&
      !registryEntry &&
      !isUserModelType);

  return hasRegistryExpandable || hasGenericExpandable;
}

export function useOutputFieldExpandable(
  fieldData: FrontendFieldDataWrapper | null | undefined,
): boolean {
  if (!fieldData) return false;

  const effectiveType = getEffectiveType(fieldData);

  const registryEntry =
    typeof effectiveType === "string" ? getOutputRenderer(effectiveType) : undefined;

  return Boolean(
    (registryEntry as { expandable?: true } | undefined)?.expandable,
  );
}
