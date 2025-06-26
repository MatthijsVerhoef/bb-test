// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Get environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Debug logging (remove in production)
console.log('Cloudinary Config Check:', {
  cloudName: cloudName || 'NOT SET',
  apiKey: apiKey ? `${apiKey.substring(0, 6)}...` : 'NOT SET',
  apiSecret: apiSecret ? 'SET' : 'NOT SET',
});

// Configure Cloudinary
if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
} else {
  console.error('Cloudinary configuration incomplete!');
}

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  options?: {
    publicId?: string;
    transformation?: any[];
  }
): Promise<{
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
}> {
  // Validate configuration
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      `Cloudinary not configured. Check environment variables. ` +
      `Cloud name: ${cloudName ? 'Set' : 'Missing'}, ` +
      `API Key: ${apiKey ? 'Set' : 'Missing'}, ` +
      `API Secret: ${apiSecret ? 'Set' : 'Missing'}`
    );
  }

  return new Promise((resolve, reject) => {
    // Use upload_stream with promise
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        ...(options?.publicId && { public_id: options.publicId }),
        ...(options?.transformation && { transformation: options.transformation }),
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error(error.message || 'Failed to upload to Cloudinary'));
        } else if (result) {
          resolve({
            publicId: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
          });
        } else {
          reject(new Error('No result from Cloudinary upload'));
        }
      }
    );

    // Create a readable stream from buffer and pipe to upload stream
    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
}

// Alternative upload method using base64 (fallback)
export async function uploadToCloudinaryBase64(
  buffer: Buffer,
  folder: string,
  options?: {
    publicId?: string;
    transformation?: any[];
  }
) {
  // Validate configuration
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary configuration incomplete');
  }

  try {
    // Convert buffer to base64
    const base64 = buffer.toString('base64');
    const fileUri = `data:image/jpeg;base64,${base64}`;

    const result = await cloudinary.uploader.upload(fileUri, {
      folder,
      resource_type: 'auto',
      ...(options?.publicId && { public_id: options.publicId }),
      ...(options?.transformation && { transformation: options.transformation }),
    });

    return {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error: any) {
    console.error('Cloudinary base64 upload error:', error);
    throw new Error(error.message || 'Failed to upload to Cloudinary');
  }
}

export async function deleteFromCloudinary(publicId: string) {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary configuration incomplete');
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    throw new Error(error.message || 'Failed to delete from Cloudinary');
  }
}

export function extractPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }
  
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.(jpg|jpeg|png|gif|webp)$/i);
  return matches ? matches[1] : null;
}