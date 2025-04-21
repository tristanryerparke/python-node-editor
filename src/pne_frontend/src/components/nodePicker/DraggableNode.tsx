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
      className="w-full rounded-md border border-black p-1 z-[1000] bg-white"
      onDragStart={onDragStart}
      draggable
    >
      {node.data.display_name}
    </div>
  );
} 