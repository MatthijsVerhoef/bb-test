// app/api/payments/cancel/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { removeTemporaryBlock } from '@/lib/utils/temporary-block';

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

    // Parse the request body
    const body = await req.json();
    const { 
      rentalId = null,  // Can cancel by rental ID
      paymentIntentId = null  // Or by payment intent ID
    } = body;

    if (!rentalId && !paymentIntentId) {
      return NextResponse.json(
        { error: 'Either rental ID or payment intent ID is required' },
        { status: 400 }
      );
    }

    // Find the rental and payment
    let rental;
    let payment;

    if (rentalId) {
      // Find rental by ID
      rental = await prisma.rental.findUnique({
        where: { id: rentalId },
        include: { payment: true }
      });
      
      if (!rental) {
        return NextResponse.json(
          { error: 'Rental not found' },
          { status: 404 }
        );
      }
      
      payment = rental.payment;
    } else if (paymentIntentId) {
      // Find payment by payment intent ID
      payment = await prisma.payment.findFirst({
        where: { externalTransactionId: paymentIntentId },
        include: { rental: true }
      });
      
      if (!payment) {
        console.log(`Payment not found for intent: ${paymentIntentId}`);
        // Instead of returning an error, just return success since the client is
        // trying to clean up a non-existent payment
        return NextResponse.json({ 
          success: true,
          message: 'No payment found to cancel' 
        });
      }
      
      rental = payment.rental;
    }

    // Verify the user is authorized (either the renter, lessor, or admin)
    if (rental) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
      });

      const isRenter = rental.renterId === session.user.id;
      const isLessor = rental.lessorId === session.user.id;
      const isAdmin = user?.role === 'ADMIN';

      if (!isRenter && !isLessor && !isAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized. You do not have permission to cancel this rental' },
          { status: 403 }
        );
      }
    }

    // Only try to cancel in Stripe if payment exists and has a transaction ID
    const paymentIntentToCancel = payment?.externalTransactionId || paymentIntentId;
    
    if (paymentIntentToCancel) {
      console.log(`🔓 [PAYMENT-CANCEL] Canceling payment intent and removing temporary blocks: ${paymentIntentToCancel}`);
      
      try {
        // First, remove any temporary blocks associated with this payment intent
        try {
          await removeTemporaryBlock(paymentIntentToCancel);
          console.log(`🔓 [PAYMENT-CANCEL] Successfully removed temporary blocks for payment intent: ${paymentIntentToCancel}`);
        } catch (blockError) {
          console.error(`🔓 [PAYMENT-CANCEL] Error removing temporary blocks:`, blockError);
          // Continue with payment cancellation even if block removal fails
        }
        
        // Only try to cancel in Stripe if the payment intent is in our database
        if (payment?.externalTransactionId) {
          // Cancel the payment with Stripe only if it's in a cancellable state
          // First check the payment status in Stripe
          const paymentIntent = await stripe.paymentIntents.retrieve(
            payment.externalTransactionId
          );
          
          // Only cancel if it's in a state that can be cancelled
          if (['requires_payment_method', 'requires_capture', 'requires_confirmation'].includes(paymentIntent.status)) {
            await stripe.paymentIntents.cancel(payment.externalTransactionId, {
              cancellation_reason: 'requested_by_customer',
            });
            console.log(`🔓 [PAYMENT-CANCEL] Cancelled payment intent in Stripe: ${payment.externalTransactionId}`);
          } else {
            console.log(`🔓 [PAYMENT-CANCEL] Payment intent ${payment.externalTransactionId} is in state ${paymentIntent.status} and cannot be cancelled`);
          }
        } else if (paymentIntentId) {
          // If we only have a payment intent ID but no payment record,
          // still try to cancel it in Stripe and remove any temporary blocks
          try {
            await stripe.paymentIntents.cancel(paymentIntentId, {
              cancellation_reason: 'requested_by_customer',
            });
            console.log(`🔓 [PAYMENT-CANCEL] Cancelled standalone payment intent in Stripe: ${paymentIntentId}`);
          } catch (stripeError: any) {
            console.log(`🔓 [PAYMENT-CANCEL] Error cancelling standalone payment intent: ${stripeError.message}`);
          }
        }
      } catch (stripeError: any) {
        // Don't fail if the payment intent couldn't be cancelled
        // (e.g., it was already cancelled or doesn't exist)
        console.log(`🔓 [PAYMENT-CANCEL] Error cancelling payment in Stripe: ${stripeError.message}`);
      }
    }

    // Update the payment status in our database if payment exists
    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
        }
      });
    }

    // Cancel the rental if it exists
    if (rental) {
      await prisma.rental.update({
        where: { id: rental.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: body.reason || 'Cancelled by user',
          cancellationDate: new Date(),
        }
      });
      
      console.log(`Cancelled rental ${rental.id} in database`);
    }

    return NextResponse.json({
      success: true,
      message: rental 
        ? 'Rental and payment cancelled successfully' 
        : 'Payment cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error cancelling payment:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      // This could be because the payment intent was already cancelled
      return NextResponse.json(
        { 
          success: true,
          message: 'Payment may already be cancelled or processed' 
        }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to cancel payment' },
      { status: 500 }
    );
  }
}