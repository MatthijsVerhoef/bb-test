// app/api/reservation/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ReservationService } from '@/services/reservation.service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';
import { finalizeTemporaryBlock } from '@/lib/utils/temporary-block';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    // This endpoint can be called by webhook or by client after payment
    const body = await request.json();
    const { rentalId, paymentIntentId } = body;
    
    if (!rentalId || !paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing required fields: rentalId, paymentIntentId' },
        { status: 400 }
      );
    }

    // Verify the payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment has not been completed' },
        { status: 400 }
      );
    }

    // Confirm the reservation
    const reservation = await ReservationService.confirmReservation(
      rentalId,
      paymentIntentId
    );
    
    // Update the temporary block to a permanent one
    // This changes the reason from PAYMENT_INTENT:{id} to CONFIRMED_RENTAL:{id}
    // so it won't be accidentally removed later
    try {
      await finalizeTemporaryBlock(paymentIntentId, rentalId);
      console.log(`Successfully finalized calendar block for confirmed rental ${rentalId}`);
    } catch (blockError) {
      console.error('Error finalizing calendar block:', blockError);
      // Don't fail the reservation confirmation if block finalization fails
      // Instead, just log the error and continue
    }

    return NextResponse.json({ 
      success: true,
      reservation
    });
    
  } catch (error: any) {
    console.error('Error confirming reservation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm reservation' },
      { status: 500 }
    );
  }
}