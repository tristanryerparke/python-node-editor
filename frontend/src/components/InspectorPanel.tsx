
import { Panel, PanelResizeHandle } from 'react-resizable-panels';

import { Flex, Text } from '@mantine/core'  




function InspectorPanel() {
  return (
    <>
    <PanelResizeHandle style={{ backgroundColor: 'var(--mantine-color-dark-2)', width: '0.075rem' }} />
    <Panel 
      id="inspector" 
      order={2} 
      defaultSize={25}
      maxSize={75}
      minSize={20}
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <Flex justify='center' align='center'>
        <Text>Inspector</Text>
      </Flex>
    </Panel>
    </>
  );
}
  
  export default InspectorPanel;