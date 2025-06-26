import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { DamageStatus, RentalStatus } from "@prisma/client";

// Type for damage request payload
interface DamageRequestPayload {
  description: string;
  damageStatus: DamageStatus;
  photoUrls: string[];
  repairCost?: number;
  repairNotes?: string;
}

/*
 * POST /api/rentals/[id]/damage-request
 * 
 * Creates a new damage report for a rental
 * Only lessor can create damage reports for their own rentals
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get rental ID from URL params
    const { id: rentalId } = await params;

    // Validate rental ID
    if (!rentalId) {
      return NextResponse.json(
        { error: "Rental ID is required" },
        { status: 400 }
      );
    }

    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the user ID from the session
    const userId = session.user.id;

    // Find the rental to ensure it exists and belongs to this lessor
    const rental = await prisma.rental.findUnique({
      where: { 
        id: rentalId,
      },
      include: {
        trailer: true,
      },
    });

    // Check if rental exists
    if (!rental) {
      return NextResponse.json(
        { error: "Rental not found" },
        { status: 404 }
      );
    }

    // Check if user is the lessor of this rental
    if (rental.lessorId !== userId) {
      return NextResponse.json(
        { error: "You are not authorized to create damage reports for this rental" },
        { status: 403 }
      );
    }

    // Parse the request body
    const { description, damageStatus, photoUrls, repairCost, repairNotes } = await request.json() as DamageRequestPayload;

    // Validate required fields
    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    // Create damage report transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the damage report
      const damageReport = await tx.damageReport.create({
        data: {
          description,
          damageStatus: damageStatus || DamageStatus.MINOR,
          photoUrls: photoUrls || [],
          repairCost,
          repairNotes,
          resolved: false,
          rental: {
            connect: { id: rentalId }
          },
          trailer: {
            connect: { id: rental.trailerId }
          },
          reportedBy: {
            connect: { id: userId }
          }
        },
      });

      // Create notification for the renter
      const notification = await tx.notification.create({
        data: {
          message: `Schade gemeld voor verhuring van ${rental.trailer.title}. Bekijk en reageer op het schaderapport.`,
          type: "BOOKING",
          read: false,
          actionUrl: `/profiel?tab=history&damage=${damageReport.id}`,
          user: {
            connect: { id: rental.renterId }
          }
        }
      });

      // Update rental status to DISPUTED if it was ACTIVE
      if (rental.status === RentalStatus.ACTIVE) {
        await tx.rental.update({
          where: { id: rentalId },
          data: {
            status: RentalStatus.DISPUTED
          }
        });
      }

      return { damageReport, notification };
    });

    // Return the created damage report
    return NextResponse.json({
      message: "Damage report created successfully",
      damageReport: result.damageReport
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating damage report:", error);
    return NextResponse.json(
      { error: "Failed to create damage report" },
      { status: 500 }
    );
  }
}

/*
 * GET /api/rentals/[id]/damage-request
 * 
 * Retrieves all damage reports for a rental
 * Both lessor and renter can view damage reports for their rentals
 */
export async function GET(
  request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get rental ID from URL params
    const {id: rentalId} = await params;

    // Validate rental ID
    if (!rentalId) {
      return NextResponse.json(
        { error: "Rental ID is required" },
        { status: 400 }
      );
    }

    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the user ID from the session
    const userId = session.user.id;

    // Find the rental to ensure it exists and user is authorized
    const rental = await prisma.rental.findUnique({
      where: { 
        id: rentalId,
      }
    });

    // Check if rental exists
    if (!rental) {
      return NextResponse.json(
        { error: "Rental not found" },
        { status: 404 }
      );
    }

    // Check if user is the lessor or renter of this rental
    if (rental.lessorId !== userId && rental.renterId !== userId) {
      return NextResponse.json(
        { error: "You are not authorized to view damage reports for this rental" },
        { status: 403 }
      );
    }

    // Get all damage reports for this rental
    const damageReports = await prisma.damageReport.findMany({
      where: {
        rentalId: rentalId
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        insuranceClaims: true
      }
    });

    // Return the damage reports
    return NextResponse.json({
      damageReports
    });

  } catch (error) {
    console.error("Error retrieving damage reports:", error);
    return NextResponse.json(
      { error: "Failed to retrieve damage reports" },
      { status: 500 }
    );
  }
}