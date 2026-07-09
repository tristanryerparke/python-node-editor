import { Separator } from "t-components/separator";
import { DraggableNode } from "./draggable-node";
import type { FrontendNodeData } from "@/types/types";

type FunctionSchemaWithGroup = FrontendNodeData & { group: string };

interface CategoryGroupProps {
  category: string;
  categoryData: {
    groups?: Record<string, FunctionSchemaWithGroup[]>;
  };
  showDivider: boolean;
}

export function CategoryGroup({
  category,
  categoryData,
  showDivider,
}: CategoryGroupProps) {
  return (
    <div key={category} className="w-full flex flex-col pb-2">
      {showDivider && <Separator className="mb-2" />}
      <div className="pb-1">
        <strong className="text-sm font-semibold text-foreground capitalize">
          {category.replace(/_/g, " ")}
        </strong>
      </div>
      {categoryData.groups &&
        Object.entries(categoryData.groups).map(([group, nodes]) => (
          <div
            key={`${category}-${group}`}
            className="flex flex-col pb-2 gap-1"
          >
            <div className="flex flex-col shrink">
              <i className="text-xs text-muted-foreground">{group}</i>
            </div>
            <div className="flex flex-col gap-1">
              {nodes.map((node, index) => (
                <DraggableNode key={`${node.name}-${index}`} nodeData={node} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
