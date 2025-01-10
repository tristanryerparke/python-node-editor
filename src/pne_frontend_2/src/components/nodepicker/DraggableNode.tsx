import { BaseNode } from '../../types/nodeTypes';

interface DraggableNodeProps {
  node: BaseNode;
}

export function DraggableNode({ node }: DraggableNodeProps) {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(node));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className='pne-div'
      onDragStart={onDragStart}
      draggable
      style={{ 
        borderRadius: '0.25rem',
        border: '1px solid black',
        alignItems: 'flex-start',
        padding: '0.25rem',
        zIndex: 1000,
        opacity: 1
      }}
    >
      {node.data.display_name}
    </div>
  );
} 