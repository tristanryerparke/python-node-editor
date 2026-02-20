import { memo, useRef, useState } from "react";
import useFlowStore from "../../stores/flowStore";
import { useNodeConnections } from "@xyflow/react";
import { preserveUIData } from "../../utils/preserve-ui-data";
import { Input } from "../../components/ui/input";
import { cn } from "@/lib/utils";
import type { FrontendFieldDataWrapper } from "../../types/types";
import { ErrorDialog } from "./leaf-utils/error-dialog";

interface SVGDataWrapper extends Omit<FrontendFieldDataWrapper, "value"> {
  value: string | null;
}

interface SVGInputProps {
  inputData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export default memo(function SVGInput({ path, inputData }: SVGInputProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const svgData = inputData as SVGDataWrapper;

  // Check if there's SVG content in the value
  const hasSVG = svgData.value !== null;

  // Use the xyflow hook to check if input is connected
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  const connections = useNodeConnections({
    handleType: "target",
    handleId: handleId,
  });

  // Determine if connected based on connections array
  const isConnected =
    connections.length > 0 && connections[0].targetHandle === handleId;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only accept SVG files
    if (!file.name.toLowerCase().endsWith(".svg")) {
      setErrorMessage("Please select an SVG file");
      setShowErrorDialog(true);
      return;
    }

    setUploading(true);

    // Read file as text
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const svgContent = reader.result as string;

        // Update node data directly with SVG content as a string
        const mergedData = preserveUIData(svgData, {
          type: "SVG",
          value: svgContent,
        });

        updateNodeData(path, mergedData);
      } catch (error) {
        console.error("Error reading SVG file:", error);
        setErrorMessage("Failed to read SVG file");
        setShowErrorDialog(true);
      } finally {
        setUploading(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage("Failed to read file");
      setShowErrorDialog(true);
      setUploading(false);
    };

    reader.readAsText(file);
  };

  // When connected, show as read-only display (like output)
  if (isConnected) {
    return (
      <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
        <span
          className={cn(
            "flex flex-1 w-0 text-sm",
            "h-8 rounded-md border dark:bg-input/30 px-2 py-1 shadow-xs border-input items-center",
            "opacity-50",
          )}
        >
          <span className="truncate min-w-0 flex-1">
            {hasSVG ? "SVG" : "No SVG"}
          </span>
        </span>
      </div>
    );
  }

  // When not connected, show file picker
  const uploadText = hasSVG ? "SVG" : "Upload SVG";

  return (
    <>
      <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
        <Input
          ref={fileInputRef}
          type="file"
          accept=".svg"
          onChange={handleFileChange}
          disabled={uploading}
          className="min-w-20"
          placeholder=""
          hidden
        />
        <div
          className={cn(
            "flex flex-1 w-0 text-sm",
            "h-8 rounded-md border dark:bg-input/30 px-2 py-1 shadow-xs border-input items-center",
            uploading && "opacity-50",
            "cursor-pointer",
          )}
          onClick={() => {
            if (!uploading && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
        >
          <span className="truncate min-w-0 flex-1">{uploadText}</span>
        </div>
        {uploading && (
          <p className="text-xs text-muted-foreground">Loading...</p>
        )}
      </div>

      <ErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        title="SVG File Error"
        message={errorMessage}
      />
    </>
  );
});
