// app/api/upload/trailer-images/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

// Check if Cloudinary is configured
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Check file types and sizes
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizePerFile = 10 * 1024 * 1024; // 10MB per file
    const maxTotalFiles = 10; // Maximum 10 images per upload

    if (files.length > maxTotalFiles) {
      return NextResponse.json(
        { error: `Maximum ${maxTotalFiles} images allowed per upload` },
        { status: 400 }
      );
    }

    // Validate all files first
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error: `File ${file.name} is not supported. Please upload JPEG, PNG, or WebP images`,
          },
          { status: 400 }
        );
      }

      if (file.size > maxSizePerFile) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 10MB per image` },
          { status: 400 }
        );
      }
    }

    const uploadedImages = [];

    // Process each file
    for (const file of files) {
      try {
        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        let imageUrl: string;
        let publicId: string | null = null;

        // Check if Cloudinary is configured
        if (isCloudinaryConfigured) {
          console.log("Using Cloudinary for trailer image storage");
          
          // Upload to Cloudinary
          try {
            const uploadResult = await uploadToCloudinary(
              buffer,
              `trailers/${session.user.id}/${Date.now()}`, // Store in user-specific folder with timestamp
              {
                transformation: [
                  { width: 1200, height: 800, crop: "limit" }, // Resize for better performance
                  { quality: "auto" }, // Automatic quality optimization
                ],
              }
            );
            
            imageUrl = uploadResult.url;
            publicId = uploadResult.publicId;
          } catch (cloudinaryError) {
            console.error("Cloudinary upload failed, falling back to local storage:", cloudinaryError);
            // Fall back to local storage if Cloudinary fails
            imageUrl = await saveToLocalStorage(buffer, file.name);
          }
        } else {
          console.log("Cloudinary not configured, using local storage for trailer images");
          // Use local storage if Cloudinary is not configured
          imageUrl = await saveToLocalStorage(buffer, file.name);
        }

        uploadedImages.push({
          url: imageUrl,
          name: file.name,
          size: file.size,
          ...(publicId && { publicId }),
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        // Continue with other files even if one fails
        uploadedImages.push({
          error: `Failed to upload ${file.name}`,
          name: file.name,
        });
      }
    }

    // Check if at least one image was uploaded successfully
    const successfulUploads = uploadedImages.filter(img => !img.error);
    
    if (successfulUploads.length === 0) {
      return NextResponse.json(
        { error: "No images were uploaded successfully" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: `Successfully uploaded ${successfulUploads.length} of ${files.length} images`,
      images: uploadedImages,
      storageType: isCloudinaryConfigured ? "cloudinary" : "local",
    });
  } catch (error) {
    console.error("Error uploading trailer images:", error);
    return NextResponse.json(
      { error: "Error uploading trailer images" },
      { status: 500 }
    );
  }
}

/**
 * Save file to local storage as fallback
 */
async function saveToLocalStorage(buffer: Buffer, originalFileName: string): Promise<string> {
  // Create unique filename
  const fileExtension = originalFileName.split(".").pop() || 'jpg';
  const fileName = `${uuidv4()}.${fileExtension}`;

  // Save path - relative to public directory
  const relativePath = `/uploads/trailers/${fileName}`;
  const filePath = join(process.cwd(), "public", relativePath);

  // Write file to disk
  await writeFile(filePath, buffer);
  
  return relativePath;
}