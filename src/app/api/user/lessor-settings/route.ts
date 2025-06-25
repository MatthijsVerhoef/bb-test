import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const lessorSettingsSchema = z.object({
  autoApproval: z.object({
    enabled: z.boolean(),
    minimumRating: z.number().min(3).max(5).nullable(), // Made nullable
    minimumRentals: z.number().min(0),
    verifiedUsersOnly: z.boolean(),
  }),
  rentalSettings: z.object({
    minRentalDuration: z.number().min(1),
    maxRentalDuration: z.number().min(1),
    securityDepositPercentage: z.number().min(0).max(100),
  }),
  cancellationPolicy: z.enum(["flexible", "moderate", "strict", "custom"]),
  customCancellationText: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has LESSOR role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "LESSOR" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Not a lessor" }, { status: 403 });
    }

    // Get lessor settings
    const settings = await prisma.lessorSettings.findUnique({
      where: { userId: session.user.id },
    });

    // If no settings exist, return defaults
    if (!settings) {
      return NextResponse.json({
        autoApproval: {
          enabled: false,
          minimumRating: null, // Changed to null by default
          minimumRentals: 3,
          verifiedUsersOnly: true,
        },
        rentalSettings: {
          minRentalDuration: 1,
          maxRentalDuration: 30,
          securityDepositPercentage: 20,
        },
        cancellationPolicy: "moderate",
        customCancellationText: "",
      });
    }

    // Transform database format to API format
    return NextResponse.json({
      autoApproval: {
        enabled: settings.autoApprovalEnabled,
        minimumRating: settings.autoApprovalMinRating,
        minimumRentals: settings.autoApprovalMinRentals,
        verifiedUsersOnly: settings.autoApprovalVerifiedOnly,
      },
      rentalSettings: {
        minRentalDuration: settings.defaultMinRentalDuration,
        maxRentalDuration: settings.defaultMaxRentalDuration,
        securityDepositPercentage: settings.defaultSecurityDeposit,
      },
      cancellationPolicy: settings.cancellationPolicy,
      customCancellationText: settings.customCancellationText || "",
    });
  } catch (error) {
    console.error("Error fetching lessor settings:", error);
    return NextResponse.json(
      { error: "Error fetching lessor settings" },
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

    // Check if user has LESSOR role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "LESSOR" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Not a lessor" }, { status: 403 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = lessorSettingsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Upsert lessor settings
    const settings = await prisma.lessorSettings.upsert({
      where: { userId: session.user.id },
      update: {
        autoApprovalEnabled: data.autoApproval.enabled,
        autoApprovalMinRating: data.autoApproval.minimumRating,
        autoApprovalMinRentals: data.autoApproval.minimumRentals,
        autoApprovalVerifiedOnly: data.autoApproval.verifiedUsersOnly,
        defaultMinRentalDuration: data.rentalSettings.minRentalDuration,
        defaultMaxRentalDuration: data.rentalSettings.maxRentalDuration,
        defaultSecurityDeposit: data.rentalSettings.securityDepositPercentage,
        cancellationPolicy: data.cancellationPolicy,
        customCancellationText: data.cancellationPolicy === "custom" ? data.customCancellationText : null,
      },
      create: {
        userId: session.user.id,
        autoApprovalEnabled: data.autoApproval.enabled,
        autoApprovalMinRating: data.autoApproval.minimumRating,
        autoApprovalMinRentals: data.autoApproval.minimumRentals,
        autoApprovalVerifiedOnly: data.autoApproval.verifiedUsersOnly,
        defaultMinRentalDuration: data.rentalSettings.minRentalDuration,
        defaultMaxRentalDuration: data.rentalSettings.maxRentalDuration,
        defaultSecurityDeposit: data.rentalSettings.securityDepositPercentage,
        cancellationPolicy: data.cancellationPolicy,
        customCancellationText: data.cancellationPolicy === "custom" ? data.customCancellationText : null,
      },
    });

    return NextResponse.json({
      message: "Lessor settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Error updating lessor settings:", error);
    return NextResponse.json(
      { error: "Error updating lessor settings" },
      { status: 500 }
    );
  }
}