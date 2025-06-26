import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { email: token.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        role: true,
        isVerified: true,
        memberSince: true,
        city: true,
        country: true,
        phone: true,
        address: true,
        postalCode: true,
        bio: true,
        lastActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update last active timestamp asynchronously
    prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    }).catch(console.error);

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching user data" },
      { status: 500 }
    );
  }
}