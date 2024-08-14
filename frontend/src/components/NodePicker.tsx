import { Flex, Text, Button } from '@mantine/core';

function NodePicker() {
    const generateNodeConfig = () => ({
        label: `Custom Node ${Math.floor(Math.random() * 1000)}`,
        width: Math.floor(Math.random() * 100) + 100,
        height: Math.floor(Math.random() * 50) + 50,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        handles: Math.floor(Math.random() * 3) + 2,
    });

    const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        const nodeConfig = generateNodeConfig();
        event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeConfig));
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <>
        <Flex align='center' justify='center' w='12rem' direction='column'>
            <Text>NodePicker</Text>
            <Button
                onDragStart={onDragStart}
                draggable
            >
                Drag Custom Node
            </Button>
        </Flex>
        <div
            style={{ backgroundColor: 'var(--mantine-color-dark-2)', width: '0.075rem' }}
        />
        </>
    );
}

export default NodePicker;