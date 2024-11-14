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
      align='center'
      justify='center'
      px='0.5rem'
      h={small ? '29px' : undefined}
      className="nodrag"
      style={{
        border: `1px solid ${theme.colors.dark[4]}`, 
        borderRadius: '0.25rem',
      }}
    >
      <Text size='xs' w='100%' c="dimmed" style={{
        whiteSpace: 'nowrap',
        overflow: 'ellipsis',
        textOverflow: 'ellipsis',
        fontSize: '12px',
      }}>
        {children}
      </Text>
    </Flex>
  );
}