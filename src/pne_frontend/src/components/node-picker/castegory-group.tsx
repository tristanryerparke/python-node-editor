import { BaseNode } from '../../types/nodeTypes';
<<<<<<< Updated upstream:src/pne_frontend/src/components/nodePicker/CategoryGroup.tsx
import { DraggableNode } from './DraggableNode';
=======
import { Separator } from '../ui/separator';
import { DraggableNode } from './draggable-node';
>>>>>>> Stashed changes:src/pne_frontend/src/components/node-picker/castegory-group.tsx

interface CategoryGroupProps {
  category: string;
  categoryData: {
    groups?: Record<string, BaseNode[]>;
  };
  showDivider: boolean;
}

const sidePadStyle = {
  padding: '0 0.25rem 0 0.25rem'
}

export function CategoryGroup({ category, categoryData, showDivider }: CategoryGroupProps) {
  return (
    <div key={category} className='pne-div' style={{height: 'auto'}}>
      {showDivider && <div style={{marginTop: '0.25rem', borderTop: '1px solid black'}}/>}
      <div 
        className='pne-div shrink'
        style={{fontSize: '1rem', ...(sidePadStyle || {})}}
      >
        <strong>{category}</strong>
      </div>
      {categoryData.groups && Object.entries(categoryData.groups).map(([group, nodes]) => (
        <div key={`${category}-${group}`} className={`pne-div shrink`}>
          <div className='pne-div shrink' style={sidePadStyle}><i>{group}</i></div>
          <div className='pne-div' style={{gap: '0.25rem', ...(sidePadStyle || {})}}>
            {nodes.map((node, index) => (
              <DraggableNode key={index} node={node} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 