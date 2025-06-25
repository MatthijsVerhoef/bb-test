// /app/api/cancel-payment-intent/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { removeTemporaryBlock } from '@/lib/utils/temporary-block';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { paymentIntentId } = body;
    
    if (!paymentIntentId) {
      return NextResponse.json({ 
        error: 'Payment intent ID is required' 
      }, { status: 400 });
    }

    console.log(`💳 [CANCEL-PAYMENT] Attempting to cancel payment intent: ${paymentIntentId}`);
    
    // First, try to remove the temporary blocks using the utility function
    try {
      const blockRemoved = await removeTemporaryBlock(paymentIntentId);
      if (blockRemoved) {
        console.log(`💳 [CANCEL-PAYMENT] Successfully removed calendar blocks for payment intent ${paymentIntentId}`);
      } else {
        console.log(`💳 [CANCEL-PAYMENT] No calendar blocks found for payment intent ${paymentIntentId}`);
      }
    } catch (blockError) {
      console.error('💳 [CANCEL-PAYMENT] Error removing calendar blocks:', blockError);
      // Don't fail the payment intent cancellation if removing blocks fails
      // Instead, just log the error and continue
    }

    // Then cancel the payment intent with Stripe
    try {
      const canceledIntent = await stripe.paymentIntents.cancel(paymentIntentId);
      
      console.log(`💳 [CANCEL-PAYMENT] Successfully canceled payment intent ${paymentIntentId} with status: ${canceledIntent.status}`);

      return NextResponse.json({ 
        success: true,
        status: canceledIntent.status
      }, { status: 200 });
      
    } catch (stripeError) {
      // Handle the case where the payment intent may have already been completed or canceled
      if (stripeError.code === 'payment_intent_unexpected_state') {
        console.log(`💳 [CANCEL-PAYMENT] Payment intent ${paymentIntentId} is in unexpected state (already processed/canceled)`);
        
        // Still try to clean up any remaining blocks
        try {
          await removeTemporaryBlock(paymentIntentId);
        } catch (cleanupError) {
          console.error('💳 [CANCEL-PAYMENT] Error during cleanup:', cleanupError);
        }
        
        return NextResponse.json({ 
          success: false,
          message: 'Payment intent could not be canceled - it may have already been processed or canceled'
        }, { status: 409 });
      }
      
      throw stripeError; // Re-throw other errors
    }
    
  } catch (error) {
    console.error('💳 [CANCEL-PAYMENT] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'An error occurred while canceling the payment intent' 
    }, { status: 500 });
  }
}