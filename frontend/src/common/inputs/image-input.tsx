import { memo, useEffect, useRef, useState } from "react";
import { Input } from "../../components/ui/input";
import { cn } from "@/lib/utils";
import { ErrorDialog } from "../utility-components/error-dialog";
import ImagePreview from "../utility-components/image-preview";
import { buildApiPath } from "@/lib/fetcher";
import { isCachedValueReference } from "@/utils/large-data-utils";
import type { ControlledInputProps } from "../../components/custom-node/node-inputs/input-field-display";

export interface ImageInputProps extends ControlledInputProps {}

const ImageInput = memo(function ImageInput({
  value,
  onChange,
  disabled,
  expanded = false,
}: ImageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const imageValue =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;

  const cacheKey =
    typeof imageValue?.cacheKey === "string" ? imageValue.cacheKey : undefined;

  useEffect(() => {
    if (!cacheKey) return;

    fetch(buildApiPath(`/data/cache_exists/${cacheKey}`))
      .then((response) => response.json())
      .then((data) => {
        if (!data.exists) {
          void Promise.resolve(onChange(null, 0));
        }
      })
      .catch((error) => {
        console.error("Error checking cache key:", error);
      });
  }, [cacheKey, onChange]);

  const hasImage = !!cacheKey;
  const imageForPreview = isCachedValueReference(value) ? value : undefined;
  const preview =
    typeof imageForPreview?.preview === "string"
      ? imageForPreview.preview
      : undefined;

  const displayName =
    typeof imageValue?.displayName === "string"
      ? imageValue.displayName
      : "Generated Image";

  const uploadText = uploading
    ? "Uploading..."
    : cacheKey
      ? displayName
      : "Upload Image";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onChange(file, 0);
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

  const filePicker = (
    <>
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
    </>
  );

  return (
    <>
      {expanded ? (
        <div className="flex flex-col flex-1 gap-1.5 nodrag nopan nowheel">
          <div className="flex flex-1 min-w-35">{filePicker}</div>
          <ImagePreview preview={preview} />
        </div>
      ) : (
        <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
          {filePicker}
        </div>
      )}
      <ErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        title="Image Upload Failed"
        message={errorMessage}
      />
    </>
  );
});

export default ImageInput;
