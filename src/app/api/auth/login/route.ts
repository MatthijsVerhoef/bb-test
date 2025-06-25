import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
          profilePicture: true,
        },
      });

      if (!user) {
        return { success: false, error: "User not found" };
      }
      
      // Check if user account is verified
      if (!user.isVerified) {
        return { success: false, error: "Account not verified" };
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return { success: false, error: "Invalid credentials" };
      }

      await Promise.all([
        tx.user.update({
          where: { id: user.id },
          data: {
            lastLogin: new Date(),
            lastActive: new Date(),
          },
        }),
        tx.loginHistory.create({
          data: {
            userId: user.id,
            successful: true,
            ipAddress: request.headers.get("x-forwarded-for") || null,
            userAgent: request.headers.get("user-agent") || null,
          },
        }),
      ]);

      return { success: true, user };
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    const user = result.user!;

    // Create JWT token
    const token = await encode({
      token: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
      },
      secret: process.env.NEXTAUTH_SECRET!,
    });

    const { password: _, ...userWithoutPassword } = user;

    const cookieStore = await cookies();
    cookieStore.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({
      user: userWithoutPassword,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}