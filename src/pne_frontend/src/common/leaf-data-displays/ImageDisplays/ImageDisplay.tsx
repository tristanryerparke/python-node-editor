import { Image } from "lucide-react";
import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { ImageData } from "../../../types/dataTypes/imageData";
import { updateNodeData } from "../../../utils/nodeDataUtils";
import { useEdgeConnected } from "../../../contexts/edgeConnectedContext";
import { AnyData } from "../../../types/dataTypes/anyData";
import { ChevronButton } from "../../ChevronButton";

// Simple loading spinner
function LoadingSpinner({ size = 30 }: { size?: number }) {
  return (
    <div 
      className="animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300"
      style={{ width: size, height: size }}
    />
  );
}

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

  // Render filename display
  const renderFilename = () => {
    const filename = imgData?.metadata?.filename;
    if (!filename) return null;

    // Split filename into base and extension
    const lastDot = filename.lastIndexOf(".");
    let base = filename;
    let ext = "";
    if (lastDot > 0 && lastDot < filename.length - 1) {
      base = filename.slice(0, lastDot);
      ext = filename.slice(lastDot);
    }

    return (
      <div className="flex justify-center w-full">
        <span
          className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground"
          style={{ minWidth: 0, maxWidth: "100%", textAlign: "center" }}
          title={filename}
        >
          <span style={{ verticalAlign: "bottom" }}>{base}</span>
          <span style={{ verticalAlign: "bottom", color: "var(--muted-foreground)" }}>{ext}</span>
        </span>
      </div>
    );
  };

  // Render main content area
  const renderContent = () => {
    if (hasImage()) {
      return (
        <div className="w-full">
          <div className="w-full">
            <div className="w-full h-full rounded bg-white dark:bg-background relative" style={{ aspectRatio: '1/1' }}>
              <div className="w-full h-full flex items-center justify-center relative">
                <img 
                  src={getImageSrc()} 
                  className="max-w-full max-h-full rounded object-contain"
                  alt="image"
                />
                {/* Remove button */}
                {!isDisabled && (
                  <div 
                    className="absolute flex items-center justify-center cursor-pointer bg-white dark:bg-background bg-opacity-70 dark:bg-opacity-70 rounded-full z-10 text-gray-600 dark:text-gray-300"
                    style={{ top: '5px', right: '5px', width: '20px', height: '20px' }}
                    onClick={handleRemoveImage}
                  >
                    ✕
                  </div>
                )}
              </div>
              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-background bg-opacity-70 dark:bg-opacity-70">
                  <LoadingSpinner />
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (isDisabled) {
      return (
        <div className="w-full">
          <div className="w-full">
            <div className="w-full h-full rounded bg-white dark:bg-background relative" style={{ aspectRatio: '1/1' }}>
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-center text-xs text-gray-500 dark:text-gray-400">
                  No image {isConnected ? '(input connected)' : isOutput ? 'output' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="w-full">
          <div className="w-full h-full rounded bg-white dark:bg-background relative" style={{ aspectRatio: '1/1' }}>
            <div 
              className="flex h-full w-full items-center justify-center border border-dashed border-input dark:border-gray-600 rounded hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
              onClick={handleDropzoneClick}
            >
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="flex flex-col items-center">
                  <Image size={20} className="text-gray-500 dark:text-gray-400 mb-2" />
                  <span className="text-center text-xs mb-2 text-gray-700 dark:text-gray-300">
                    Click to select an image
                  </span>
                  <span className="text-center text-xs text-gray-500 dark:text-gray-400">
                    Attach PNG or JPG file
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render - matching ListDataDisplay structure exactly
  return (
    <div
      className={
        expanded ? 
        "w-full rounded-md transition-colors duration-500 overflow-hidden" : 
        "w-full rounded-md transition-colors duration-500 dark:bg-input/30 overflow-hidden"
      }
      style={{ opacity: isDisabled ? 0.7 : 1 }}
    >
      <div className="w-full flex flex-col justify-center border-input border-1 p-2 gap-2 overflow-hidden">
        <div className="w-full flex flex-row gap-1 items-center justify-between">
          <div className="text-sm flex-grow overflow-hidden text-ellipsis">{getTitleText()}</div>
          <ChevronButton expanded={expanded} setExpanded={setExpanded} />
        </div>
        {expanded && (
          <div className="w-full flex flex-col gap-1">
            {renderContent()}
            {renderFilename()}
            
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
        )}
      </div>
    </div>
  );
}
