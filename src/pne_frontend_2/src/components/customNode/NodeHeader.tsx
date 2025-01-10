import { BaseNodeData } from "../../types/nodeTypes";
import { ActionIcon } from "@mantine/core";
import { IconCode } from "@tabler/icons-react";



export default function NodeHeader( {data}: {data: BaseNodeData} ) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: '0.25rem',
      paddingRight: '0.25rem'
    }}>
      <strong>{data.display_name}</strong>
      <ActionIcon variant="subtle" size="xs" color="black"  style={{border: 'none'}}>
        <IconCode />
      </ActionIcon>
    </div>
  );
}