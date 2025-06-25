// app/api/upload/damage-photos/route.ts
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
    const rentalId = formData.get("rentalId") as string;

    if (!rentalId) {
      return NextResponse.json({ error: "Rental ID is required" }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Check file types and sizes
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizePerFile = 5 * 1024 * 1024; // 5MB per file
    const maxTotalFiles = 3; // Maximum 3 images per damage report

    if (files.length > maxTotalFiles) {
      return NextResponse.json(
        { error: `Maximum ${maxTotalFiles} images allowed per damage report` },
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
          { error: `File ${file.name} is too large. Maximum size is 5MB per image` },
          { status: 400 }
        );
      }
    }

    const uploadedImages = [];
    const successfulUploads = [];

    // Process each file
    for (const file of files) {
      try {
        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        let imageUrl: string;
        let publicId: string | null = null;

        console.log(`Processing file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

        // Skip Cloudinary if not configured and use local storage directly
        if (!isCloudinaryConfigured) {
          console.log("Cloudinary not configured, using local storage for damage report images");
          imageUrl = await saveToLocalStorage(buffer, file.name);
        } else {
          console.log("Using Cloudinary for damage report image storage");
          
          try {
            // Upload to Cloudinary
            const uploadResult = await uploadToCloudinary(
              buffer,
              `damage_reports/${rentalId}`, // Store in rental-specific folder
              {
                transformation: [
                  { width: 1200, height: 800, crop: "limit" }, // Resize for better performance
                  { quality: "auto" }, // Automatic quality optimization
                ],
              }
            );
            
            console.log("Cloudinary upload successful:", uploadResult);
            imageUrl = uploadResult.url;
            publicId = uploadResult.publicId;
          } catch (cloudinaryError) {
            console.error("Cloudinary upload failed:", cloudinaryError);
            
            // Always fall back to local storage if Cloudinary fails
            console.log("Falling back to local storage");
            imageUrl = await saveToLocalStorage(buffer, file.name);
          }
        }

        const uploadResult = {
          url: imageUrl,
          name: file.name,
          size: file.size,
          ...(publicId && { publicId }),
        };
        
        uploadedImages.push(uploadResult);
        successfulUploads.push(uploadResult);
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        // Continue with other files even if one fails
        uploadedImages.push({
          error: `Failed to upload ${file.name}`,
          name: file.name,
        });
      }
    }

    if (successfulUploads.length === 0) {
      console.error("No images were uploaded successfully. Details:", uploadedImages);
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
    console.error("Error uploading damage report images:", error);
    return NextResponse.json(
      { error: "Error uploading damage report images" },
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
  const uploadDir = join(process.cwd(), "public", "uploads", "damage_reports");
  const relativePath = `/uploads/damage_reports/${fileName}`;
  const filePath = join(process.cwd(), "public", relativePath);

  // Ensure the directory exists
  try {
    const { mkdir } = require('fs/promises');
    await mkdir(uploadDir, { recursive: true });
    console.log("Created or verified damage_reports directory:", uploadDir);
  } catch (error) {
    console.error("Error creating damage_reports directory:", error);
    // Continue anyway, the writeFile might still work
  }

  // Write file to disk
  try {
    await writeFile(filePath, buffer);
    console.log("Successfully wrote file to:", filePath);
    return relativePath;
  } catch (error) {
    console.error("Error writing file:", error);
    throw error;
  }
}