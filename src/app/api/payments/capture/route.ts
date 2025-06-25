// app/api/payments/capture/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

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

    // Check if user is an admin or lessor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'LESSOR')) {
      return NextResponse.json(
        { error: 'Unauthorized. Only owners or admins can capture payments' },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await req.json();
    const { rentalId, amount } = body;

    if (!rentalId) {
      return NextResponse.json(
        { error: 'Rental ID is required' },
        { status: 400 }
      );
    }

    // Find the rental and make sure it belongs to the current user (if not admin)
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        payment: true,
      }
    });

    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    // If user is a lessor, verify they own this trailer
    if (user.role === 'LESSOR' && rental.lessorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized. You do not own this rental' },
        { status: 403 }
      );
    }

    // Check if the rental is in the right state to capture payment
    if (rental.status !== 'COMPLETED' && rental.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cannot capture payment for a rental that is not active or completed' },
        { status: 400 }
      );
    }

    // Check if payment was already captured
    if (rental.payment?.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment has already been captured' },
        { status: 400 }
      );
    }

    if (!rental.payment || !rental.payment.externalTransactionId) {
      return NextResponse.json(
        { error: 'No payment found for this rental' },
        { status: 400 }
      );
    }

    // Create the capture amount in cents
    const captureAmount = amount ? Math.round(amount * 100) : undefined;

    // Capture the payment with Stripe
    const paymentIntent = await stripe.paymentIntents.capture(
      rental.payment.externalTransactionId,
      captureAmount ? { amount_to_capture: captureAmount } : undefined
    );

    // Update payment status in the database
    await prisma.payment.update({
      where: { id: rental.payment.id },
      data: {
        status: 'COMPLETED',
        paymentDate: new Date(),
      }
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Payment captured successfully',
      paymentIntentId: paymentIntent.id
    });
  } catch (error: any) {
    console.error('Error capturing payment:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: error.message || 'Invalid request to payment provider' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to capture payment' },
      { status: 500 }
    );
  }
}