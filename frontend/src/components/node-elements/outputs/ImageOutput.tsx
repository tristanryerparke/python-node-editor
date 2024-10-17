import { Flex, Image, Text } from "@mantine/core";
import { OutputFieldDisplayProps } from "../OutputFieldDisplay";


function ImageOutput({ field, expanded }: OutputFieldDisplayProps) {
  if (!expanded) {
    {field.metadata && Object.keys(field.metadata).length > 0 && (
      <Text size='xs' c='dimmed'>{field.metadata.height as number} x {field.metadata.width as number} ({field.metadata.channels as number } channels)</Text>
    )}
  } else {
    return (
      <Flex w='100%' h='100%' align='center' gap='0.25rem' justify='center' direction='column'>
        {field.data && (
          <Image p='1px' w='100%' src={`data:image/jpeg;base64,${field.data}`} style={{borderRadius: '0.25rem'}}/>
        )}
        {field.metadata && Object.keys(field.metadata).length > 0 && (
          <Text size='xs' c='dimmed'>{field.metadata.height as number} x {field.metadata.width as number} ({field.metadata.channels as number } channels)</Text>
        )}
      </Flex>
    )
  }
}

export default ImageOutput;
