// app/api/update-payment-status/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // Get the current authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await req.json();
    const { paymentIntentId, status } = body;

    if (!paymentIntentId || !status) {
      return NextResponse.json(
        { error: 'Payment intent ID and status are required' },
        { status: 400 }
      );
    }

    // Find the payment with this payment intent ID
    const payment = await prisma.payment.findFirst({
      where: {
        externalTransactionId: paymentIntentId,
      },
      include: {
        rental: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Map Stripe payment status to our payment status
    let paymentStatus;
    let rentalStatus;

    switch (status) {
      case 'succeeded':
        paymentStatus = 'COMPLETED';
        rentalStatus = 'CONFIRMED';
        break;
      case 'processing':
        paymentStatus = 'PENDING';
        rentalStatus = 'PENDING';
        break;
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        paymentStatus = 'PENDING';
        rentalStatus = 'PENDING';
        break;
      case 'canceled':
        paymentStatus = 'FAILED';
        rentalStatus = 'CANCELLED';
        break;
      default:
        paymentStatus = 'FAILED';
        rentalStatus = 'CANCELLED';
    }

    // Update the payment status
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: paymentStatus,
        paymentDate: status === 'succeeded' ? new Date() : undefined,
      },
    });

    // Update the rental status
    await prisma.rental.update({
      where: {
        id: payment.rental.id,
      },
      data: {
        status: rentalStatus,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}