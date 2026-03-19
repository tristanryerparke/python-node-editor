import { INPUT_TYPE_COMPONENT_REGISTRY } from "@/common/inputs/input-type-registry";
import { OUTPUT_TYPE_COMPONENT_REGISTRY } from "@/common/outputs/output-type-registry";
import useTypesStore from "@/stores/typesStore";
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
  const types = useTypesStore((state) => state.types);

  if (!fieldData) return false;

  const effectiveType = getEffectiveType(fieldData);

  const registryEntry =
    typeof effectiveType === "string"
      ? INPUT_TYPE_COMPONENT_REGISTRY[effectiveType]
      : undefined;

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
  // Call useTypesStore unconditionally to satisfy React hook rules
  useTypesStore((state) => state.types);

  if (!fieldData) return false;

  const effectiveType = getEffectiveType(fieldData);

  const registryEntry =
    typeof effectiveType === "string"
      ? OUTPUT_TYPE_COMPONENT_REGISTRY[effectiveType]
      : undefined;

  return Boolean(
    (registryEntry as { expandable?: true } | undefined)?.expandable,
  );
}
