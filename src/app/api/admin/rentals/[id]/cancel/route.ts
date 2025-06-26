// src/app/api/admin/rentals/[id]/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Await params to get the id
    const { id: rentalId } = await params;

    if (!rentalId) {
      return NextResponse.json(
        { error: 'Rental ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    // Fetch the rental
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        renter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        lessor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        trailer: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    // Check if rental can be cancelled (based on status)
    const cancellableStatuses = ['PENDING', 'CONFIRMED'];
    if (!cancellableStatuses.includes(rental.status)) {
      return NextResponse.json(
        { error: `Cannot cancel rental in ${rental.status} status` },
        { status: 400 }
      );
    }

    // Format admin info for notification
    const adminName = `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim();
    const adminReason = `Door admin (${adminName}): ${reason}`;

    // Update the rental status
    const updatedRental = await prisma.rental.update({
      where: { id: rentalId },
      data: {
        status: 'CANCELLED',
        cancellationReason: adminReason,
        cancellationDate: new Date(),
      },
    });

    // Create notifications for both renter and lessor
    const adminCancelMsg = `Verhuring ${rentalId.substring(0, 8)} is geannuleerd door een beheerder. Reden: ${reason}`;

    // Create batch transaction for both notifications
    await prisma.$transaction([
      // Notification for renter
      prisma.notification.create({
        data: {
          userId: rental.renterId,
          message: adminCancelMsg,
          type: 'BOOKING',
          read: false,
          actionUrl: `/rental/${rentalId}`,
        },
      }),
      // Notification for lessor
      prisma.notification.create({
        data: {
          userId: rental.lessorId,
          message: adminCancelMsg,
          type: 'BOOKING',
          read: false,
          actionUrl: `/rental/${rentalId}`,
        },
      }),
    ]);

    // Return success response
    return NextResponse.json({
      success: true,
      rental: updatedRental,
    });

  } catch (error) {
    console.error('Error cancelling rental as admin:', error);
    return NextResponse.json(
      { error: 'Failed to cancel rental' },
      { status: 500 }
    );
  }
}