import { useContext, useState, useRef, useEffect } from 'react';
import { Flex, 
  Group, 
  ActionIcon, 
  Button, 
  FileButton, 
  Menu, 
  Text, 
  Title, 
  TextInput
} from '@mantine/core';
import { IconLayoutSidebarFilled, IconChevronDown } from '@tabler/icons-react';
import { PanelsContext } from '../GlobalContext';
import { useExecutionManager } from '../hooks/useExecutionManager';
import { useSaveFlow, useLoadFlow } from '../hooks/useSaveLoadFlow';
import { useNodes } from '@xyflow/react';
import { FlowMetadataContext } from '../GlobalContext';

function EditableTitle( { filename, setFilename }: { filename: string, setFilename: (filename: string) => void } ) { 
  // An editable title display for the flow
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [tempFilename, setTempFilename] = useState(filename);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = (tempFilename: string) => {
    if (tempFilename === '') {
      setFilename('Untitled');
    } else {
      setFilename(tempFilename);
    }
    setIsEditing(false);
  };

  return (
    <Flex miw='6rem' justify='center' align='center'>
      {isEditing ? (
        <TextInput
          ref={inputRef}
          w='100%'
          size="xs"
          value={tempFilename}
          onChange={(e) => setTempFilename(e.target.value)}
          onBlur={() => handleSave(tempFilename)}
          placeholder="Untitled"
        />
      ) : (
        <Title order={5} onClick={() => setIsEditing(true)}>
          {filename}
        </Title>
      )}
    </Flex>
  );
}


function Header() {
  const { setPanels } = useContext(PanelsContext);
  const { execute, cancel, isExecuting, isCancelling } = useExecutionManager();
  const { saveFlow, isSaving } = useSaveFlow();
  const { loadFlow, isLoading } = useLoadFlow();
  const { filename, setFilename } = useContext(FlowMetadataContext);
  const nodes = useNodes();

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
      <Group 
        justify='space-between' 
        align='center' 
        w='100%' 
        px='0.35rem' 
        className='pywebview-drag-region'
        style={{ zIndex: 1000 }}
      >
        <ActionIcon color='dark.2'variant='subtle' onClick={toggleNodePicker}>
          <IconLayoutSidebarFilled />
        </ActionIcon>

        <Flex justify='center' align='center' gap='0.5rem' >
          <Group wrap="nowrap" gap={0}>
          <Button
            w='5rem'
              size='xs' 
              variant='outline' 
              color={isExecuting ? 'red.4' : 'green.4'}
              onClick={isExecuting ? cancel : () => execute(false)}
              disabled={isCancelling || nodes.length === 0}
              loading={isCancelling}
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            >
              {isExecuting ? 'Cancel' : 'Execute'}
            </Button>
            <Menu transitionProps={{ transition: 'pop' }} position="bottom-end" withinPortal offset={6}>
              <Menu.Target>
                <ActionIcon
                  variant="outline"
                  color={isExecuting ? 'red.4' : 'green.4'}
                  loading={isExecuting && !isCancelling}
                  disabled={nodes.length === 0}
                  size={30}
                  style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 'none' }}
                >
                  <IconChevronDown size={16} stroke={1.5} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown style={{zIndex: 1000}}>
                <Menu.Item onClick={() => execute(true)} p='0.3rem' color='green.4' variant='outline'>
                  <Text size='xs'>Execute Quietly</Text>
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
          <EditableTitle filename={filename} setFilename={setFilename} />
          <Flex w='10rem' gap={0}>
            <Button
              size='xs'
              variant='outline'
              color='blue.4'
              onClick={saveFlow}
              loading={isSaving}
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none' }}
            >
              Export
            </Button>
            <FileButton
              onChange={(file: File | null) => file && loadFlow(file)}
              accept="application/json"
            >
              {(props) => <Button 
                size='xs' 
                variant='outline' 
                color='blue.4' 
                loading={isLoading} 
                {...props}
                style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
              >
                Import
              </Button>}
            </FileButton>
          </Flex>
        </Flex>
        <ActionIcon color='dark.2' variant='subtle' onClick={toggleInspector}>
          <IconLayoutSidebarFilled rotate={180} />
        </ActionIcon>
      </Group>
    </Flex>
  );
}

export default Header;