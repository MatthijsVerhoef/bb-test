// app/api/upload/profile-picture/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } from "@/lib/cloudinary";
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
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "File type not supported. Please upload JPEG, PNG, or WebP images",
        },
        { status: 400 }
      );
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get current user
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email as string,
      },
      select: {
        id: true,
        profilePicture: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let imageUrl: string;
    let publicId: string | null = null;

    // Check if Cloudinary is configured
    if (isCloudinaryConfigured) {
      console.log("Using Cloudinary for profile image storage");
      
      // Delete old profile picture from Cloudinary if it exists
      if (user.profilePicture && user.profilePicture.includes('cloudinary.com')) {
        const oldPublicId = extractPublicIdFromUrl(user.profilePicture);
        if (oldPublicId) {
          try {
            await deleteFromCloudinary(oldPublicId);
            console.log(`Deleted old profile picture: ${oldPublicId}`);
          } catch (error) {
            console.warn(`Failed to delete old profile picture: ${oldPublicId}`, error);
            // Continue with the upload even if deletion fails
          }
        }
      }

      // Upload new image to Cloudinary
      try {
        const uploadResult = await uploadToCloudinary(
          buffer,
          `profiles/${user.id}`, // Store in user-specific folder
          {
            transformation: [
              { width: 500, height: 500, crop: "limit" }, // Resize for better performance
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
      console.log("Cloudinary not configured, using local storage for profile image");
      // Use local storage if Cloudinary is not configured
      imageUrl = await saveToLocalStorage(buffer, file.name);
    }

    // Update user profile with new image URL
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        profilePicture: imageUrl,
      },
    });

    return NextResponse.json({
      message: "Profile picture uploaded successfully",
      url: imageUrl,
      ...(publicId && { publicId }),
      storageType: isCloudinaryConfigured ? "cloudinary" : "local",
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return NextResponse.json(
      { error: "Error uploading profile picture" },
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
  const relativePath = `/uploads/profiles/${fileName}`;
  const filePath = join(process.cwd(), "public", relativePath);

  // Write file to disk
  await writeFile(filePath, buffer);
  
  return relativePath;
}
