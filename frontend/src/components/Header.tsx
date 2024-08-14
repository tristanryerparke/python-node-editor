import { useContext } from 'react';
import { Flex, Text, Group, ActionIcon } from '@mantine/core';
import { IconLayoutSidebarFilled } from '@tabler/icons-react';
import { PanelsContext } from '../GlobalContext';

function Header() {
  const { panels, setPanels } = useContext(PanelsContext);

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
    >
      <Group justify='space-between' align='center' w='100%' px='0.35rem'>
        <ActionIcon color='dark.2'variant='subtle' onClick={toggleNodePicker}>
          <IconLayoutSidebarFilled />
        </ActionIcon>
        <Text align='center'>Header</Text>
        <ActionIcon color='dark.2' variant='subtle' onClick={toggleInspector}>
          <IconLayoutSidebarFilled rotate={180} />
        </ActionIcon>
      </Group>
    </Flex>
  );
}

export default Header;