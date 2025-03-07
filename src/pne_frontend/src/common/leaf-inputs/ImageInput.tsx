import { Image, Text, Loader } from "@mantine/core";
import { IconPhoto } from "@tabler/icons-react";
import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { ImageData } from "../../types/dataTypes/imageData";
import { ChevronButton } from "../ChevronButton";
import { updateNodeData } from "../../utils/updateNodeData";
interface ImageInputProps {
  path: (string | number)[];
  data?: ImageData;
  
}

export default function ImageInput({ data, path }: ImageInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create a default empty ImageData if none is provided
  const imageData = data || {
    class_name: "ImageData",
    id: uuidv4(),
    payload: "",
    preview: "",
    metadata: {}
  } as ImageData;

  // Get expanded state from metadata with default as false
  const metadata = imageData.metadata || {};
  const expanded = metadata.expanded ?? false;
  
  // Function to toggle expanded state
  const setExpanded = (expanded: boolean) => {
    updateNodeData({ path: [...path, 'metadata', 'expanded'], newData: expanded });
  };

  // Helper function to determine if we have an image to display
  const hasImage = () => {
    return Boolean(imageData.payload || imageData.preview);
  };

  // Helper function to get the image source
  const getImageSrc = () => {
    if (imageData.preview) {
      return `data:image/jpeg;base64,${imageData.preview}`;
    }
    if (imageData.payload) {
      return `data:image/jpeg;base64,${imageData.payload}`;
    }
    return '';
  };

  // Get display text for the title
  const getTitleText = () => {
    if (hasImage() && imageData.width && imageData.height) {
      return `Image: ${imageData.width}x${imageData.height} ${imageData.image_type || ''}`;
    }
    return "No image";
  };

  // Handle click on the dropzone
  const handleDropzoneClick = () => {
    if (!isLoading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      handleUpload(file);
    }
    // Reset the input value so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  // Handle file removal
  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the dropzone click
    handleUpload(null);
  };

  async function handleUpload(file: File | null) {
    if (!file) {
      const newData = {
        ...imageData,
        id: uuidv4(),
        payload: "",
        preview: "",
        metadata: {
          ...imageData.metadata,
          expanded: expanded
        },
      };
      updateNodeData({ path: path, newData: newData });
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const base64String = e.target?.result as string;
      const base64Data = base64String.split(',')[1];
      
      const updatedData = { 
        class_name: "ImageData",
        id: uuidv4(),
        payload: base64Data
      };

      const formData = new FormData();
      const blob = new Blob([JSON.stringify(updatedData)], { type: 'application/json' });
      formData.append('file', blob, 'large_data.json');
      formData.append('original_filename', file.name);

      try {
        const response = await fetch('http://localhost:8000/large_file_upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          // Preserve expanded state when updating
          result.metadata = { 
            ...result.metadata, 
            expanded: expanded 
          };
          updateNodeData({ path: path, newData: result });
        } else {
          console.error('Failed to upload image');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.readAsDataURL(file);
  }

  // Collapsed view - minimal information
  if (!expanded) {
    return (
      <div className="list-wrapper small">
        <div className="list-title">
          {getTitleText()}
          <ChevronButton expanded={expanded} setExpanded={setExpanded} />
        </div>
      </div>
    );
  }

  // Expanded view - always show the dropzone if there's no image
  return (
    <div className="list-wrapper">
      <div className="list-title">
        {getTitleText()}
        <ChevronButton expanded={expanded} setExpanded={setExpanded} />
      </div>

      {hasImage() ? (
        // Image preview section
        <div className="item-list">
          <div 
            style={{ 
              position: 'relative',
              cursor: 'pointer',
              borderRadius: '5px'
            }}
            onClick={handleDropzoneClick}
          >
            <Image 
              w='100%' 
              src={getImageSrc()} 
              style={{borderRadius: '5px'}}
            />
            
            {isLoading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)'
              }}>
                <Loader color='dark.3' size={30} />
              </div>
            )}
            
            <div 
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              onClick={handleRemoveImage}
            >
              ✕
            </div>
          </div>
          
          {metadata.filename && (
            <Text size='xs' c='dimmed'>
              {metadata.filename}
            </Text>
          )}
        </div>
      ) : (
        // Clickable dropzone for when there's no image
        <div 
          className="item-list"
          style={{ 
            border: '1px dashed #ced4da', 
            borderRadius: '5px',
            padding: '20px',
            cursor: 'pointer'
          }}
          onClick={handleDropzoneClick}
        >
          {isLoading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100px'
            }}>
              <Loader color='dark.3' size={30} />
            </div>
          ) : (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <IconPhoto size={20} color="#868e96" style={{ marginBottom: 10 }} />
              <Text ta="center" size="xs" mb={5}>
                Click to select an image
              </Text>
              <Text ta="center" size="xs" c="dimmed">
                Attach PNG or JPG file
              </Text>
            </div>
          )}
        </div>
      )}
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileChange}
      />
    </div>
  );
}
