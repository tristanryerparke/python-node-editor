import { useContext } from 'react';
import { Flex, Group, ActionIcon, Button, Switch } from '@mantine/core';
import { IconLayoutSidebarFilled } from '@tabler/icons-react';
import { PanelsContext, AutoExecuteContext } from '../GlobalContext';
import { useExecutionManager } from '../hooks/useExecutionManager';

function Header() {
  const { setPanels } = useContext(PanelsContext);
  const { autoExecute, setAutoExecute } = useContext(AutoExecuteContext);
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
            disabled={autoExecute}
          >
            Execute
          </Button>
          <Switch
            size='md'
            color='green.4'
            onLabel="Auto"
            offLabel="Auto"
            checked={autoExecute}
            onChange={(event) => setAutoExecute(event.currentTarget.checked)}
          />
        </Flex>
        <ActionIcon color='dark.2' variant='subtle' onClick={toggleInspector}>
          <IconLayoutSidebarFilled rotate={180} />
        </ActionIcon>
      </Group>
    </Flex>
  );
}

export default Header;