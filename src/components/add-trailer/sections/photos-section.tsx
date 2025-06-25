"use client";

import { Upload, X } from "lucide-react";
import { FormSection } from "../components/form-section";
import { SectionId, TrailerFormData, ImageItem } from "../types";
import { useTranslation } from "@/lib/i18n/client";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useEffect, useRef } from "react";

interface PhotosSectionProps {
  formData: TrailerFormData;
  isExpanded: boolean;
  isCompleted: boolean;
  onToggle: () => void;
  updateFormData: <T>(field: keyof TrailerFormData, value: T) => void;
  setCompletedSections: (callback: (prev: any) => any) => void;
  setExpandedSections: (callback: (prev: any) => any) => void;
}

export const PhotosSection: React.FC<PhotosSectionProps> = ({
  formData,
  isExpanded,
  isCompleted,
  onToggle,
  updateFormData,
  setCompletedSections,
  setExpandedSections,
}) => {
  const { t } = useTranslation("addTrailer");

  // Track if we've initialized from formData
  const initializedRef = useRef(false);
  const previousImagesRef = useRef<string>("");

  const {
    images,
    isUploading,
    handleFileSelect,
    removeImage,
    triggerFileInput,
    fileInputRef,
  } = useImageUpload({
    maxFiles: 3,
    maxSizeInMB: 5,
    acceptedFormats: ["image/jpeg", "image/png", "image/webp"],
    onUpload: async (files) => {
      const uploadFormData = new FormData();
      files.forEach((file) => {
        uploadFormData.append("files", file);
      });

      const response = await fetch("/api/upload/trailer-images", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload images");
      }

      return await response.json();
    },
    onError: (error) => {
      alert(`Er is een fout opgetreden: ${error}`);
    },
  });

  // Initialize hook with existing images from formData (only once)
  useEffect(() => {
    if (
      !initializedRef.current &&
      formData.images &&
      formData.images.length > 0
    ) {
      // TODO: Initialize the hook with existing images if needed
      // This would require extending the useImageUpload hook to accept initial images
      initializedRef.current = true;
    }
  }, [formData.images]);

  // Sync hook's images with form data only when they actually change
  useEffect(() => {
    const uploadedImages = images
      .filter((img) => img.uploaded)
      .map((img) => ({
        id: img.id,
        name: img.url?.split("/").pop() || "image",
        preview: img.preview,
        url: img.url,
        size: "0",
        uploaded: true,
      }));

    // Create a string representation to compare
    const currentImagesString = JSON.stringify(
      uploadedImages.map((img) => ({ id: img.id, url: img.url }))
    );

    // Only update if the images have actually changed
    if (currentImagesString !== previousImagesRef.current) {
      previousImagesRef.current = currentImagesString;

      updateFormData("images", uploadedImages);

      // Check completion status
      if (uploadedImages.length >= 3) {
        setCompletedSections((prev) => ({
          ...prev,
          photos: true,
        }));
      } else {
        setCompletedSections((prev) => ({
          ...prev,
          photos: false,
        }));
      }
    }
  }, [images]); // Remove updateFormData and setCompletedSections from dependencies

  // Get summary text based on number of photos
  const getSummary = () => {
    const uploadedCount = images.filter((img) => img.uploaded).length;
    if (uploadedCount === 0) return undefined;
    return `${uploadedCount}/3 ${t("sections.photos.progress")}`;
  };

  const uploadedCount = images.filter((img) => img.uploaded).length;

  return (
    <FormSection
      id={SectionId.PHOTOS}
      title={t("sections.photos.title")}
      icon={<Upload size={18} />}
      isExpanded={isExpanded}
      isCompleted={isCompleted}
      summary={getSummary()}
      onToggle={onToggle}
    >
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">
          {t("sections.photos.description")}
        </p>
        <p className="text-xs text-gray-500">
          {uploadedCount}/3 {t("sections.photos.progress")}
        </p>
      </div>

      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 cursor-pointer transition-all"
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center py-4">
          <Upload className="h-8 w-8 text-gray-400 mb-3" />
          <p className="font-medium mb-1 text-sm">
            {t("sections.photos.dropzone")}
          </p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">
            {t("sections.photos.uploadedPhotos")} ({uploadedCount}/3)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-video relative rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={image.preview}
                    alt={`Photo ${image.id}`}
                    className="w-full h-full object-cover"
                  />

                  {image.uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-sm">
                        {t("sections.photos.uploading")}
                      </div>
                    </div>
                  )}

                  {image.uploaded && (
                    <div className="absolute top-1 left-1 bg-green-500 rounded-full p-1">
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}

                  {!image.uploading && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(image.id);
                      }}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-gray-700" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2">
        {uploadedCount < 3 && (
          <p className="text-xs text-red-500 mt-2">
            {t("sections.photos.required")}
          </p>
        )}
      </div>
    </FormSection>
  );
};
