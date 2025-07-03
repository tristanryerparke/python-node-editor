import { BaseNode } from '../../types/nodeTypes';
import { Separator } from '../ui/separator';
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
    <div key={category} className="w-full flex flex-col pb-1">
      {showDivider && <Separator/>}
      <strong>{category}</strong>
      {categoryData.groups && Object.entries(categoryData.groups).map(([group, nodes]) => (
        <div key={`${category}-${group}`} className="flex flex-col pb-1 gap-1">
          <div className="flex flex-col flex-shrink"><i>{group}</i></div>
          <div className="flex flex-col gap-2">
            {nodes.map((node, index) => (
              <DraggableNode key={index} node={node} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 