import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

// This handles POST requests to respond to a damage request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the damage report ID from params
    const { id: damageReportId } = await params;
    if (!damageReportId) {
      return NextResponse.json(
        { error: "Damage report ID is required" },
        { status: 400 }
      );
    }

    // Find the damage report and make sure it belongs to a rental the user is part of
    const damageReport = await prisma.damageReport.findUnique({
      where: {
        id: damageReportId,
      },
      include: {
        rental: {
          include: {
            trailer: {
              select: {
                id: true,
                title: true,
                userId: true,
              },
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!damageReport) {
      return NextResponse.json(
        { error: "Damage report not found" },
        { status: 404 }
      );
    }

    // Verify that the user is the renter of the trailer
    if (damageReport.rental.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to respond to this damage report" },
        { status: 403 }
      );
    }

    // Verify that the report is in PENDING status
    if (damageReport.status !== "PENDING") {
      return NextResponse.json(
        { error: "This damage report is no longer pending and cannot be updated" },
        { status: 400 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const response = formData.get("response") as string;
    const responseType = formData.get("responseType") as "ACCEPT" | "DISPUTE";
    const counterOffer = formData.get("counterOffer") as string;
    const responseNotes = formData.get("responseNotes") as string;
    const images = formData.getAll("images") as File[];

    // Validate required fields
    if (!responseType) {
      return NextResponse.json(
        { error: "Response type is required" },
        { status: 400 }
      );
    }

    // Process images if any
    const imageUrls: string[] = [];
    if (images.length > 0) {
      // Ensure the upload directory exists
      const uploadDir = join(process.cwd(), "public", "uploads", "damage-responses");
      await mkdir(uploadDir, { recursive: true });

      // Process each image
      for (const image of images) {
        const fileExtension = image.name.split(".").pop() || "jpg";
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = join(uploadDir, fileName);
        const fileBuffer = Buffer.from(await image.arrayBuffer());
        
        // Write the file to disk
        await writeFile(filePath, fileBuffer);
        
        // Add the relative URL to our list
        imageUrls.push(`/uploads/damage-responses/${fileName}`);
      }
    }

    // Update the damage report with the renter's response
    const updatedDamageReport = await prisma.damageReport.update({
      where: {
        id: damageReportId,
      },
      data: {
        status: responseType === "ACCEPT" ? "ACCEPTED" : "DISPUTED",
        renterResponse: response,
        renterResponseDate: new Date(),
        counterOfferAmount: counterOffer ? parseFloat(counterOffer) : null,
        renterResponseNotes: responseNotes || null,
        renterResponseImages: imageUrls.length > 0 ? imageUrls : undefined,
      },
    });

    // Create a notification for the lessor
    await prisma.notification.create({
      data: {
        userId: damageReport.rental.trailer.userId, // This is the lessor
        type: "DAMAGE",
        message: responseType === "ACCEPT"
          ? `De huurder heeft je schadeclaim voor ${damageReport.rental.trailer.title} geaccepteerd.`
          : `De huurder heeft bezwaar gemaakt tegen je schadeclaim voor ${damageReport.rental.trailer.title}.`,
        read: false,
        actionUrl: `/profiel?tab=lessor-rentals&damage=${damageReportId}`,
      },
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: responseType === "ACCEPT"
        ? "Damage claim accepted successfully"
        : "Damage claim disputed successfully",
      damageReport: updatedDamageReport,
    });
  } catch (error) {
    console.error("Error responding to damage report:", error);
    return NextResponse.json(
      { error: "Failed to process your response" },
      { status: 500 }
    );
  }
}