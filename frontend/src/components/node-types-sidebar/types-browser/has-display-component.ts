import { hasInputRenderer } from "@/common/inputs/input-type-registry";
import { hasOutputRenderer } from "@/common/outputs/output-type-registry";
import type { PropertyType, TypeInfo } from "@/types/environment";

function getPropertyTypeName(propType: PropertyType): string | null {
  if (typeof propType === "string") {
    return propType;
  }
  if ("anyOf" in propType) {
    return null;
  }
  if (
    "structureType" in propType &&
    propType.structureType === "list" &&
    "itemsType" in propType
  ) {
    return getPropertyTypeName(propType.itemsType);
  }
  return null;
}

export function hasDisplayComponent(
  typeName: string,
  types: Record<string, TypeInfo>,
  visited: Set<string> = new Set(),
): boolean {
  if (visited.has(typeName)) {
    return false;
  }

  // Check if the type has a display component in either input or output registries
  if (hasInputRenderer(typeName) || hasOutputRenderer(typeName)) {
    return true;
  }

  const typeInfo = types[typeName];
  if (typeInfo && typeInfo.kind === "user_model" && typeInfo.properties) {
    visited.add(typeName);

    const propertyTypes = Object.values(typeInfo.properties);
    return propertyTypes.every((propType) => {
      const propTypeName = getPropertyTypeName(propType);
      return propTypeName
        ? hasDisplayComponent(propTypeName, types, visited)
        : false;
    });
  }

  return false;
}
