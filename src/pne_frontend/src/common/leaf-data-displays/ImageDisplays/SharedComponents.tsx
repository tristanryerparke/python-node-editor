import { ReactNode } from "react";
import { ChevronButton } from "../../ChevronButton";

function LoadingSpinner({ size = 30 }: { size?: number }) {
  return (
    <div 
      className="animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
      style={{ width: size, height: size }}
    />
  );
}

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
    <div
      className="w-full h-full flex flex-col items-center gap-1 p-2 border border-input rounded-md"
      style={{ opacity: isDisabled ? 0.7 : 1 }}
    >
      {children}
    </div>
  ) : (
    <div
      className="w-full flex flex-row items-center justify-between gap-1 p-1 border border-black rounded"
      style={{ height: 'var(--small-element-height)', opacity: isDisabled ? 0.7 : 1 }}
    >
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
  return (
    <div className="w-full flex flex-row items-center justify-between gap-1">
      <div className="text-nowrap overflow-hidden text-ellipsis">{title}</div>
      <ChevronButton expanded={expanded} setExpanded={setExpanded} />
    </div>
  );
}

// Content container for the main display area
export function ContentContainer({ 
  children
}: { 
  children: ReactNode 
}) {
  return (
    <div className="w-full">
      <div className="w-full">
        <div
          className="w-full h-full rounded bg-white relative"
          style={{ aspectRatio: '1/1' }}
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
      className="w-full h-full flex items-center justify-center relative"
    >
      <img 
        src={src} 
        className="flex-grow rounded"
        style={{
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
      className="flex h-full w-full items-center justify-center border-input border-dashe rounded-md"
      style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
      onClick={onClick}
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="flex flex-col items-center">
          {icon}
          <span className="text-center text-xs mb-2">
            {primaryText}
          </span>
          <span className="text-center text-xs text-muted-foreground">
            {secondaryText}
          </span>
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
    <div className="flex h-full w-full items-center justify-center">
      <span className="text-center text-xs text-gray-500">
        No {type} {isConnected ? '(input connected)' : isOutput ? 'output' : ''}
      </span>
    </div>
  );
}

// Loading overlay
export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
      <LoadingSpinner />
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

  // Split filename into base and extension
  const lastDot = filename.lastIndexOf(".");
  let base = filename;
  let ext = "";
  if (lastDot > 0 && lastDot < filename.length - 1) {
    base = filename.slice(0, lastDot);
    ext = filename.slice(lastDot);
  }

  return (
    <div
      className="flex justify-center w-full"
      style={{ padding: "0 12px" }}
    >
      <span
        className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-500"
        style={{
          minWidth: 0,
          maxWidth: "100%",
          textAlign: "center",
        }}
        title={filename}
      >
        <span style={{ verticalAlign: "bottom" }}>{base}</span>
        <span style={{ verticalAlign: "bottom", color: "#888" }}>{ext}</span>
      </span>
    </div>
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
      className="absolute flex items-center justify-center cursor-pointer bg-white bg-opacity-70 rounded-full z-10"
      style={{
        top: '5px',
        right: '5px',
        width: '20px',
        height: '20px'
      }}
      onClick={onClick}
    >
      ✕
    </div>
  );
} 