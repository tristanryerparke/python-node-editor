import { FileImage } from "lucide-react";
import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { StringData } from "../../../types/dataTypes/stringData";
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

interface SVGDisplayProps {
  path: (string | number)[];
  data: AnyData | null;
}

export default function SVGDisplay({ path, data }: SVGDisplayProps) {
  // Use the data directly
  const svgData = data as StringData | null;
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
  const expanded = (svgData?.metadata?.expanded ?? false) as boolean;
  const setExpanded = (expanded: boolean) => {
    if (svgData) {
      const newData = {
        ...svgData,
        metadata: { ...svgData.metadata, expanded }
      };
      updateNodeData({ path: [...path, 'data'], newData });
    }
  };

  // Helper function to determine if we have an SVG to display
  const hasSvg = () => {
    return Boolean(svgData?.payload);
  };

  // Helper function to get the SVG source
  const getSvgSrc = () => {
    if (svgData?.payload) {
      // Convert SVG string to a data URL
      const svgBlob = new Blob([svgData.payload], { type: 'image/svg+xml' });
      return URL.createObjectURL(svgBlob);
    }
    return '';
  };

  // Get display text for the title
  const getTitleText = () => {
    if (hasSvg()) {
      return `SVG`;
    }
    return "No SVG";
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
  const handleRemoveFile = (e: React.MouseEvent) => {
    if (isDisabled) return;
    e.stopPropagation(); // Prevent triggering the dropzone click
    handleUpload(null);
  };

  async function handleUpload(file: File | null) {
    if (!file) {
      // Preserve expanded state when removing the SVG
      updateNodeData({ 
        path: [...path, 'data'], 
        newData: {
          class_name: "SVGData",
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
      const svgString = e.target?.result as string;
      
      const updatedData: {
        class_name: string;
        id: string;
        payload: string;
        metadata?: {
          expanded: boolean;
          filename: string;
        }
      } = { 
        class_name: "SVGData",
        id: uuidv4(),
        payload: svgString
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
        console.error('Error uploading SVG:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.readAsText(file);
  }

  // Render filename display
  const renderFilename = () => {
    const filename = svgData?.metadata?.filename;
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
    if (hasSvg()) {
      return (
        <div className="w-full">
          <div className="w-full">
            <div className="w-full h-full rounded bg-white dark:bg-background relative" style={{ aspectRatio: '1/1' }}>
              <div className="w-full h-full flex items-center justify-center relative">
                <img 
                  src={getSvgSrc()} 
                  className="max-w-full max-h-full rounded object-contain"
                  alt="SVG"
                />
                {/* Remove button */}
                {!isDisabled && (
                  <div 
                    className="absolute flex items-center justify-center cursor-pointer bg-white dark:bg-background bg-opacity-70 dark:bg-opacity-70 rounded-full z-10 text-gray-600 dark:text-gray-300"
                    style={{ top: '5px', right: '5px', width: '20px', height: '20px' }}
                    onClick={handleRemoveFile}
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
                  No SVG {isConnected ? '(input connected)' : isOutput ? 'output' : ''}
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
                  <FileImage size={20} className="text-gray-500 dark:text-gray-400 mb-2" />
                  <span className="text-center text-xs mb-2 text-gray-700 dark:text-gray-300">
                    Click to select an SVG
                  </span>
                  <span className="text-center text-xs text-gray-500 dark:text-gray-400">
                    Attach SVG file
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render - matching ImageDisplay structure exactly
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
                accept="image/svg+xml"
                onChange={handleFileChange}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
} 