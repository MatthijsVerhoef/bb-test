// src/app/api/admin/rentals/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Valid status transitions for admin - more permissive than regular user
const ADMIN_VALID_TRANSITIONS = {
  'PENDING': ['CONFIRMED', 'CANCELLED', 'ACTIVE'],
  'CONFIRMED': ['ACTIVE', 'CANCELLED', 'PENDING'],
  'ACTIVE': ['COMPLETED', 'LATE_RETURN', 'DISPUTED', 'CANCELLED'],
  'LATE_RETURN': ['COMPLETED', 'DISPUTED', 'ACTIVE'],
  'DISPUTED': ['COMPLETED', 'ACTIVE', 'CANCELLED'],
  'CANCELLED': ['PENDING', 'CONFIRMED'], 
  'COMPLETED': ['ACTIVE', 'DISPUTED'] // Allow reopening completed rentals (admin only)
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Get rental ID from params
    const rentalId = params.id;
    if (!rentalId) {
      return NextResponse.json(
        { error: 'Rental ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status, note } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
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
          },
        },
        lessor: {
          select: {
            id: true,
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

    // Validate status transition for admin (using more permissive transitions)
    if (!ADMIN_VALID_TRANSITIONS[rental.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${rental.status} to ${status}` },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
    };

    // Add a note if provided
    if (note) {
      // Format the note to include timestamp and admin info
      const timestamp = new Date().toISOString().substr(0, 10);
      const adminInfo = `Admin (${session.user.firstName || ''} ${session.user.lastName || ''})`.trim();
      const formattedNote = `${timestamp} ${adminInfo}: ${note}`;
      
      // Set the special notes
      updateData.specialNotes = formattedNote;
    }

    // Add status-specific fields
    if (status === 'CANCELLED') {
      updateData.cancellationDate = new Date();
      updateData.cancellationReason = note || 'Cancelled by admin';
    } else if (status === 'COMPLETED') {
      updateData.actualReturnDate = new Date();
    } else if ((status === 'PENDING' || status === 'CONFIRMED') && rental.status === 'CANCELLED') {
      // If reactivating a cancelled rental, clear the cancellation data
      updateData.cancellationDate = null;
      updateData.cancellationReason = null;
    }

    // Update the rental
    const updatedRental = await prisma.rental.update({
      where: { id: rentalId },
      data: updateData,
    });

    // Map status to Dutch for notifications
    const dutchStatusMap: Record<string, string> = {
      'PENDING': 'In afwachting',
      'CONFIRMED': 'Bevestigd',
      'ACTIVE': 'Actief',
      'CANCELLED': 'Geannuleerd',
      'COMPLETED': 'Voltooid',
      'LATE_RETURN': 'Verlate teruggave',
      'DISPUTED': 'In geschil'
    };
    
    const dutchStatus = dutchStatusMap[status] || status;
    
    // Create notifications for both renter and lessor
    const adminMsg = `Verhuring ${rentalId.substring(0, 8)} status is bijgewerkt naar "${dutchStatus}" door beheerder${note ? ": " + note : ''}`;
    
    // Create batch transaction for both notifications
    await prisma.$transaction([
      // Notification for renter
      prisma.notification.create({
        data: {
          userId: rental.renterId,
          message: adminMsg,
          type: 'BOOKING',
          read: false,
          actionUrl: `/rental/${rentalId}`,
        },
      }),
      // Notification for lessor
      prisma.notification.create({
        data: {
          userId: rental.lessorId,
          message: adminMsg,
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
    console.error('Error updating rental status as admin:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the rental status' },
      { status: 500 }
    );
  }
}