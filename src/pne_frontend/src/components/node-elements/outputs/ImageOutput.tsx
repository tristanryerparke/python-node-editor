import { Flex, Image, Text } from "@mantine/core";
import type { OutputDisplayProps } from "../OutputFieldDisplay";
import { OutputWrapper } from "../../../common/OutputWrapper";
import { ImageData } from "../../../types/BasicDataTypes";

function ImageOutput({ field, expanded }: OutputDisplayProps) {
  const imageData = field.data as ImageData;
  
  if (!expanded) {
    return (
      <OutputWrapper>
        <Text size='xs' c='dimmed'>Image: {imageData?.height} x {imageData?.width} ({imageData?.image_type})</Text>
      </OutputWrapper>
    );
  }

  
  return (
    <Flex w='100%' h='100%' align='center' gap='0.25rem' justify='center' direction='column'>
      {imageData && (  
        <>
          <Image p='1px' w='100%' src={`data:image/png;base64,${imageData?.preview}`} style={{borderRadius: '0.25rem'}}/>
          <Text size='xs' c='dimmed'>{imageData?.height} x {imageData?.width} ({imageData?.image_type})</Text>
        </>
      )}
    </Flex>
  );
}

export default ImageOutput;