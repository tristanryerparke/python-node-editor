import { TypeDisplay } from "./type-display";
import type { TypeInfo } from "@/types/environment";

interface KindGroupProps {
  kind: string;
  types: [string, TypeInfo][];
}

function pluralizeKind(kind: string): string {
  const formatted = kind.replace(/_/g, " ");

  // Handle specific cases
  if (kind === "user_class") {
    return "user classes";
  }

  // Add 's' to the end for other cases
  return formatted + "s";
}

export function KindGroup({ kind, types }: KindGroupProps) {
  return (
    <div className="w-full flex flex-col pb-1">
      <div className="pb-1">
        <strong className="text-sm font-semibold text-foreground capitalize">
          {pluralizeKind(kind)}
        </strong>
      </div>
      <div className="flex flex-col gap-1">
        {types.map(([typeName, typeInfo]) => (
          <TypeDisplay key={typeName} typeName={typeName} typeInfo={typeInfo} />
        ))}
      </div>
    </div>
  );
}
