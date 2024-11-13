import {
  Text,
  Flex,
  useMantineTheme
} from "@mantine/core";
import type { OutputDisplayProps} from "../OutputFieldDisplay";
import { formatClassString } from "../../../utils/classFormatter";

export function NumberOutput({ field, expanded }: OutputDisplayProps) {
  const theme = useMantineTheme();

  
  const roundToThreeDecimals = (num: number) => {
    return Math.round(num * 1000) / 1000;
  };
  
  const formattedValue = field.data === null 
    ? '' 
    : typeof field.data.payload === 'number' 
      ? roundToThreeDecimals(field.data.payload) 
      : field.data.payload;
  
  return <Flex
    w='100%' 
    bg='dark.6' 
    align='center'
    justify='center'
    px='0.5rem'
    h='29px'
    style={{
      border: `1px solid ${theme.colors.dark[4]}`, 
      borderRadius: '0.25rem',
      overflowX: 'auto'
    }}
  >
    <Text size='xs' w='100%' c="dimmed" style={{
      whiteSpace: 'nowrap',
      overflow: 'ellipsis',
      textOverflow: 'ellipsis',
      fontSize: '12px'
    }}>
      {formattedValue}
    </Text>
  </Flex>
}



export function TextOutput({ field, expanded }: OutputDisplayProps) {
  const theme = useMantineTheme();
  
  // the small text display styled to look like a mantine input
  if (!expanded) {
    return <Flex 
      w='100%' 
      bg='dark.6' 
      align='center'
      justify='center'
      px='0.5rem'
      h='29px'
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
        userSelect: 'text', // Allow text selection
        overflowX: 'hidden'
      }}>
      {field.data === null ? '' : (typeof field.data.payload === 'object' ? formatClassString(JSON.stringify(field.data.payload)) : field.data.payload)}
      </Text>
    </Flex>
  } 

  // the large text display styled to look like a mantine textarea
  return <Flex
    w='100%'
    mih='29px'
    h='auto'  // Set height to auto
    px='0.5rem'
    bg='dark.6' 
    align='center'
    className="nodrag"
    style={{
      border: `1px solid ${theme.colors.dark[4]}`, 
      borderRadius: '0.25rem',
      textOverflow: 'clip',
      userSelect: 'text', // Allow text selection
      cursor: 'text',
      overflowX: 'hidden'
    }}
  >
    <Text
      c='dimmed'
      ta='left'
      size='xs'
      style={{
        fontSize: '12px',
        wordBreak: 'break-word',  // Enable text breaking
        whiteSpace: 'pre-wrap',   // Preserve whitespaces and newlines
        userSelect: 'text',       // Allow text selection
      }}
      p='0.25rem'
    >
      {field.data === null ? '' : field.data.payload}
    </Text>
  </Flex>
}
