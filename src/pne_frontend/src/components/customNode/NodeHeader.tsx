import { BaseNodeData } from "../../types/nodeTypes";
import { ActionIcon, Text } from "@mantine/core";
import { IconCode, IconArrowsHorizontal } from "@tabler/icons-react";
import { NodeResizeControl } from "@xyflow/react";

type NodeHeaderProps = {
  data: BaseNodeData;
  nodeId?: string;
}

export default function NodeHeader({ data, nodeId }: NodeHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: '0.25rem',
      paddingRight: '0.25rem',
      height: '22px'
    }}>
      <Text fw={700} size='md' style={{flexGrow: 1}}>{data.display_name}</Text>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        width: 'fit-content',
        gap: '2px',
        justifyContent: 'flex-end',
        alignItems: 'center'
      }}>
        <ActionIcon variant="subtle" size="xs" color="black" style={{border: 'none'}}>
          <IconCode size={14} />
        </ActionIcon>
          <NodeResizeControl 
            style={{all: 'unset', 
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
              width: 'fit-content',
              height: 'fit-content'
            }}
            nodeId={nodeId} 
            minWidth={data.min_width}
            maxWidth={data.max_width}
          >
            <ActionIcon variant="subtle" size="xs" color="black" style={{border: 'none', cursor: 'ew-resize'}}>
              <IconArrowsHorizontal size={14} />
            </ActionIcon>
          </NodeResizeControl>
      </div>
    </div>
  );
}