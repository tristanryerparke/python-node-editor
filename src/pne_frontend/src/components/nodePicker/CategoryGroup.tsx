import { BaseNode } from '../../types/nodeTypes';
import { DraggableNode } from './DraggableNode';

interface CategoryGroupProps {
  category: string;
  categoryData: {
    groups?: Record<string, BaseNode[]>;
  };
  showDivider: boolean;
}

export function CategoryGroup({ category, categoryData, showDivider }: CategoryGroupProps) {
  return (
    <div key={category} className="w-full flex flex-col">
      {showDivider && <div className="w-full h-[1px] mt-1 bg-black"/>}
      <div className="flex flex-row flex-shrink px-1">
        <strong>{category}</strong>
      </div>
      {categoryData.groups && Object.entries(categoryData.groups).map(([group, nodes]) => (
        <div key={`${category}-${group}`} className="flex flex-col flex-shrink">
          <div className="flex flex-col flex-shrink px-1"><i>{group}</i></div>
          <div className="flex flex-col gap-1 px-1">
            {nodes.map((node, index) => (
              <DraggableNode key={index} node={node} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 