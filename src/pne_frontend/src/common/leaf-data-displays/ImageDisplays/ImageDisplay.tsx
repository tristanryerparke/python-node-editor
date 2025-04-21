import { IconPhoto } from "@tabler/icons-react";
import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { ImageData } from "../../../types/dataTypes/imageData";
import { updateNodeData } from "../../../utils/nodeDataUtils";
import { useEdgeConnected } from "../../../contexts/edgeConnectedContext";
import { AnyData } from "../../../types/dataTypes/anyData";
import {
  DisplayContainer,
  DisplayHeader,
  ContentContainer,
  MediaDisplay,
  DropzoneArea,
  EmptyState,
  LoadingOverlay,
  FilenameDisplay
} from "./SharedComponents";

interface ImageInputProps {
  path: (string | number)[];
  data: AnyData | null;
}

export default function ImageDisplay({ path, data }: ImageInputProps) {
  // Use the data directly
  const imgData = data as ImageData | null;
  const [isLoading, setIsLoading] = useState(false);
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
  const expanded = (imgData?.metadata?.expanded ?? false) as boolean;
  const setExpanded = (expanded: boolean) => {
    if (imgData) {
      const newData = {
        ...imgData,
        metadata: { ...imgData.metadata, expanded }
      };
      updateNodeData({ path: [...path, 'data'], newData });
    }
  };

  // Helper function to determine if we have an image to display
  const hasImage = () => {
    return Boolean(imgData?.payload || imgData?.preview);
  };

  // Helper function to get the image source
  const getImageSrc = () => {
    if (imgData?.preview) {
      return `data:image/jpeg;base64,${imgData.preview}`;
    }
    if (imgData?.payload) {
      return `data:image/jpeg;base64,${imgData.payload}`;
    }
    return '';
  };

  // Get display text for the title
  const getTitleText = () => {
    if (hasImage() && imgData?.width && imgData?.height) {
      return `Image: ${imgData.width}x${imgData.height} ${imgData.image_type || ''}`;
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
      const imageData = e.target?.result as string;
      const base64Data = imageData.split(',')[1];
      
      const updatedData: {
        class_name: string;
        id: string;
        payload: string;
        metadata?: {
          expanded: boolean;
          filename: string;
        }
      } = { 
        class_name: "ImageData",
        id: uuidv4(),
        payload: base64Data
      };

      try {
        // Preserve expanded state when updating
        updatedData.metadata = { 
          expanded: expanded,
          filename: file.name
        };
        
        // Update the node data
        updateNodeData({ path: [...path, 'data'], newData: updatedData });
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.readAsDataURL(file);
  }

  // Render the component using shared components
  return (
    <DisplayContainer expanded={expanded} isDisabled={isDisabled}>
      <DisplayHeader 
        title={getTitleText()} 
        expanded={expanded} 
        setExpanded={setExpanded} 
      />
      
      {expanded && (
        <>
          <ContentContainer>
            {hasImage() ? (
              <>
                <MediaDisplay 
                  src={getImageSrc()} 
                  isDisabled={isDisabled} 
                  onRemove={handleRemoveImage} 
                />
                {isLoading && <LoadingOverlay />}
              </>
            ) : (
              !isDisabled ? (
                <DropzoneArea 
                  isLoading={isLoading}
                  isDisabled={isDisabled}
                  onClick={handleDropzoneClick}
                  icon={<IconPhoto size={20} color="#868e96" style={{ marginBottom: 10 }} />}
                  primaryText="Click to select an image"
                  secondaryText="Attach PNG or JPG file"
                />
              ) : (
                <EmptyState 
                  isConnected={isConnected} 
                  isOutput={isOutput} 
                  type="image" 
                />
              )
            )}
          </ContentContainer>
          
          <FilenameDisplay filename={imgData?.metadata?.filename} />
          
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
        </>
      )}
    </DisplayContainer>
  );
}
