import { Flex, Image, Text, useMantineTheme } from "@mantine/core";
import { OutputDisplayProps} from "../OutputFieldDisplay";
import { formatImageMetadata } from "../nodeUtils";

function ImageOutput({ field, expanded }: OutputDisplayProps) {
  const theme = useMantineTheme();
  if (!expanded) {
    return (
      <Flex
          w='100%' 
          bg='dark.6' 
          align='center'
          justify='center'
          px='0.5rem'
          h='29px'
          style={{
            border: `1px solid ${theme.colors.dark[4]}`, 
            borderRadius: '0.25rem',
          }}
        >
          {field.data?.metadata && (
            <Text size='xs' w='100%' c="dimmed" style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '12px'
          }}>
              {formatImageMetadata(field.data?.metadata as Record<string, unknown>)}
            </Text>
          )}
      </Flex>
    );
  }

  const imageData = !field.data?.cached ? field.data?.payload : field.data?.metadata.preview;
  return (
    <Flex w='100%' h='100%' align='center' gap='0.25rem' justify='center' direction='column'>
      {field.data && (  
        <>
          <Image p='1px' w='100%' src={`data:image/png;base64,${imageData}`} style={{borderRadius: '0.25rem'}}/>
          <Text size='xs' c='dimmed'>{formatImageMetadata(field.data?.metadata as Record<string, unknown>)}</Text>
        </>
      )}
    </Flex>
  );
}

export default ImageOutput;
