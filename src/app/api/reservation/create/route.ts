import { NextRequest, NextResponse } from 'next/server';
import { ReservationService } from '@/services/reservation.service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PaymentMethod } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { PricingService } from '@/services/pricing.service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to create a reservation' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const requiredFields = [
      'trailerId', 'startDate', 'endDate', 'pickupTime', 'returnTime',
      'totalPrice', 'serviceFee', 'paymentMethod', 'paymentIntentId', 'termsAccepted'
    ];
    
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const trailer = await prisma.trailer.findUnique({
      where: { id: body.trailerId },
      select: {
        pricePerDay: true,
        pricePerWeek: true,
        pricePerMonth: true,
        deliveryFee: true,
        securityDeposit: true,
      },
    });

    if (!trailer) {
      return NextResponse.json(
        { error: 'Trailer not found' },
        { status: 404 }
      );
    }

    const expectedPricing = PricingService.calculatePricing({
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      pricePerDay: trailer.pricePerDay,
      pricePerWeek: trailer.pricePerWeek,
      pricePerMonth: trailer.pricePerMonth,
      needsDelivery: body.needsDelivery || false,
      deliveryFee: trailer.deliveryFee,
      securityDeposit: trailer.securityDeposit,
      insuranceFee: body.insuranceFee || 0,
      discountAmount: body.discountAmount || 0,
    });

    const expectedServiceFee = expectedPricing.renterServiceFee;
    const serviceFeeDeviation = Math.abs(body.serviceFee - expectedServiceFee);
    
    if (serviceFeeDeviation > 0.01) { 
      console.error('Service fee mismatch:', {
        submitted: body.serviceFee,
        expected: expectedServiceFee,
        deviation: serviceFeeDeviation,
      });
      return NextResponse.json(
        { 
          error: 'Invalid service fee calculation',
          details: {
            submitted: body.serviceFee,
            expected: expectedServiceFee,
          }
        },
        { status: 400 }
      );
    }

    const expectedTotal = expectedPricing.totalRenterPrice;
    const totalDeviation = Math.abs(body.totalPrice - expectedTotal);
    
    if (totalDeviation > 0.01) {
      console.error('Total price mismatch:', {
        submitted: body.totalPrice,
        expected: expectedTotal,
        deviation: totalDeviation,
        breakdown: {
          basePrice: expectedPricing.basePrice,
          serviceFee: expectedPricing.renterServiceFee,
          deliveryFee: expectedPricing.deliveryFee,
          insuranceFee: expectedPricing.insuranceFee,
          discountAmount: expectedPricing.discountAmount,
        }
      });
      return NextResponse.json(
        { 
          error: 'Invalid total price calculation',
          details: {
            submitted: body.totalPrice,
            expected: expectedTotal,
          }
        },
        { status: 400 }
      );
    }

    const reservation = await ReservationService.createReservation({
      ...body,
      renterId: session.user.id,
      paymentMethod: body.paymentMethod as PaymentMethod,
      totalPrice: expectedPricing.totalRenterPrice,
      serviceFee: expectedPricing.renterServiceFee,
      lessorEarnings: expectedPricing.lessorEarnings,
      platformFee: expectedPricing.lessorPlatformFee,
    });

    return NextResponse.json({
      success: true,
      reservation,
      pricing: {
        breakdown: PricingService.getPricingBreakdown(expectedPricing),
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create reservation' },
      { status: 500 }
    );
  }
}