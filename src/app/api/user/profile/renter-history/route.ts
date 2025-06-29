// app/api/user/profile/renter-history/route.ts - Optimized version
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Cache the transformed results
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

export async function GET(request: Request) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Check cache first
    const cacheKey = `rentals:${userId}`;
    const cached = responseCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'private, max-age=30',
        }
      });
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const cursor = searchParams.get('cursor'); // Use cursor instead of page

    // Build filter conditions
    const where: any = {
      renterId: userId,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    // Optimized single query with selective joins
    const rentals = await prisma.rental.findMany({
      where,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        totalPrice: true,
        serviceFee: true,
        insuranceFee: true,
        deliveryFee: true,
        securityDeposit: true,
        pickupLocation: true,
        returnLocation: true,
        pickupTime: true,
        returnTime: true,
        actualReturnDate: true,
        needsDelivery: true,
        cancellationReason: true,
        cancellationDate: true,
        specialNotes: true,
        renterId: true,
        lessorId: true,
        trailerId: true,
        
        // Include trailer with first image only
        trailer: {
          select: {
            id: true,
            title: true,
            type: true,
            licensePlate: true,
            images: {
              select: {
                url: true,
              },
              take: 1,
              orderBy: { order: 'asc' }
            }
          }
        },
        
        // Include lessor info
        lessor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profilePicture: true,
          }
        },
        
        // Include payment status only
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            paymentMethod: true,
            paymentDate: true,
          }
        },
        
        // Count related items instead of fetching all
        _count: {
          select: {
            damageReports: true,
            insuranceClaims: true,
            rentalExtensions: true,
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // Group by status first
        { startDate: 'desc' }
      ],
      take: limit + 1, // Fetch one extra to know if there's a next page
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
    });

    // Check if there's a next page
    const hasNextPage = rentals.length > limit;
    const items = hasNextPage ? rentals.slice(0, -1) : rentals;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    // Transform the data efficiently
    const formattedRentals = items.map(rental => ({
      id: rental.id,
      startDate: rental.startDate,
      endDate: rental.endDate,
      status: rental.status,
      totalPrice: rental.totalPrice,
      trailerId: rental.trailerId,
      trailerTitle: rental.trailer.title,
      trailerImage: rental.trailer.images[0]?.url || null,
      pickupLocation: rental.pickupLocation,
      dropoffLocation: rental.returnLocation,
      lessor: rental.lessor ? {
        id: rental.lessor.id,
        firstName: rental.lessor.firstName || '',
        lastName: rental.lessor.lastName || '',
        phoneNumber: rental.lessor.phone,
        email: rental.lessor.email,
        profilePicture: rental.lessor.profilePicture
      } : null,
      serviceFee: rental.serviceFee,
      insuranceFee: rental.insuranceFee,
      deliveryFee: rental.deliveryFee,
      securityDeposit: rental.securityDeposit,
      actualReturnDate: rental.actualReturnDate,
      needsDelivery: rental.needsDelivery,
      specialNotes: rental.specialNotes,
      cancellationReason: rental.cancellationReason,
      cancellationDate: rental.cancellationDate,
      payment: rental.payment,
      hasReviews: false, // You can add a check here if needed
      counts: {
        damageReports: rental._count.damageReports,
        insuranceClaims: rental._count.insuranceClaims,
        rentalExtensions: rental._count.rentalExtensions,
      },
      renterId: rental.renterId,
      lessorId: rental.lessorId,
    }));

    const response = {
      rentals: formattedRentals,
      pagination: {
        hasNextPage,
        nextCursor,
      }
    };

    // Cache the response
    responseCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    // Clean old cache entries periodically
    if (responseCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of responseCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          responseCache.delete(key);
        }
      }
    }

    return NextResponse.json(response, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=30',
      }
    });

  } catch (error) {
    console.error('Error fetching renter rental history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental history' },
      { status: 500 }
    );
  }
}

// Companion function to fetch additional details when needed
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { rentalIds } = await request.json();

    if (!Array.isArray(rentalIds) || rentalIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid rental IDs' },
        { status: 400 }
      );
    }

    // Fetch detailed information for specific rentals
    const detailedInfo = await prisma.rental.findMany({
      where: {
        id: { in: rentalIds },
        renterId: session.user.id,
      },
      select: {
        id: true,
        damageReports: {
          select: {
            id: true,
            description: true,
            damageStatus: true,
            reportedById: true,
            createdAt: true,
          }
        },
        insuranceClaims: {
          select: {
            id: true,
            status: true,
            amount: true,
          }
        },
        pickupChecklistItems: {
          select: {
            id: true,
            itemName: true,
            checked: true,
            note: true,
          }
        },
        returnChecklistItems: {
          select: {
            id: true,
            itemName: true,
            checked: true,
            note: true,
          }
        },
        rentalExtensions: {
          select: {
            id: true,
            newEndDate: true,
            approved: true,
            additionalCost: true,
          }
        },
      }
    });

    const detailsMap = detailedInfo.reduce((acc, rental) => {
      acc[rental.id] = rental;
      return acc;
    }, {} as Record<string, typeof detailedInfo[0]>);

    return NextResponse.json({ details: detailsMap });

  } catch (error) {
    console.error('Error fetching rental details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental details' },
      { status: 500 }
    );
  }
}