import { memo, useRef, useState, useEffect } from "react";
import { Input } from "../../components/ui/input";
import { cn } from "@/lib/utils";
import { useInputField, type CustomInputProps } from "@/hooks/useInputField";
import { ErrorDialog } from "./leaf-utils/error-dialog";

export default memo(function ImageInput({ inputData, path }: CustomInputProps) {
  const { setValue, disabled } = useInputField(inputData, path);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const imageValue =
    typeof inputData.value === "object" &&
    inputData.value !== null &&
    !Array.isArray(inputData.value)
      ? (inputData.value as Record<string, unknown>)
      : undefined;

  const cacheKey =
    typeof imageValue?.cacheKey === "string" ? imageValue.cacheKey : undefined;

  // Check if cache key exists on mount (after page reload with persisted state)
  useEffect(() => {
    if (!cacheKey) return;

    // Verify the cache key still exists in the backend
    fetch(`http://localhost:8000/data/cache_exists/${cacheKey}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.exists) {
          void setValue(null, 0);
        }
      })
      .catch((error) => {
        console.error("Error checking cache key:", error);
      });
  }, []); // Only run on mount

  // Check if there's image data
  const hasImage = !!cacheKey;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      await setValue(file, 0);
    } catch (error) {
      console.error("Error uploading image:", error);
      setErrorMessage(
        "Failed to upload image. Please ensure the backend server is running.",
      );
      setShowErrorDialog(true);
    } finally {
      setUploading(false);
    }
  };

  const displayName =
    typeof imageValue?.displayName === "string"
      ? imageValue.displayName
      : "Generated Image";

  // When connected, show as read-only display (like output)
  if (disabled) {
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
            {hasImage ? displayName : "No image"}
          </span>
        </span>
      </div>
    );
  }

  // When not connected, show file picker
  const uploadText = uploading
    ? "Uploading..."
    : cacheKey
      ? displayName
      : "Upload Image";

  return (
    <>
      <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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
      </div>

      <ErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        title="Image Upload Failed"
        message={errorMessage}
      />
    </>
  );
});
