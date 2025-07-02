// /app/api/create-payment-intent/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createTemporaryBlock } from '@/lib/utils/temporary-block';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Simple date validation and normalization
function normalizeDates(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set to noon to avoid timezone issues
  start.setHours(12, 0, 0, 0);
  end.setHours(12, 0, 0, 0);
  
  // If same day rental, extend end date by 1 day
  if (start.getTime() === end.getTime()) {
    end.setDate(end.getDate() + 1);
  }
  
  return { start, end };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency, metadata, reservationData } = body;
    
    // Get current user from session if available
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || `guest_${Date.now()}`;
    
    // Extract reservation details
    const { trailerId, startDate, endDate } = reservationData || {};
    
    if (!trailerId || !startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Missing required reservation details' 
      }, { status: 400 });
    }

    // Normalize dates
    const { start, end } = normalizeDates(startDate, endDate);

    // Quick availability check - only check if dates are blocked by others
    const existingBlocks = await prisma.blockedPeriod.findFirst({
      where: {
        trailerId,
        NOT: { userId },
        OR: [
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: start } }
            ]
          }
        ]
      }
    });

    if (existingBlocks) {
      return NextResponse.json({ 
        error: 'These dates are no longer available. Please choose different dates.' 
      }, { status: 400 });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency || 'eur',
      metadata: {
        trailerId,
        userId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create temporary block using your existing function
    try {
      const blockResult = await createTemporaryBlock(
        trailerId,
        start,
        end,
        userId,
        paymentIntent.id
      );
      
      if (!blockResult) {
        console.warn('Failed to create temporary block, but proceeding with payment');
      }
    } catch (err) {
      console.error('Error creating temporary block:', err);
      // Don't fail the payment intent creation
    }

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
    
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ 
      error: 'Failed to create payment intent' 
    }, { status: 500 });
  }
}