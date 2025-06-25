// app/api/user/deactivate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // In a production environment, you might want to:
    // 1. Add a 'isActive' field to the User model to track account status
    // 2. Handle active rentals or listings
    // 3. Send notification emails
    
    // For now, we'll update a field to indicate the account is deactivated
    // We'll use the existing 'isVerified' field temporarily to demonstrate functionality
    await prisma.user.update({
      where: {
        email: session.user.email as string,
      },
      data: {
        isVerified: false, // Using this as a temporary deactivation status
      },
    });
    
    // Return success response
    return NextResponse.json({
      message: "Account deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating account:", error);
    return NextResponse.json(
      { error: "Error deactivating account" },
      { status: 500 }
    );
  }
}