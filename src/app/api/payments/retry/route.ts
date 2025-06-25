// app/api/payments/retry/route.ts
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

    // Parse the request body
    const body = await req.json();
    const { rentalId } = body;

    if (!rentalId) {
      return NextResponse.json(
        { error: 'Rental ID is required' },
        { status: 400 }
      );
    }

    // Fetch the rental with payment details
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        payment: true,
        trailer: {
          include: {
            owner: {
              select: {
                stripeAccountId: true
              }
            }
          }
        }
      }
    });

    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    // Ensure the user owns this rental
    if (rental.renterId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this rental' },
        { status: 403 }
      );
    }

    // Only allow retrying payment for PENDING or CANCELLED rentals
    if (rental.status !== 'PENDING' && rental.status !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot retry payment for this rental status' },
        { status: 400 }
      );
    }

    // Check if there's an existing completed payment
    if (rental.payment?.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment has already been completed for this rental' },
        { status: 400 }
      );
    }

    // Calculate amount in cents for Stripe
    const amountInCents = Math.round(rental.totalPrice * 100);

    // Define payment method types (popular in the Netherlands)
    const paymentMethodTypes = ['ideal', 'card', 'bancontact', 'sofort'];
    if (amountInCents <= 1000000) {
      paymentMethodTypes.push('sepa_debit');
    }

    // Create payment intent params
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: 'eur',
      capture_method: 'automatic',
      payment_method_types: paymentMethodTypes,
      metadata: {
        trailerId: rental.trailerId,
        renterId: rental.renterId,
        rentalId: rental.id,
        startDate: rental.startDate.toISOString(),
        endDate: rental.endDate.toISOString(),
        retry: 'true'
      }
    };

    // If the owner has a Stripe Connect account, use it
    const hasConnectedAccount = rental.trailer.owner?.stripeAccountId;
    
    if (hasConnectedAccount) {
      // Calculate platform fee (e.g., 15%)
      const platformFeePercentage = 15;
      const platformFee = Math.round((amountInCents * platformFeePercentage) / 100);
      
      paymentIntentParams.application_fee_amount = platformFee;
      paymentIntentParams.transfer_data = {
        destination: rental.trailer.owner.stripeAccountId,
      };
    }

    // Create a new payment intent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
    console.log(`Created PaymentIntent ${paymentIntent.id} for rental retry ${rentalId}`);

    // Update rental status to PENDING if it was CANCELLED
    if (rental.status === 'CANCELLED') {
      await prisma.rental.update({
        where: { id: rental.id },
        data: { status: 'PENDING' }
      });
    }

    // Create a new payment record or update existing one
    let payment;
    if (rental.payment) {
      payment = await prisma.payment.update({
        where: { id: rental.payment.id },
        data: {
          status: 'PENDING',
          externalTransactionId: paymentIntent.id,
          updatedAt: new Date()
        }
      });
    } else {
      payment = await prisma.payment.create({
        data: {
          rentalId: rental.id,
          amount: rental.totalPrice,
          currency: 'EUR',
          status: 'PENDING',
          paymentMethod: 'CARD',
          externalTransactionId: paymentIntent.id
        }
      });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      rental: {
        id: rental.id
      }
    });
  } catch (error) {
    console.error('Error retrying payment:', error);
    return NextResponse.json(
      { error: 'Failed to retry payment' },
      { status: 500 }
    );
  }
}