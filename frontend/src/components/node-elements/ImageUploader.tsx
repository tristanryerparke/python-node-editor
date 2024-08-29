import { useState, useEffect } from "react";
import { FileInput } from "@mantine/core";
import { ImageData, NodeInputImage } from '../../types/DataTypes';
import { IconUpload, IconX } from "@tabler/icons-react";

export interface ImageUploaderProps {
  input: NodeInputImage | null;
  isEdgeConnected: boolean;
  onChange: (label: string, value: any) => void;
}

function ImageInput({input, isEdgeConnected, onChange}: ImageUploaderProps) {
  const [fileValue, setFileValue] = useState<File | null>(null);
  const [dummyFile, setDummyFile] = useState<File | null>(null);

  useEffect(() => {
    // console.log('Edge connection state changed:', isEdgeConnected);
    if (input && isEdgeConnected) {
      // console.log('setting dummy file name:', input.input_data?.description);
      setDummyFile(new File([], input.input_data?.description || ''));
    } else {
      setDummyFile(null);
    }
  }, [isEdgeConnected, input]);

  function handleUpload(file: File | null) {
    if (file && input) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        const jsonRepresentation: ImageData = {
          image_array: base64String,
          thumbnail: null,
          description: null
        };

        const sizeInMB = JSON.stringify(jsonRepresentation).length / (1024 * 1024);
        const maxFileSizeMB = parseInt(import.meta.env.VITE_MAX_FILE_SIZE_MB);

        if (sizeInMB > maxFileSizeMB) {
          const formData = new FormData();
          const blob = new Blob([JSON.stringify(jsonRepresentation)], { type: 'application/json' });
          formData.append('file', blob, 'large_data.json');
          formData.append('original_filename', file.name);
          formData.append('file_extension', file.name.split('.').pop() || '');

          try {
            const response = await fetch('http://localhost:8000/large_files', {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              const result = await response.json();
              onChange(input.label, { fileId: result.fileId });
            } else {
              console.error('Failed to upload large file');
            }
          } catch (error) {
            console.error('Error uploading large file:', error);
          }
        } else {
          onChange(input.label, jsonRepresentation);
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