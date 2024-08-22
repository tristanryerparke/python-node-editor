import { useState } from "react";
import { Button, TextInput, FileInput } from "@mantine/core";
import { ImageData, NodeInputImage } from "../../types";
import { IconUpload } from "@tabler/icons-react";

export interface ImageUploaderProps {
  input: NodeInputImage;
  disabled: boolean;
  onChange: (label: string, value: any) => void;
}


function ImageInput({input, disabled, onChange}: ImageUploaderProps) {
  
  const [fileValue, setFileValue] = useState<File | null>(null);

  
  function handleUpload(file: File | null) {
    if (file) {
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
      onChange(input.label, null);
      setFileValue(null);
    }
  }


  return (
    <FileInput
    name="mf"
    accept="image/png,image/jpeg,image/jpg"
    leftSection={<IconUpload size={20} style={{cursor: 'pointer'}}/>}
    w='100%'
    clearable 
    disabled={disabled}
    value={fileValue}
    clearButtonProps={{disabled: disabled, onClick: () => setFileValue(null)}}
    onChange={(file) => file && handleUpload(file)}
    />
  ) 
}

export default ImageInput;