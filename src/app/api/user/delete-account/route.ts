// app/api/user/delete-account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // In a real application, you might want to:
    // 1. Archive the account instead of deleting it
    // 2. Cancel all active rentals
    // 3. Notify connected users
    // 4. Handle payment information deletion
    
    // Delete user account
    await prisma.user.delete({
      where: {
        email: session.user.email as string,
      },
    });
    
    // Return success response
    return NextResponse.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Error deleting account" },
      { status: 500 }
    );
  }
}