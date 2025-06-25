// app/api/user/billing-address/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define validation schema
const billingAddressSchema = z.object({
  company: z.string().optional(),
  address: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  vatNumber: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user billing details from database
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email as string,
      },
      select: {
        companyName: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        vatNumber: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Map user data to billing address format
    const billingAddress = {
      company: user.companyName || "",
      address: user.address || "",
      city: user.city || "",
      postalCode: user.postalCode || "",
      country: user.country || "",
      vatNumber: user.vatNumber || "",
    };

    return NextResponse.json(billingAddress);
  } catch (error) {
    console.error("Error fetching billing address:", error);
    return NextResponse.json(
      { error: "Error fetching billing address" },
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

    // Validate request body
    const validationResult = billingAddressSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Update user billing details in database
    await prisma.user.update({
      where: {
        email: session.user.email as string,
      },
      data: {
        companyName: validatedData.company,
        address: validatedData.address,
        city: validatedData.city,
        postalCode: validatedData.postalCode,
        country: validatedData.country,
        vatNumber: validatedData.vatNumber,
      },
    });

    return NextResponse.json({
      message: "Billing address updated successfully",
    });
  } catch (error) {
    console.error("Error updating billing address:", error);
    return NextResponse.json(
      { error: "Error updating billing address" },
      { status: 500 }
    );
  }
}
