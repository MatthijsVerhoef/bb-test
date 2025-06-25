// /app/api/create-payment-intent/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createTemporaryBlock } from '@/lib/utils/temporary-block';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    // PERFORMANCE ISSUE: The Stripe API call is slow and blocking the page load
    // This endpoint is being called during initial page render which causes a poor UX
    // 
    // TODO: Optimization strategies:
    // 1. Implement caching for payment intents with similar parameters
    // 2. Consider adding a timeout for Stripe API calls and handle gracefully
    // 3. Move this API call to be triggered by user action rather than on page load
    // 4. Implement proper error handling and retries for Stripe API failures
    // 5. Consider using Stripe's test mode during development to speed up responses
    
    const body = await request.json();
    const { amount, currency, metadata, reservation, rentalDetails } = body;
    
    // The client might send reservation data in different formats, handle both possibilities
    const reservationData = reservation || rentalDetails || body.reservationData;
    
    console.log('💳 [PAYMENT-INTENT] Request body received:', JSON.stringify(body, null, 2));
    
    // Get current user from session if available
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'guest'; // Default to 'guest' if no user
    
    // REMOVED: Authentication check that was blocking guest checkout
    // Now allowing both authenticated and guest users to create payment intents
    
    console.log('💳 [PAYMENT-INTENT] Creating payment intent for user:', userId);

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Stripe expects amounts in cents
      currency: currency || 'eur',
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    console.log('💳 [PAYMENT-INTENT] Created payment intent:', paymentIntent.id);

    // First try to get reservation data from the dedicated reservation fields
    let trailerId = null;
    let startDate = null;
    let endDate = null;

    // Try to extract from reservationData if it exists
    if (reservationData) {
      // Client structure could be different, try to extract the trailerId from different formats
      // rentalDetails might have the trailerId directly or it might be inside a trailer property
      trailerId = reservationData.trailerId || 
                 (reservationData.trailer && reservationData.trailer.id);
                     
      // Similarly, start and end dates could be stored in different ways
      startDate = reservationData.startDate || 
                 (reservationData.dateRange && reservationData.dateRange.startDate);
                     
      endDate = reservationData.endDate || 
               (reservationData.dateRange && reservationData.dateRange.endDate);
    }
    
    // If we don't have the data yet, try to extract from metadata
    if ((!trailerId || !startDate || !endDate) && metadata) {
      console.log('💳 [PAYMENT-INTENT] Attempting to extract reservation details from metadata');
      trailerId = trailerId || metadata.trailerId;
      startDate = startDate || metadata.startDate;
      endDate = endDate || metadata.endDate;
    }
    
    console.log('💳 [PAYMENT-INTENT] Extracted reservation data:');
    console.log(JSON.stringify({
      trailerId,
      startDate,
      endDate,
      userId: userId,
      paymentIntentId: paymentIntent.id
    }, null, 2));
    
    if (trailerId && startDate && endDate) {
      try {
        console.log(`💳 [PAYMENT-INTENT] Attempting to block calendar for trailer ${trailerId} during payment process`);
        
        // Parse dates, ensuring we have valid Date objects
        let startDateTime, endDateTime;
        
        try {
          startDateTime = new Date(startDate);
          endDateTime = new Date(endDate);
          
          // Check if dates are valid
          if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            throw new Error('Invalid date format');
          }
        } catch (dateError) {
          console.error('💳 [PAYMENT-INTENT] ERROR: Invalid date format:', dateError);
          console.log(`💳 [PAYMENT-INTENT] - Raw startDate: ${startDate}`);
          console.log(`💳 [PAYMENT-INTENT] - Raw endDate: ${endDate}`);
          throw new Error('Could not parse rental dates');
        }
        
        // Log date information for debugging
        console.log('💳 [PAYMENT-INTENT] Date analysis:');
        console.log(`💳 [PAYMENT-INTENT] - Raw startDate: ${startDate}`);
        console.log(`💳 [PAYMENT-INTENT] - Raw endDate: ${endDate}`);
        console.log(`💳 [PAYMENT-INTENT] - Parsed startDate: ${startDateTime.toISOString()}`);
        console.log(`💳 [PAYMENT-INTENT] - Parsed endDate: ${endDateTime.toISOString()}`);
        
        // Detect if we have equal dates from the frontend, which likely means a 1-day rental
        const isOneDayRental = startDateTime.getTime() === endDateTime.getTime() || 
                           endDateTime.getTime() - startDateTime.getTime() < 86400000;
                           
        console.log(`💳 [PAYMENT-INTENT] Is this a one-day rental? ${isOneDayRental}`);
        
        // Normalize dates to noon to avoid timezone issues
        const localStartDate = new Date(startDateTime);
        localStartDate.setHours(12, 0, 0, 0);
        
        // For end date, if it's the same as start date, add 1 day
        const localEndDate = new Date(endDateTime);
        
        if (isOneDayRental) {
          // If it's a one-day rental, set the end date to the next day
          localEndDate.setDate(localEndDate.getDate() + 1);
          console.log(`💳 [PAYMENT-INTENT] Adjusted end date for one-day rental: ${localEndDate.toISOString()}`);
        }
        
        localEndDate.setHours(12, 0, 0, 0);
        
        console.log(`💳 [PAYMENT-INTENT] - Normalized startDate: ${localStartDate.toISOString()}`);
        console.log(`💳 [PAYMENT-INTENT] - Normalized endDate: ${localEndDate.toISOString()}`);
        
        // Check if dates make sense
        const now = new Date();
        if (localStartDate < now) {
          console.warn(`💳 [PAYMENT-INTENT] WARNING: Start date is in the past: ${localStartDate.toISOString()}`);
        }
        
        // Additional check even after adjustments
        if (localEndDate <= localStartDate) {
          console.error(`💳 [PAYMENT-INTENT] ERROR: End date must be after start date even after adjustments`);
          console.log(`💳 [PAYMENT-INTENT] Attempting to fix by adding one day to end date`);
          
          // Last resort fix - add one day to end date
          localEndDate.setDate(localEndDate.getDate() + 1);
          console.log(`💳 [PAYMENT-INTENT] Fixed end date: ${localEndDate.toISOString()}`);
          
          if (localEndDate <= localStartDate) {
            throw new Error('Could not fix date range issue');
          }
        }
        
        // First, try to create the block
        let blockResult = await createTemporaryBlock(
          trailerId,
          localStartDate,
          localEndDate,
          userId,
          paymentIntent.id
        );
        
        // If first attempt fails, try once more with exactly the same parameters
        if (!blockResult) {
          console.log(`💳 [PAYMENT-INTENT] First attempt to create block failed, retrying...`);
          blockResult = await createTemporaryBlock(
            trailerId,
            localStartDate,
            localEndDate,
            userId,
            paymentIntent.id
          );
        }
        
        if (blockResult) {
          console.log(`💳 [PAYMENT-INTENT] SUCCESS: Blocked calendar for trailer ${trailerId} from ${localStartDate.toDateString()} to ${localEndDate.toDateString()}, block ID: ${blockResult.id}`);
        } else {
          // Check if dates are already blocked for other users
          const otherUserBlocks = await prisma.blockedPeriod.findMany({
            where: {
              trailerId,
              NOT: {
                userId: userId
              },
              OR: [
                { startDate: { gte: localStartDate, lte: localEndDate } },
                { endDate: { gte: localStartDate, lte: localEndDate } },
                { 
                  startDate: { lte: localStartDate },
                  endDate: { gte: localEndDate }
                }
              ]
            }
          });
          
          if (otherUserBlocks.length > 0) {
            console.error(`💳 [PAYMENT-INTENT] ERROR: Dates are already blocked by another user (${otherUserBlocks.length} blocks)`);
            return NextResponse.json({ 
              error: 'These dates are no longer available. Please choose different dates.' 
            }, { status: 400 });
          } else {
            // If not blocked by other users, we can proceed - the user might already have a payment intent for this
            console.warn(`💳 [PAYMENT-INTENT] WARNING: Failed to create temporary block for trailer ${trailerId}, but proceeding with payment intent creation`);
          }
        }
      } catch (blockError) {
        console.error('💳 [PAYMENT-INTENT] ERROR: Failed to block trailer calendar:', blockError);
        
        // Don't automatically fail - check if dates are available for this user
        try {
          const otherUserBlocks = await prisma.blockedPeriod.findMany({
            where: {
              trailerId,
              NOT: {
                userId: userId
              },
              OR: [
                { startDate: { gte: localStartDate, lte: localEndDate } },
                { endDate: { gte: localStartDate, lte: localEndDate } },
                { 
                  startDate: { lte: localStartDate },
                  endDate: { gte: localEndDate }
                }
              ]
            }
          });
          
          if (otherUserBlocks.length > 0) {
            return NextResponse.json({ 
              error: 'These dates are no longer available. Please choose different dates.' 
            }, { status: 400 });
          } else {
            // If not blocked by other users, we can proceed
            console.warn(`💳 [PAYMENT-INTENT] WARNING: Error during block creation, but proceeding with payment intent creation`);
          }
        } catch (error) {
          console.error('💳 [PAYMENT-INTENT] ERROR: Failed to check if dates are available:', error);
          // Only fail in case of serious errors
          return NextResponse.json({ 
            error: 'Failed to check date availability. Please try again.' 
          }, { status: 500 });
        }
      }
    } else {
      console.log('💳 [PAYMENT-INTENT] Missing required fields for calendar blocking:');
      console.log('💳 [PAYMENT-INTENT] - trailerId:', trailerId || 'missing');
      console.log('💳 [PAYMENT-INTENT] - startDate:', startDate || 'missing');
      console.log('💳 [PAYMENT-INTENT] - endDate:', endDate || 'missing');
      console.log('💳 [PAYMENT-INTENT] Request body:', JSON.stringify(body, null, 2));
      
      // Fail the request if we don't have the necessary data
      return NextResponse.json({ 
        error: 'Missing required reservation details' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id // IMPORTANT: Include this for proper cancellation
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ 
      error: 'An error occurred while creating the payment intent' 
    }, { status: 500 });
  }
}