// app/api/bookings/by-payment/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export async function GET(request: Request) {
  try {
    // Get the current authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the payment intent ID from the URL
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Find the payment with the given payment intent ID
    const payment = await prisma.payment.findFirst({
      where: {
        externalTransactionId: paymentIntentId,
      },
      include: {
        rental: {
          include: {
            trailer: {
              select: {
                title: true,
              },
            },
            renter: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              }
            }
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Make sure the user has access to this booking
    if (payment.rental.renterId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Helper function to format time
    const formatTimeFromDate = (date: Date | null): string => {
      if (!date) return '12:00';
      return format(date, 'HH:mm');
    };

    // Format the booking data
    const booking = {
      trailerId: payment.rental.trailerId,
      startDate: payment.rental.startDate.toISOString(),
      endDate: payment.rental.endDate.toISOString(),
      pickupTime: payment.rental.pickupTime 
        ? formatTimeFromDate(payment.rental.pickupTime)
        : '12:00',
      returnTime: payment.rental.returnTime
        ? formatTimeFromDate(payment.rental.returnTime)
        : '12:00',
      needsDelivery: payment.rental.needsDelivery,
      deliveryAddress: payment.rental.pickupLocation || '',
      totalPrice: payment.amount,
      firstName: payment.rental.renter.firstName || '',
      lastName: payment.rental.renter.lastName || '',
      email: payment.rental.renter.email || '',
      phone: payment.rental.renter.phone || '',
      driversLicense: '', // For security, we don't return this
      trailerTitle: payment.rental.trailer.title,
    };

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Error retrieving booking by payment:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve booking details' },
      { status: 500 }
    );
  }
}