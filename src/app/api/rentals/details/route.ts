// app/api/rentals/details/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get the current authenticated user - run this in parallel with parsing parameters
    const sessionPromise = getServerSession(authOptions);
    
    // Parse parameters
    const url = new URL(request.url);
    const rentalId = url.searchParams.get('rentalId');
    let paymentIntent = url.searchParams.get('paymentIntent');
    
    // Handle Stripe's client_secret format if present
    if (!paymentIntent) {
      const clientSecret = url.searchParams.get('payment_intent_client_secret');
      if (clientSecret) {
        paymentIntent = clientSecret.split('_secret_')[0];
      }
    }
    
    if (!rentalId && !paymentIntent) {
      return NextResponse.json(
        { error: 'Either rentalId or paymentIntent is required' },
        { status: 400 }
      );
    }
    
    // Prepare query options - we'll reuse this for both query paths
    const includeOptions = {
      trailer: {
        select: {
          id: true,
          title: true,
          city: true,
          pricePerDay: true,
          images: {
            take: 1,
            select: { url: true },
          },
        },
      },
      payment: true
    };
    
    // Start fetching the rental data right away
    let rentalPromise;
    
    if (rentalId) {
      rentalPromise = prisma.rental.findUnique({
        where: { id: rentalId },
        include: includeOptions
      });
    } else if (paymentIntent) {
      rentalPromise = prisma.rental.findFirst({
        where: {
          payment: {
            externalTransactionId: paymentIntent
          }
        },
        include: includeOptions
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }
    
    // Wait for both promises to resolve
    const [session, rental] = await Promise.all([sessionPromise, rentalPromise]);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }
    
    // Check if the current user is allowed to access this rental
    if (rental.renterId !== session.user.id && rental.lessorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to view this rental' },
        { status: 403 }
      );
    }
    
    // Return rental data
    return NextResponse.json(rental);
  } catch (error) {
    console.error('Error fetching rental details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental details' },
      { status: 500 }
    );
  }
}