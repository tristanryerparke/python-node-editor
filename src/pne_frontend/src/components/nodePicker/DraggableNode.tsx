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
      className="bg-background text-secondary-foreground border border-input p-2 rounded-md text-ellipsis overflow-hidden"
      onDragStart={onDragStart}
      draggable
    >
      {node.data.display_name}
    </div>
  );
} 