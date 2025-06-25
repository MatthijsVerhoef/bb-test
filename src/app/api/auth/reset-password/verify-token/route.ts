// /app/api/auth/reset-password/verify-token/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find user with this reset token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { isValid: false, error: "Invalid or expired token" },
        { status: 200 } // Use 200 to avoid revealing token existence in case of security probing
      );
    }

    return NextResponse.json({
      isValid: true,
      email: user.email.replace(/(.{3})(.*)(?=@)/, "$1***"), // Partially mask email for security
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { isValid: false, error: "An error occurred during token verification" },
      { status: 500 }
    );
  }
}