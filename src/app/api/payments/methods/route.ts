// app/api/payments/methods/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Get all payment methods for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to view payment methods' },
        { status: 401 }
      );
    }

    // Add cache control for this route to prevent duplicate requests
    const cacheKey = `payment-methods-${session.user.id}`;
    
    // Get the user with a single database query
    const user = await prisma.$transaction(async (tx) => {
      return tx.user.findUnique({
        where: { id: session.user.id },
        select: { stripeCustomerId: true }
      });
    });

    // If user doesn't have a Stripe customer ID yet, they have no payment methods
    if (!user?.stripeCustomerId) {
      // Return empty result with cache headers to prevent duplicate requests
      return NextResponse.json(
        { paymentMethods: [] },
        { 
          headers: {
            'Cache-Control': 'private, max-age=300',
            'X-Cache-Key': cacheKey
          }
        }
      );
    }

    // Use Promise.all to parallelize Stripe API calls
    const [paymentMethods, customer] = await Promise.all([
      // Fetch payment methods from Stripe
      stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      }),
      
      // Fetch the default payment method
      stripe.customers.retrieve(user.stripeCustomerId)
    ]);
    
    const defaultPaymentMethodId = typeof customer !== 'string' ? customer.invoice_settings?.default_payment_method : null;

    // Format the payment methods
    const formattedPaymentMethods = paymentMethods.data.map(method => ({
      id: method.id,
      type: method.type,
      card: method.card ? {
        brand: method.card.brand,
        last4: method.card.last4,
        expMonth: method.card.exp_month,
        expYear: method.card.exp_year,
      } : undefined,
      billing_details: method.billing_details,
      created: method.created,
      isDefault: method.id === defaultPaymentMethodId,
    }));

    // Parse any cache-busting parameter from URL
    const url = new URL(request.url);
    const cacheBuster = url.searchParams.get('_cb');
    
    // Return with minimal caching when we have a cache buster
    // This allows forcing a refresh when a payment method is added
    return NextResponse.json(
      { 
        paymentMethods: formattedPaymentMethods,
        _cacheBuster: cacheBuster // Include in response to verify it's working
      },
      {
        headers: {
          // Shorter cache time (30 seconds) to reduce wait times after adding a payment method
          'Cache-Control': cacheBuster ? 'no-cache' : 'private, max-age=30',
          'X-Cache-Key': cacheKey
        }
      }
    );
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching payment methods' },
      { status: 500 }
    );
  }
}