import { Flex, Text, useMantineTheme } from "@mantine/core";
import type { ReactNode } from "react";

interface OutputWrapperProps {
  children: ReactNode;
  small?: boolean;
}

export function OutputWrapper({ children, small = true }: OutputWrapperProps) {
  const theme = useMantineTheme();
  
  return (
    <Flex 
      w='100%' 
      bg='dark.6' 
      align={small ? 'flex-start' : 'center'}
      justify='center'
      px='0.5rem'
      mah={'1000px'}
      h={small ? 'auto' : '100%'}
      mih={small ? '29px' : 'auto'}
      className="nodrag nopan nowheel"
      style={{
        border: `1px solid ${theme.colors.dark[4]}`, 
        borderRadius: '0.25rem',
        overflowY: 'auto',
        userSelect: 'all',
      }}
    >
      <Text size='xs' w='100%' c="dimmed" style={{
        whiteSpace: small ? 'pre-wrap' : 'nowrap',
        overflow: 'ellipsis',
        textOverflow: 'ellipsis',
        fontSize: '12px',
        padding: '4px 0',
        className: 'nodrag',
        cursor: 'text',
        userSelect: 'all',
      }}>
        {children}
      </Text>
    </Flex>
  );
}