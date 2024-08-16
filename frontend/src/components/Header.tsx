import { useContext } from 'react';
import { Flex, Group, ActionIcon, Button } from '@mantine/core';
import { IconLayoutSidebarFilled } from '@tabler/icons-react';
import { PanelsContext } from '../GlobalContext';
import { useExecutionManager } from '../hooks/useExecutionManager';

function Header() {
  const { panels, setPanels } = useContext(PanelsContext);
  const { execute } = useExecutionManager();

  const toggleInspector = () => {
    setPanels(prevPanels => ({
      ...prevPanels,
      showInspector: !prevPanels.showInspector
    }));
  };

  const toggleNodePicker = () => {
    setPanels(prevPanels => ({
      ...prevPanels,
      showNodePicker: !prevPanels.showNodePicker
    }));
  };

  return (
    <Flex 
      h='2.5rem' 
      justify='center' 
      align='center' 
      style={{borderBottom: '1px solid var(--mantine-color-dark-2)',}}
      className='pywebview-drag-region'
    >
      <Group justify='space-between' align='center' w='100%' px='0.35rem' className='pywebview-drag-region'>
        <ActionIcon color='dark.2'variant='subtle' onClick={toggleNodePicker}>
          <IconLayoutSidebarFilled />
        </ActionIcon>
        <Flex justify='center' align='center' gap='0.5rem'>
          <Button 
            size='xs' 
            variant='outline' 
            color='green.4' 
            onClick={execute}
          >
            Execute
          </Button>
        </Flex>
        <ActionIcon color='dark.2' variant='subtle' onClick={toggleInspector}>
          <IconLayoutSidebarFilled rotate={180} />
        </ActionIcon>
      </Group>
    </Flex>
  );
}

export default Header;