import { memo, useEffect, useRef, useState, type NamedExoticComponent } from "react";
import { Input } from "../../components/ui/input";
import { cn } from "@/lib/utils";
import { useInputField, type CustomInputProps } from "@/hooks/useInputField";
import { ErrorDialog } from "../utility-components/error-dialog";
import ImagePreview from "../utility-components/image-preview";
import { isCachedValueReference } from "@/utils/large-data-utils";

const DEFAULT_PREVIEW_HEIGHT = 60;

export interface ImageInputProps {
  value: unknown;
  onChange: (value: File | null) => Promise<void> | void;
  disabled: boolean;
  expanded?: boolean;
  path?: (string | number)[];
}

type CombinedImageInputProps = ImageInputProps | CustomInputProps;

type ImageInputComponent = NamedExoticComponent<CombinedImageInputProps> & {
  expandable: true;
};

function isCustomInputProps(
  props: CombinedImageInputProps,
): props is CustomInputProps {
  return "inputData" in props;
}

const ControlledImageInput = memo(function ControlledImageInput({
  value,
  onChange,
  disabled,
  expanded = false,
  path,
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

    fetch(`http://localhost:8000/data/cache_exists/${cacheKey}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.exists) {
          void Promise.resolve(onChange(null));
        }
      })
      .catch((error) => {
        console.error("Error checking cache key:", error);
      });
  }, []); // Only run on mount

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
      await onChange(file);
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
          {path ? (
            <ImagePreview
              preview={preview}
              path={path}
              defaultHeight={DEFAULT_PREVIEW_HEIGHT}
            />
          ) : null}
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

const StoreBackedImageInput = memo(function StoreBackedImageInput({
  inputData,
  path,
  disabled,
}: CustomInputProps) {
  const { value, setValue } = useInputField(inputData, path);

  return (
    <ControlledImageInput
      value={value}
      onChange={(nextValue) => setValue(nextValue, 0)}
      disabled={disabled}
      expanded={inputData._expanded ?? false}
      path={path}
    />
  );
});

const ImageInput = memo(function ImageInput(props: CombinedImageInputProps) {
  if (isCustomInputProps(props)) {
    return <StoreBackedImageInput {...props} />;
  }

  return <ControlledImageInput {...props} />;
}) as ImageInputComponent;

ImageInput.expandable = true;

export default ImageInput;
