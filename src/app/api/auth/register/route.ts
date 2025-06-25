// /app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = uuidv4();

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        verificationToken,
        role: "USER",
      },
    });

    // Create user statistics record
    await prisma.userStats.create({
      data: {
        userId: newUser.id,
      },
    });

    // Create user preferences
    await prisma.userPreference.create({
      data: {
        userId: newUser.id,
      },
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    // Remove sensitive data from response
    const { password: _, verificationToken: __, ...userWithoutSensitiveData } = newUser;

    return NextResponse.json({
      message: "User registered successfully. Please verify your email.",
      user: userWithoutSensitiveData,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}