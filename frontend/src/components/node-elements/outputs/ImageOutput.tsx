import { Flex, Image, Text } from "@mantine/core";
import type { OutputDisplayProps } from "../OutputFieldDisplay";
import { formatImageMetadata } from "../nodeUtils";
import { OutputWrapper } from "../../../common/OutputWrapper";

function ImageOutput({ field, expanded }: OutputDisplayProps) {
  if (!expanded) {
    return (
      <OutputWrapper>
        {field.data?.metadata && formatImageMetadata(field.data?.metadata as Record<string, unknown>)}
      </OutputWrapper>
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