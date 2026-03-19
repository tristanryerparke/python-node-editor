import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  ItemActions,
} from "@/components/ui/item";
import useFlowStore from "@/stores/flowStore";
import type { TypeInfo } from "@/types/environment";
import { hasDisplayComponent } from "./has-display-component";
import { formatTypeForDisplay } from "@/utils/type-formatting";

interface TypeDisplayProps {
  typeName: string;
  typeInfo: TypeInfo;
}

export function TypeDisplay({ typeName, typeInfo }: TypeDisplayProps) {
  const types = useFlowStore((state) => state.types);
  const hasComponent = hasDisplayComponent(typeName, types);

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
      <ItemActions className="shrink-0">
        <div
          className={`w-2 h-2 rounded-full ${
            hasComponent ? "bg-green-500" : "bg-red-500"
          }`}
        />
      </ItemActions>
    </Item>
  );
}
