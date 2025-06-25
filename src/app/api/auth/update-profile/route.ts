// app/api/auth/update-profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define validation schema
const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
  companyName: z.string().optional(),
  kvkNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  languagePreference: z.string().optional(),
  profilePicture: z.string().optional(),
});

// Add POST method that works the same as PUT for compatibility
export async function POST(request: NextRequest) {
  // Simply defer to the PUT implementation
  return await PUT(request);
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Update user profile in database
    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email as string,
      },
      data: validatedData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        profilePicture: true,
        bio: true,
        companyName: true,
        kvkNumber: true,
        vatNumber: true,
        isVerified: true,
        languagePreference: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Error updating profile" },
      { status: 500 }
    );
  }
}
