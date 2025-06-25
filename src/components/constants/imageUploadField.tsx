import React from "react";
import { ImageIcon, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useImageUpload, UseImageUploadOptions } from "@/hooks/useImageUpload";

interface ImageUploadFieldProps {
  label?: string;
  description?: string;
  maxFiles?: number;
  maxSizeInMB?: number;
  acceptedFormats?: string[];
  onUpload?: UseImageUploadOptions["onUpload"];
  onImagesChange?: (
    images: Array<{ id: string; url?: string; preview: string }>
  ) => void;
  className?: string;
  gridCols?: 2 | 3 | 4;
  imageSize?: "sm" | "md" | "lg";
  showProgress?: boolean;
}

export function ImageUploadField({
  label,
  description,
  maxFiles = 3,
  maxSizeInMB = 5,
  acceptedFormats = ["image/jpeg", "image/png", "image/webp"],
  onUpload,
  onImagesChange,
  className,
  gridCols = 3,
  imageSize = "md",
  showProgress = true,
}: ImageUploadFieldProps) {
  const {
    images,
    isUploading,
    uploadProgress,
    error,
    handleFileSelect,
    removeImage,
    fileInputRef,
  } = useImageUpload({
    maxFiles,
    maxSizeInMB,
    acceptedFormats,
    onUpload,
  });

  // Notify parent of image changes
  React.useEffect(() => {
    if (onImagesChange) {
      const imageData = images.map((img) => ({
        id: img.id,
        url: img.url,
        preview: img.preview,
      }));
      onImagesChange(imageData);
    }
  }, [images, onImagesChange]);

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  const gridColsClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  const formatList = acceptedFormats
    .map((f) => f.split("/")[1].toUpperCase())
    .join(", ");

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-sm font-medium">{label}</label>}

      <div className={cn("grid gap-2", gridColsClass[gridCols])}>
        {/* Display uploaded/uploading images */}
        {images.map((image) => (
          <div
            key={image.id}
            className={cn(
              "relative rounded-md overflow-hidden",
              sizeClasses[imageSize]
            )}
          >
            <Image
              src={image.preview}
              alt={`Upload ${image.id}`}
              fill
              className="object-cover"
            />

            {/* Uploading overlay */}
            {image.uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            )}

            {/* Remove button */}
            {!image.uploading && (
              <button
                type="button"
                onClick={() => removeImage(image.id)}
                className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            )}
          </div>
        ))}

        {/* Upload button */}
        {images.length < maxFiles && (
          <label
            className={cn(
              "border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors",
              sizeClasses[imageSize],
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <ImageIcon className="h-6 w-6 text-gray-400" />
            {imageSize !== "sm" && (
              <span className="text-xs text-gray-500 mt-1">Upload</span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={acceptedFormats.join(",")}
              multiple={maxFiles > 1}
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </label>
        )}
      </div>

      {/* Progress bar */}
      {showProgress && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Error message */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Description */}
      {description && (
        <p className="text-xs text-muted-foreground">
          {description ||
            `Upload tot ${maxFiles} afbeeldingen (${formatList}, max. ${maxSizeInMB}MB per foto)`}
        </p>
      )}
    </div>
  );
}
