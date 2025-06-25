import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export interface ImageFile {
  id: string;
  file?: File;
  preview: string;
  url?: string;
  uploaded?: boolean;
  uploading?: boolean;
  error?: string;
}

export interface UseImageUploadOptions {
  maxFiles?: number;
  maxSizeInMB?: number;
  acceptedFormats?: string[];
  onUpload?: (files: File[]) => Promise<{ images: { url: string; error?: string }[] }>;
  onError?: (error: string) => void;
}

export interface UseImageUploadReturn {
  images: ImageFile[];
  previewUrls: string[];
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  removeImage: (id: string) => void;
  clearAll: () => void;
  triggerFileInput: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const DEFAULT_OPTIONS: Required<UseImageUploadOptions> = {
  maxFiles: 5,
  maxSizeInMB: 5,
  acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  onUpload: async () => ({ images: [] }),
  onError: (error) => toast.error(error),
};

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Extract preview URLs for convenience
  const previewUrls = images.map(img => img.preview);

  // Cleanup object URLs on unmount or when images change
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.preview && img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [images]);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!opts.acceptedFormats.some(format => file.type === format)) {
      const formats = opts.acceptedFormats
        .map(f => f.split('/')[1].toUpperCase())
        .join(', ');
      return `Ongeldig bestandstype. Alleen ${formats} bestanden zijn toegestaan`;
    }

    // Check file size
    const maxSizeInBytes = opts.maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return `Bestand te groot. Maximale bestandsgrootte is ${opts.maxSizeInMB}MB`;
    }

    return null;
  }, [opts.acceptedFormats, opts.maxSizeInMB]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const selectedFiles = Array.from(e.target.files);
    const currentCount = images.filter(img => !img.error).length;
    const remainingSlots = opts.maxFiles - currentCount;

    if (remainingSlots <= 0) {
      opts.onError(`Maximum aantal afbeeldingen (${opts.maxFiles}) bereikt`);
      return;
    }

    const filesToProcess = selectedFiles.slice(0, remainingSlots);
    if (selectedFiles.length > remainingSlots) {
      opts.onError(
        `Maximaal ${opts.maxFiles} afbeeldingen toegestaan. ` +
        `Alleen de eerste ${remainingSlots} worden geüpload.`
      );
    }

    // Validate files
    const validFiles: File[] = [];
    for (const file of filesToProcess) {
      const error = validateFile(file);
      if (error) {
        opts.onError(error);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    // Create temporary preview entries
    const tempImages: ImageFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
    }));

    setImages(prev => [...prev, ...tempImages]);
    setError(null);

    // Upload files if onUpload is provided
    if (opts.onUpload) {
      setIsUploading(true);
      setUploadProgress(10);

      try {
        setUploadProgress(30);
        const result = await opts.onUpload(validFiles);
        setUploadProgress(80);

        // Update images with upload results
        setImages(prev => {
          const updatedImages = [...prev];
          
          // Remove temporary uploading images
          const nonTempImages = updatedImages.filter(img => !img.uploading);
          
          // Add successfully uploaded images
          const uploadedImages: ImageFile[] = result.images
            .filter(img => !img.error)
            .map((img, index) => ({
              id: Math.random().toString(36).substr(2, 9),
              preview: img.url,
              url: img.url,
              uploaded: true,
            }));

          return [...nonTempImages, ...uploadedImages];
        });

        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 1000);

        // Handle failed uploads
        const failedUploads = result.images.filter(img => img.error);
        if (failedUploads.length > 0) {
          console.error('Some images failed to upload:', failedUploads);
          opts.onError('Sommige afbeeldingen konden niet worden geüpload');
        }
      } catch (error) {
        console.error('Error uploading images:', error);
        setError(error instanceof Error ? error.message : 'Upload mislukt');
        opts.onError('Er is een fout opgetreden bij het uploaden');
        
        // Remove uploading images on error
        setImages(prev => prev.filter(img => !img.uploading));
      } finally {
        setIsUploading(false);
      }
    }

    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  }, [images, opts, validateFile]);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove?.preview && imageToRemove.preview.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    images.forEach(img => {
      if (img.preview && img.preview.startsWith('blob:')) {
        URL.revokeObjectURL(img.preview);
      }
    });
    setImages([]);
    setError(null);
    setUploadProgress(0);
  }, [images]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    images,
    previewUrls,
    isUploading,
    uploadProgress,
    error,
    handleFileSelect,
    removeImage,
    clearAll,
    triggerFileInput,
    fileInputRef,
  };
}