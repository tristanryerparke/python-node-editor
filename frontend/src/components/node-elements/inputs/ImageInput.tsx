import { useState, useEffect, useContext } from "react";
import { FileInput, Flex, Loader, Image, Text } from "@mantine/core";
import { IconUpload, IconX } from "@tabler/icons-react";
import { InputDisplayProps } from "../InputFieldDisplay";
import { InputNodeField } from "../../../types/DataTypes";

import { FieldIndexContext } from "../CustomNode";
import { setFieldData } from "../nodeUtils";

function ImageInput({ field, setField, expanded }: InputDisplayProps) {

  const fieldIndex = useContext(FieldIndexContext);

  const [fileValue, setFileValue] = useState<File | null>(null);
  const [dummyFile, setDummyFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (field && field.disabled) {
      setDummyFile(new File([], field.description ? field.description : ''));
    // } else if (field && field.data && field.description) {
    //   setFileValue(new File([], field.description ? field.description : ''));
    } else if (field && field.data && field.data.metadata.filename) {
      setFileValue(new File([], field.data.metadata.filename as string));
    } else {
      setDummyFile(null);
      setFileValue(null);
    }
  }, [field]);

  function handleUpload(file: File | null) {
    if (file && field) {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        
        // Create a FieldData-compatible object
        const fieldDataObject = {
          payload: base64String,
          dtype: 'image',
          metadata: {
            filename: file.name,
            original_filename: file.name
          }
        };

        const formData = new FormData();
        formData.append('file', new Blob([JSON.stringify(fieldDataObject)], { type: 'application/json' }));
        formData.append('original_filename', file.name);
        formData.append('file_extension', file.name.split('.').pop() || '');

        try {
          const response = await fetch('http://localhost:8000/large_file_upload', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const resultFieldData = await response.json();
            console.log('resultFieldData', resultFieldData);
            // We don't use setFieldValue here becuase the backend already gives a fresh id that we need to maintain
            setField(fieldIndex, {...field, data: resultFieldData} as InputNodeField);
            setFileValue(new File([], resultFieldData.metadata.filename));
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
      setFieldData(fieldIndex, setField, field, null);
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
              setFieldData(fieldIndex, setField, field, null, );
            }}
            opacity={!fileValue ? 0 : 1}
          />}
          disabled={field.disabled || field.is_edge_connected}
          value={field.disabled ? dummyFile : fileValue}
          placeholder={field.disabled ? "Connected" : "Upload image"}
          style={{overflow: 'hidden'}}
          onChange={(file) => handleUpload(file)}
        />
    )
  }

  if (!expanded) {
    return renderFilePicker();
  } else {


    const imageData = !field.data?.cached ? field.data?.payload : field.data?.metadata.preview;
    return (
      <Flex w='100%' h='100%' align='center' gap='0.25rem' justify='center' direction='column'>
        {field.data && (  
          <>
            <Image p='1px' w='100%' src={`data:image/png;base64,${imageData}`} style={{borderRadius: '0.25rem'}}/>
            <Text size='xs' c='dimmed'>{field.data?.metadata.height as number} x {field.data?.metadata.width as number} ({field.data?.metadata.type as string})</Text>
          </>
        )}
        {renderFilePicker()}
      </Flex>
    )
  }
}

export default ImageInput;
