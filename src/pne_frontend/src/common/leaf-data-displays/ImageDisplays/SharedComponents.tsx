import { Text, Loader, Flex } from "@mantine/core";
import { ReactNode } from "react";
import { ChevronButton } from "../../ChevronButton";

// Common container for all data displays
export function DisplayContainer({ 
  children, 
  expanded, 
  isDisabled 
}: { 
  children: ReactNode, 
  expanded: boolean, 
  isDisabled: boolean 
}) {
  return expanded ? (
    <div style={{
      width: '100%', 
      height: '100%',
      // aspectRatio: '1/1',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '5px',
      padding: '5px',
      border: '1px solid black',
      borderRadius: '5px',
      opacity: isDisabled ? 0.7 : 1,
    }}>
      {children}
    </div>
  ) : (
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
    }}>
      {children}
    </div>
  );
}

// Header component with title and expand/collapse button
export function DisplayHeader({ 
  title, 
  expanded, 
  setExpanded 
}: { 
  title: string, 
  expanded: boolean, 
  setExpanded: (expanded: boolean) => void 
}) {
  return expanded ? (
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
      {title}
      <ChevronButton expanded={expanded} setExpanded={setExpanded} />
    </div>
  ) : (
    <>
      {title}
      <ChevronButton expanded={expanded} setExpanded={setExpanded} />
    </>
  );
}

// Content container for the main display area
export function ContentContainer({ 
  children
}: { 
  children: ReactNode 
}) {
  return (
    <div className="field-list" style={{ width: '100%' }}>
      <div style={{ width: '100%' }}>
        <div 
          style={{
            width: '100%',
            height: '100%',
            aspectRatio: '1/1',
            borderRadius: '5px',
            backgroundColor: 'white',
            position: 'relative'
          }}
          // className="nopan nodrag"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Media display component for showing the image/SVG
export function MediaDisplay({ 
  src, 
  isDisabled,
  onRemove
}: { 
  src: string, 
  isDisabled: boolean,
  onRemove: (e: React.MouseEvent) => void
}) {
  return (
    <div
      className="pne-div"
      style={{
        
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}

    >
      <img 
        src={src} 
        style={{
          flexGrow: 1,
          borderRadius: '5px',
          opacity: isDisabled ? 0.7 : 1,
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain'
        }}
        alt="Media display"
      />
      
      {/* X button positioned relative to the image */}
      {!isDisabled && (
        <RemoveButton onClick={onRemove} />
      )}
    </div>
  );
}

// Dropzone component for uploading files
export function DropzoneArea({ 
  isLoading, 
  isDisabled, 
  onClick, 
  icon, 
  primaryText, 
  secondaryText 
}: { 
  isLoading: boolean, 
  isDisabled: boolean, 
  onClick: () => void, 
  icon: ReactNode, 
  primaryText: string, 
  secondaryText: string 
}) {
  return (
    <div 
      style={{ 
        display: 'flex',
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        border: '1px dashed #ced4da',
        borderRadius: '5px',
      }}
      onClick={onClick}
    >
      {isLoading ? (
        <Loader color='dark.3' size={30} />
      ) : (
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {icon}
          <Text ta="center" size="xs" mb={5}>
            {primaryText}
          </Text>
          <Text ta="center" size="xs" c="dimmed">
            {secondaryText}
          </Text>
        </div>
      )}
    </div>
  );
}

// Empty state component for when there's no content
export function EmptyState({ 
  isConnected, 
  isOutput, 
  type 
}: { 
  isConnected: boolean, 
  isOutput: boolean, 
  type: string 
}) {
  return (
    <div style={{
      display: 'flex',
      height: '100%',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Text ta="center" size="xs" c="dimmed">
        No {type} {isConnected ? '(input connected)' : isOutput ? 'output' : ''}
      </Text>
    </div>
  );
}

// Loading overlay
export function LoadingOverlay() {
  return (
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
  );
}

// Filename display
export function FilenameDisplay({ 
  filename 
}: { 
  filename?: string 
}) {
  if (!filename) return null;
  
  return (
    <Text size='xs' c='dimmed'>
      {filename}
    </Text>
  );
}

// Remove button component
export function RemoveButton({ 
  onClick 
}: { 
  onClick: (e: React.MouseEvent) => void 
}) {
  return (
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
        borderRadius: '50%',
        zIndex: 10
      }}
      onClick={onClick}
    >
      ✕
    </div>
  );
} 