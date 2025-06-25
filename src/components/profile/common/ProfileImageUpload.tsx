"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImageUpload } from "@/hooks/useImageUpload";

interface ProfileImageUploadProps {
  currentImage: string | null;
  onImageUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export default function ProfileImageUpload({
  currentImage,
  onImageUpload,
  isUploading: externalIsUploading = false,
}: ProfileImageUploadProps) {
  const {
    images,
    isUploading: internalIsUploading,
    handleFileSelect,
    triggerFileInput,
    fileInputRef,
  } = useImageUpload({
    maxFiles: 1,
    maxSizeInMB: 5,
    acceptedFormats: ["image/jpeg", "image/png", "image/webp"],
    onUpload: async (files) => {
      // Call the parent's upload handler
      await onImageUpload(files[0]);
      // Return empty result since parent handles the upload
      return { images: [] };
    },
  });

  // Use the first image preview if available, otherwise use current image
  const displayImage = images[0]?.preview || currentImage;
  const isUploading = externalIsUploading || internalIsUploading;

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage
            src={displayImage || ""}
            alt="Profile"
            className="object-cover"
          />
          <AvatarFallback className="bg-primary/10">
            <User className="h-12 w-12 text-primary" />
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={isUploading}
          className={cn(
            "absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-white",
            "hover:bg-primary/90 transition-colors",
            isUploading && "opacity-70 cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      <div className="text-xs text-muted-foreground text-center">
        Klik op het icoon om een profielfoto te uploaden
        <br />
        JPG, PNG of WebP, max 5MB
      </div>
    </div>
  );
}
