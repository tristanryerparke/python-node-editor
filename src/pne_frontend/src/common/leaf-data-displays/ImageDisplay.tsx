import { Image, Text, Loader } from "@mantine/core";
import { IconPhoto, IconArrowsMaximize } from "@tabler/icons-react";
import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { ImageData } from "../../types/dataTypes/imageData";
import { ChevronButton } from "../ChevronButton";
import { updateNodeData } from "../../utils/updateNodeData";
import { useEdgeConnected } from "../../contexts/edgeConnectedContext";
import { Resizable } from "re-resizable";

const IMAGE_PREVIEW_SIZE = 200;
const DEFAULT_SIZE = {
  width: IMAGE_PREVIEW_SIZE,
  height: IMAGE_PREVIEW_SIZE,
};

interface ImageInputProps {
  path: (string | number)[];
  data?: ImageData | null;
}

// Custom resize handle component
const ResizeHandle = () => (
  <div 
    className="nodrag nopan nowheel"
    style={{
      position: 'absolute',
      bottom: '2px',
      right: '2px',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'se-resize'
    }}
  >
    <IconArrowsMaximize 
      size={14} 
      stroke={1.5}
      style={{
        padding: 2,
        opacity: 0.4
      }}
    />
  </div>
);

export default function ImageInput({ data, path }: ImageInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Only check edge connected state for inputs
  const isInput = path[1] === 'inputs';
  let isConnected = false;
  try {
    const context = useEdgeConnected();
    isConnected = isInput ? context.isConnected : false;
  } catch {
    // If we're not within the provider (outputs), ignore the error
  }

  // Determine if this is an output (non-interactive) component
  const isOutput = path[1] === 'outputs';

  // Determine if the component should be disabled (either output or connected)
  const isDisabled = isOutput || isConnected;

  // Get expanded state from data
  const expanded = (data?.metadata?.expanded ?? false) as boolean;
  const setExpanded = (expanded: boolean) => {
    if (data) {
      const newData = {
        ...data,
        metadata: { ...data.metadata, expanded }
      };
      updateNodeData({ path: [...path, 'data'], newData });
    }
  };

  // Helper function to determine if we have an image to display
  const hasImage = () => {
    return Boolean(data?.payload || data?.preview);
  };

  // Helper function to get the image source
  const getImageSrc = () => {
    if (data?.preview) {
      return `data:image/jpeg;base64,${data.preview}`;
    }
    if (data?.payload) {
      return `data:image/jpeg;base64,${data.payload}`;
    }
    return '';
  };

  // Get display text for the title
  const getTitleText = () => {
    if (hasImage() && data?.width && data?.height) {
      return `Image: ${data.width}x${data.height} ${data.image_type || ''}`;
    }
    return "No image";
  };

  // Handle click on the dropzone
  const handleDropzoneClick = () => {
    if (!isLoading && fileInputRef.current && !isDisabled) {
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
    if (isDisabled) return;
    e.stopPropagation(); // Prevent triggering the dropzone click
    handleUpload(null);
  };

  // Calculate aspect ratio from image data
  const aspectRatio = data?.width && data?.height ? data.width / data.height : 1;

  // Update size when image dimensions change
  useEffect(() => {
    if (data?.width && data?.height) {
      // Keep the width the same, but adjust height based on aspect ratio
      const currentWidth = size.width;
      setSize({
        width: currentWidth,
        height: currentWidth / aspectRatio
      });
    }
  }, [data?.width, data?.height, aspectRatio]);

  async function handleUpload(file: File | null) {
    if (!file) {
      // Preserve expanded state when removing the image
      updateNodeData({ 
        path: [...path, 'data'], 
        newData: {
          class_name: "ImageData",
          metadata: { 
            expanded: expanded 
          }
        } 
      });
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
          // Consistently use the same path format for setting image data
          updateNodeData({ path: [...path, 'data'], newData: result });
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
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '5px',
        padding: '5px',
        border: '1px solid black',
        borderRadius: '5px',
        height: 'var(--small-element-height)'
      }}
      >
        {getTitleText()}
        <ChevronButton expanded={expanded} setExpanded={setExpanded} />
      </div>
    );
  }

  // Expanded view - always show the dropzone if there's no image
  return (
    <div style={{
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '5px',
      padding: '5px',
      border: '1px solid black',
      borderRadius: '5px',
      opacity: isDisabled ? 0.7 : 1,
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '5px'
        }}
      >
        {getTitleText()}
        <ChevronButton expanded={expanded} setExpanded={setExpanded} />
      </div>

      {hasImage() ? (
        <div className="field-list">
          <div style={{ position: 'relative' }}>
            <Resizable
              // size={size}
              defaultSize={size}
              // onResize={(_e, _direction, _ref, d) => {
              //   setSize({
              //     width: Math.max(IMAGE_PREVIEW_SIZE, size.width + d.width),
              //     height: Math.max(IMAGE_PREVIEW_SIZE, size.height + d.height)
              //   });
              // }}
              enable={{
                top: false,
                right: false,
                bottom: false,
                left: false,
                topRight: false,
                bottomRight: true,
                bottomLeft: false,
                topLeft: false,
              }}
              minWidth={IMAGE_PREVIEW_SIZE}
              minHeight={IMAGE_PREVIEW_SIZE}
              // maxWidth={1300}
              // maxHeight={1300}
              grid={[1, 1]}
              lockAspectRatio={aspectRatio}
              // handleComponent={{
              //   bottomRight: <ResizeHandle />
              // }}
              style={{
                position: 'relative',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white'
              }}
              className="nopan nodrag"
            >
              <Image 
                w='100%'
                h='100%'
                fit="contain"
                src={getImageSrc()} 
                style={{
                  borderRadius: '5px',
                  opacity: isDisabled ? 0.7 : 1,
                  objectFit: 'contain'
                }}
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
              
              {/* Only show remove button for inputs that aren't disabled */}
              {!isDisabled && (
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
                    cursor: 'pointer',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '50%'
                  }}
                  onClick={handleRemoveImage}
                >
                  ✕
                </div>
              )}
            </Resizable>
          </div>
          
          {data?.metadata?.filename && (
            <Text size='xs' c='dimmed'>
              {data.metadata.filename}
            </Text>
          )}
        </div>
      ) : (
        // Clickable dropzone for when there's no image - only for enabled inputs
        !isDisabled ? (
          <div 
            className="field-list"
            style={{ 
              display: 'flex',
              border: '1px dashed #ced4da', 
              borderRadius: '5px',
              padding: '20px',
              height: '200px',
              width: '200px',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.7 : 1
            }}
            onClick={handleDropzoneClick}
          >
            {isLoading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px'
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
        ) : (
          // Non-interactive placeholder for outputs or disabled inputs
          <div className="field-list">
            <Text ta="center" size="xs" c="dimmed">
              No image {isConnected ? '(input connected)' : 'output'}
            </Text>
          </div>
        )
      )}
      
      {/* Hidden file input - only needed for enabled inputs */}
      {!isDisabled && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileChange}
        />
      )}
    </div>
  );
}
