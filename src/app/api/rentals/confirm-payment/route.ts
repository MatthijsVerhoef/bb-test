// app/api/rentals/confirm-payment/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { rentalId, paymentIntentId } = await req.json();

    if (!rentalId || !paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Find the rental
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: { payment: true }
    });

    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    // Verify the user is the renter
    if (rental.renterId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update payment status
    if (rental.payment) {
      await prisma.payment.update({
        where: { id: rental.payment.id },
        data: {
          status: 'COMPLETED',
          paymentDate: new Date()
        }
      });
    }

    // Update rental status
    await prisma.rental.update({
      where: { id: rentalId },
      data: { status: 'CONFIRMED' }
    });

    // Create notifications
    await prisma.notification.create({
      data: {
        userId: rental.renterId,
        type: 'BOOKING',
        message: 'Your reservation has been confirmed. Payment completed successfully.',
        actionUrl: `/rentals/${rental.id}`
      }
    });

    await prisma.notification.create({
      data: {
        userId: rental.lessorId,
        type: 'BOOKING',
        message: 'You have a new confirmed reservation.',
        actionUrl: `/rentals/${rental.id}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}