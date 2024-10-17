import { useState, useEffect } from "react";
import { FileInput, Flex, Loader, Image, Text } from "@mantine/core";
import { IconUpload, IconX } from "@tabler/icons-react";
import { InputFieldDisplayProps } from "../InputFieldDisplay";


function ImageInput({ field, onChange, expanded, disabled }: InputFieldDisplayProps) {

  const [fileValue, setFileValue] = useState<File | null>(null);
  const [dummyFile, setDummyFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (field && disabled) {
      setDummyFile(new File([], field.description ? field.description : ''));
    // } else if (field && field.data && field.description) {
    //   setFileValue(new File([], field.description ? field.description : ''));
    } else if (field && field.data && field.metadata.filename) {
      setFileValue(new File([], field.metadata.filename as string));
    } else {
      setDummyFile(null);
      setFileValue(null);
    }
  }, [disabled, field]);

  function handleUpload(file: File | null) {
    console.log('Handling upload:', file, field);

    if (file && field) {
      console.log('Uploading image');
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        const updatedInputField = { ...field, data: base64String };

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
            onChange(result);
            console.log('Uploaded large file:', result);
            setFileValue(new File([], result.metadata.filename));
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
    } else {
      onChange(field, '', {});
      setFileValue(null);
    }
  }

  const renderFilePicker = () => {
      return (
        <FileInput
          name="mf"
          accept="image/png,image/jpeg,image/jpg"
          leftSection={isLoading ? <Loader color='dark.3' size={20}/> : <IconUpload size={20} style={{cursor: 'pointer'}}/>}
          w='100%'
          size='xs'
          rightSection={<IconX
            size={20} style={{cursor: 'pointer'}}
            onClick={() => { 
              handleUpload(null);
              onChange({ ...field, data: null, metadata: {} });
            }}
            opacity={disabled || !fileValue ? 0 : 1}
          />}
          disabled={disabled}
          value={disabled ? dummyFile : fileValue}
          placeholder={disabled ? "Connected" : "Upload image"}
          style={{overflow: 'hidden'}}
          onChange={(file) => handleUpload(file)}
        />
    )
  }

  if (!expanded) {
    return renderFilePicker();
  } else {
    return (
      <Flex w='100%' h='100%' align='center' gap='0.25rem' justify='center' direction='column'>
        {field.data && (
          <Image p='1px' w='100%' src={`data:image/jpeg;base64,${field.data}`} style={{borderRadius: '0.25rem'}}/>
        )}
        {field.metadata && Object.keys(field.metadata).length > 0 && (
          <Text size='xs' c='dimmed'>{field.metadata.height} x {field.metadata.width} ({field.metadata.channels} channels)</Text>
        )}
        {renderFilePicker()}
      </Flex>
    )
  }
}

export default ImageInput;
