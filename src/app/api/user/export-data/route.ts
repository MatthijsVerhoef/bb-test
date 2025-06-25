// app/api/user/export-data/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as archiver from "archiver";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email as string,
      },
      include: {
        listings: true,
        rentals: true,
        reviews: true,
        favorites: true,
        wallet: {
          include: {
            transactions: true,
          },
        },
        preferences: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Create temp directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "user-data-"));
    
    // Sanitize user data (remove sensitive fields)
    const sanitizedUser = {
      ...user,
      password: undefined,
      verificationToken: undefined,
      resetPasswordToken: undefined,
      resetTokenExpiry: undefined,
    };
    
    // Write user data to JSON files
    fs.writeFileSync(
      path.join(tempDir, "user.json"),
      JSON.stringify(sanitizedUser, null, 2)
    );
    
    // Create zip file
    const zipPath = path.join(tempDir, "user-data.zip");
    const output = fs.createWriteStream(zipPath);
    const archive = archiver.create("zip", { zlib: { level: 9 } });
    
    archive.pipe(output);
    archive.directory(tempDir, false);
    await archive.finalize();
    
    // Read zip file into buffer
    const buffer = fs.readFileSync(zipPath);
    
    // Clean up temp files
    fs.unlinkSync(zipPath);
    fs.rmdirSync(tempDir, { recursive: true });
    
    // Create response with zip file
    const response = new NextResponse(buffer);
    response.headers.set("Content-Type", "application/zip");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="user-data-${new Date().toISOString().split("T")[0]}.zip"`
    );
    
    return response;
  } catch (error) {
    console.error("Error exporting user data:", error);
    return NextResponse.json(
      { error: "Error exporting user data" },
      { status: 500 }
    );
  }
}