import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import type { TypeInfo } from "@/types/environment";
import { formatTypeForDisplay } from "@/utils/type-formatting";

interface TypeDisplayProps {
  typeName: string;
  typeInfo: TypeInfo;
}

export function TypeDisplay({ typeName, typeInfo }: TypeDisplayProps) {
  return (
    <Item variant="outline" className="p-2 h-fit-content flex">
      <ItemContent className="gap-0 min-w-0">
        <ItemTitle className="pb-0">{typeName}</ItemTitle>
        <ItemDescription className="shrink line-clamp-none break-words">
          {typeInfo.kind === "user_model" && typeInfo.properties && (
            <span className="block mt-1">
              <span className="block text-xs">
                {Object.entries(typeInfo.properties).map(
                  ([propName, propType]) => (
                    <span key={propName} className="block break-words">
                      {propName}: {formatTypeForDisplay(propType)}
                    </span>
                  ),
                )}
              </span>
            </span>
          )}
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}
