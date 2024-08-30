import { useState, useEffect } from "react";
import { FileInput } from "@mantine/core";
import { Data, NodeInputImage } from '../../types/DataTypes';
import { IconUpload, IconX } from "@tabler/icons-react";

export interface ImageUploaderProps {
  input: NodeInputImage | null;
  isEdgeConnected: boolean;
  onChange: (label: string, value: Data) => void;
}

function ImageInput({input, isEdgeConnected, onChange}: ImageUploaderProps) {
  const [fileValue, setFileValue] = useState<File | null>(null);
  const [dummyFile, setDummyFile] = useState<File | null>(null);

  useEffect(() => {
    if (input && isEdgeConnected) {
      setDummyFile(new File([], input.input_data?.description || ''));
    } else {
      setDummyFile(null);
    }
  }, [isEdgeConnected, input]);

  function handleUpload(file: File | null) {
    if (file && input) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        // console.log('file content', (e.target?.result as string).slice(0, 100));
        const base64String = e.target?.result as string;
        const jsonRepresentation: Data = {
          dtype: 'image',
          data: base64String,
        };

          const formData = new FormData();
          const blob = new Blob([JSON.stringify(jsonRepresentation)], { type: 'application/json' });
          formData.append('file', blob, 'large_data.json');
          formData.append('original_filename', file.name);
          formData.append('file_extension', file.name.split('.').pop() || '');

          try {
            const response = await fetch('http://localhost:8000/large_file_upload', {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              const result = await response.json();
              // console.log('result', result);
              onChange(input.label, result);
            } else {
              console.error('Failed to upload large file');
            }
          } catch (error) {
            console.error('Error uploading large file:', error);
          }
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
      rightSection={<IconX
        size={20} style={{cursor: 'pointer'}}
        onClick={() => {handleUpload(null)}}
        opacity={isEdgeConnected || !fileValue ? 0 : 1}
      />}
      disabled={isEdgeConnected}
      value={isEdgeConnected ? dummyFile : fileValue}
      placeholder={isEdgeConnected ? "Connected" : "Upload image"}
      style={{overflow: 'hidden'}}
      onChange={(file) => file && handleUpload(file)}
    />
  ) 
}

export default ImageInput;