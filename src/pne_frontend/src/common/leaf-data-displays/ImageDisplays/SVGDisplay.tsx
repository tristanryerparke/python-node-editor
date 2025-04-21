import { IconFileVector } from "@tabler/icons-react";
import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { StringData } from "../../../types/dataTypes/stringData";
import { updateNodeData } from "../../../utils/nodeDataUtils";
import { useEdgeConnected } from "../../../contexts/edgeConnectedContext";
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

interface SVGDisplayProps {
  path: (string | number)[];
  data: StringData | null;
}

export default function SVGDisplay({ path, data }: SVGDisplayProps) {
  // Use passed data directly
  const svgData = data as StringData;
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
            {hasSvg() ? (
              <>
                <MediaDisplay 
                  src={getSvgSrc()} 
                  isDisabled={isDisabled} 
                  onRemove={handleRemoveFile} 
                />
                {isLoading && <LoadingOverlay />}
              </>
            ) : (
              !isDisabled ? (
                <DropzoneArea 
                  isLoading={isLoading}
                  isDisabled={isDisabled}
                  onClick={handleDropzoneClick}
                  icon={<IconFileVector size={20} color="#868e96" style={{ marginBottom: 10 }} />}
                  primaryText="Click to select an SVG"
                  secondaryText="Attach SVG file"
                />
              ) : (
                <EmptyState 
                  isConnected={isConnected} 
                  isOutput={isOutput} 
                  type="SVG" 
                />
              )
            )}
          </ContentContainer>
          
          <FilenameDisplay filename={svgData?.metadata?.filename} />
          
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
        </>
      )}
    </DisplayContainer>
  );
} 