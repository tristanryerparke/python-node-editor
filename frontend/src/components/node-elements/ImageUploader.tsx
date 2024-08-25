import { useState, useEffect } from "react";
import { FileInput } from "@mantine/core";
import { ImageData, NodeInputImage } from "../../types";
import { IconUpload } from "@tabler/icons-react";

export interface ImageUploaderProps {
  input: NodeInputImage | null;
  isEdgeConnected: boolean;
  onChange: (label: string, value: any) => void;
}

function ImageInput({input, isEdgeConnected, onChange}: ImageUploaderProps) {
  const [fileValue, setFileValue] = useState<File | null>(null);
  const [dummyFile, setDummyFile] = useState<File | null>(null);

  useEffect(() => {
    console.log('Edge connection state changed:', isEdgeConnected);
    if (input && isEdgeConnected) {
      console.log('setting dummy file name:', input.input_data?.description);
      setDummyFile(new File([], input.input_data?.description || ''));
    } else {
      setDummyFile(null);
    }
  }, [isEdgeConnected, input]);

  function handleUpload(file: File | null) {
    if (file && input) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        const jsonRepresentation: ImageData = {
          image_array: base64String
        };
        onChange(input.label, jsonRepresentation);
      };
      reader.readAsDataURL(file);
      setFileValue(file);
    } else {
      onChange(input?.label || '', null);
      setFileValue(null);
    }
  }

  return (
    <FileInput
      name="mf"
      accept="image/png,image/jpeg,image/jpg"
      leftSection={<IconUpload size={20} style={{cursor: 'pointer'}}/>}
      w='100%'
      p={0}
      m={0}
      clearable 
      disabled={isEdgeConnected}
      value={isEdgeConnected ? dummyFile : fileValue}
      placeholder={isEdgeConnected ? "Connected" : "Upload image"}
      clearButtonProps={{
        disabled: isEdgeConnected, 
        style: {
          opacity: isEdgeConnected ? 0 : 1
        }
      }}
      style={{overflow: 'hidden'}}
      onChange={(file) => file && handleUpload(file)}
    />
  ) 
}

export default ImageInput;