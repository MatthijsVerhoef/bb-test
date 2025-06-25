import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// app/api/user/security-preferences/route.ts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For demo purposes, returning default security preferences
    // In a real app, these would be stored in the database
    return NextResponse.json({
      twoFactorAuth: false,
      loginNotifications: true,
      requireAuthForPayments: true,
      rememberDevices: true,
      deviceHistory: true,
    });
  } catch (error) {
    console.error("Error fetching security preferences:", error);
    return NextResponse.json(
      { error: "Error fetching security preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // In a real app, you would save these preferences to the database
    // For demo purposes, we'll just return success
    return NextResponse.json({
      message: "Security preferences updated successfully",
    });
  } catch (error) {
    console.error("Error updating security preferences:", error);
    return NextResponse.json(
      { error: "Error updating security preferences" },
      { status: 500 }
    );
  }
}
