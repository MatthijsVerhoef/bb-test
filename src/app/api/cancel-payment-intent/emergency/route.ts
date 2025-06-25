// src/app/api/cancel-payment-intent/emergency/route.ts
// This is a lightweight endpoint specifically for beforeunload event handling
// It only removes blocks and doesn't do any other cleanup

import { NextResponse } from 'next/server';
import { removeTemporaryBlock } from '@/lib/utils/temporary-block';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { paymentIntentId } = body;
    
    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Missing paymentIntentId' }, { status: 400 });
    }
    
    console.log(`⚠️ [EMERGENCY-CANCEL] Received emergency cleanup request for payment intent: ${paymentIntentId}`);
    
    // Only remove blocks, no other operations
    try {
      const result = await removeTemporaryBlock(paymentIntentId);
      if (result) {
        console.log(`⚠️ [EMERGENCY-CANCEL] Successfully removed blocks for payment intent: ${paymentIntentId}`);
      } else {
        console.log(`⚠️ [EMERGENCY-CANCEL] No blocks found to remove for payment intent: ${paymentIntentId}`);
      }
    } catch (error) {
      console.error(`⚠️ [EMERGENCY-CANCEL] Error removing blocks: ${error}`);
      // Don't throw, just log the error and continue
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in emergency cancel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}