// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

// Check if environment variables are properly set
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('Cloudinary environment variables are not properly set!', {
    CLOUDINARY_CLOUD_NAME: cloudName ? 'Set' : 'Missing',
    CLOUDINARY_API_KEY: apiKey ? 'Set' : 'Missing',
    CLOUDINARY_API_SECRET: apiSecret ? 'Set' : 'Missing',
  });
}

// Initialize Cloudinary with environment variables
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

/**
 * Upload a file buffer to Cloudinary
 * @param buffer - The file buffer to upload
 * @param folder - The folder to upload to
 * @param options - Additional upload options
 * @returns The upload result
 */
export async function uploadToCloudinary(
  buffer: Buffer, 
  folder: string,
  options?: {
    publicId?: string;
    transformation?: any[];
  }
) {
  // Validate Cloudinary config
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary configuration is incomplete. Check your environment variables.');
  }

  // Convert buffer to base64 data URI
  const base64 = buffer.toString('base64');
  const fileUri = `data:image/jpeg;base64,${base64}`;
  
  // Set upload options
  const uploadOptions = {
    folder,
    resource_type: 'image',
    ...(options?.publicId && { public_id: options.publicId }),
    ...(options?.transformation && { transformation: options.transformation }),
  };

  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileUri, uploadOptions);
    return {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    if (error instanceof Error) {
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    } else {
      throw new Error('Failed to upload image to Cloudinary');
    }
  }
}

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 */
export async function deleteFromCloudinary(publicId: string) {
  // Validate Cloudinary config
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary configuration is incomplete. Check your environment variables.');
  }
  
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    if (error instanceof Error) {
      throw new Error(`Cloudinary deletion failed: ${error.message}`);
    } else {
      throw new Error('Failed to delete image from Cloudinary');
    }
  }
}

/**
 * Extract Cloudinary public ID from URL
 * @param url - Cloudinary URL
 * @returns Public ID or null if not a Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  // Extract public ID from URL pattern: .../upload/[folder]/[public_id].[extension]
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.(jpg|jpeg|png|gif|webp)$/i);
  return matches ? matches[1] : null;
}