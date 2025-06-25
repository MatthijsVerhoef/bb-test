// app/api/reservation/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ReservationService } from '@/services/reservation.service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to cancel a reservation' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { rentalId, reason } = body;
    
    if (!rentalId) {
      return NextResponse.json(
        { error: 'Missing required field: rentalId' },
        { status: 400 }
      );
    }

    // Verify the user owns this rental
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      select: { renterId: true, lessorId: true }
    });

    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    // Only the renter or lessor can cancel the reservation
    if (rental.renterId !== session.user.id && rental.lessorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to cancel this reservation' },
        { status: 403 }
      );
    }

    // Cancel the reservation
    const cancellation = await ReservationService.cancelReservation(
      rentalId,
      reason || 'No reason provided',
      session.user.id
    );

    return NextResponse.json({ 
      success: true,
      cancellation
    });
    
  } catch (error: any) {
    console.error('Error cancelling reservation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel reservation' },
      { status: 500 }
    );
  }
}