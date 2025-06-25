import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { writeFile } from 'fs/promises';

// Handles image upload for blog cover images
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Check file type
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }
    
    // Generate unique filename
    const fileExtension = fileType.split('/')[1];
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public/uploads/blogs');
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch (err) {
      console.error('Error creating directory:', err);
      return NextResponse.json(
        { error: 'Error creating upload directory' },
        { status: 500 }
      );
    }
    
    // Save the file
    const filePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    
    await writeFile(filePath, buffer);
    
    // Return the file URL
    const fileUrl = `/uploads/blogs/${fileName}`;
    
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Error uploading image' },
      { status: 500 }
    );
  }
}