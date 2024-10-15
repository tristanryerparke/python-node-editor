import { useState, useEffect } from "react";
import { FileInput, Loader } from "@mantine/core";
import { IconUpload, IconX } from "@tabler/icons-react";
import { NodeField } from "../../types/DataTypes";

export interface ImageUploaderProps {
  field: NodeField | null;
  isEdgeConnected: boolean;

  onChange: (field: NodeField, data: string) => void;
  expanded: boolean;
}

function ImageInput({ field, isEdgeConnected, onChange, expanded }: ImageUploaderProps) {
  const [fileValue, setFileValue] = useState<File | null>(null);
  const [dummyFile, setDummyFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (field && isEdgeConnected) {
      setDummyFile(new File([], field.description || ''));
    } else if (field && field.data && field.description) {
      setFileValue(new File([], field.description));
    } else {
      setDummyFile(null);
      setFileValue(null);
    }
  }, [isEdgeConnected, field]);

  function handleUpload(file: File | null) {
    console.log('Handling upload:', file, field);

    if (file && field) {
      console.log('Uploading image');
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        const { cached, id, ...rest } = field;
        const updatedInputField = { ...rest, data: base64String };

        const formData = new FormData();
        const blob = new Blob([JSON.stringify(updatedInputField)], { type: 'application/json' });
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
            console.log('Uploaded large file:', result);
            onChange({ ...field, data: result.data }, result.data);
          } else {
            console.error('Failed to upload large file');
          }
        } catch (error) {
          console.error('Error uploading large file:', error);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
      setFileValue(file);
    } else {
      onChange(field, '');
      setFileValue(null);
    }
  }

  return (
    <FileInput
      name="mf"
      accept="image/png,image/jpeg,image/jpg"
      leftSection={isLoading ? <Loader color='dark.3' size={20}/> : <IconUpload size={20} style={{cursor: 'pointer'}}/>}
      w='100%'
      size='xs'
      rightSection={<IconX
        size={20} style={{cursor: 'pointer'}}
        onClick={() => { handleUpload(null) }}
        opacity={isEdgeConnected || !fileValue ? 0 : 1}
      />}
      disabled={isEdgeConnected}
      value={isEdgeConnected ? dummyFile : fileValue}
      placeholder={isEdgeConnected ? "Connected" : "Upload image"}
      style={{overflow: 'hidden'}}
      onChange={(file) => handleUpload(file)}
    />
  )
}

export default ImageInput;