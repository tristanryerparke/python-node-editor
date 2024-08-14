import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

interface CustomNodeProps {
  data: {
    label: string;
    width: number;
    height: number;
    color: string;
    handles: number;
  };
}

const CustomNode: React.FC<CustomNodeProps> = memo(({ data }) => {
  const { label, width, height, color, handles } = data;
  const handlePositions = Array.from({ length: handles }, (_, i) => i / (handles - 1));

  return (
    <div style={{ width, height, backgroundColor: color, padding: '10px' }}>
      {handlePositions.map((pos, index) => (
        <Handle
          key={index}
          type="source"
          position={Position.Right}
          id={`handle-${index}`}
          style={{ top: `${pos * 100}%` }}
        />
      ))}
      <div>{label}</div>
    </div>
  );
});

export default CustomNode;