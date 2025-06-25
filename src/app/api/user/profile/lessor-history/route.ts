import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
// import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const startTime = performance.now();
    
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;
    
    // logger.info(`Lessor History Request`, { userId, status, page, limit });
    
    // Build where clause for the query
    const whereClause: any = {
      OR: [
        {
          trailer: {
            ownerId: userId
          }
        },
        {
          lessorId: userId
        }
      ]
    };
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    // Execute both queries in parallel using transaction
    const [rentals, totalCount] = await prisma.$transaction([
      prisma.rental.findMany({
        where: whereClause,
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true,
          totalPrice: true,
          trailerId: true,
          renterId: true,
          lessorId: true,
          pickupLocation: true,
          returnLocation: true,
          serviceFee: true,
          insuranceFee: true,
          deliveryFee: true,
          securityDeposit: true,
          actualReturnDate: true,
          needsDelivery: true,
          specialNotes: true,
          cancellationReason: true,
          cancellationDate: true,
          
          // Select only needed trailer fields
          trailer: {
            select: {
              id: true,
              title: true,
              ownerId: true,
              type: true,
              pricePerDay: true,
              images: {
                take: 1,
                orderBy: {
                  order: 'asc'
                },
                select: {
                  url: true,
                  title: true
                }
              }
            }
          },
          
          // Select only needed renter fields
          renter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              profilePicture: true,
              email: true
            }
          },
          
          // Include lessor info
          lessor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { startDate: 'desc' }
        ],
        take: limit,
        skip: offset
      }),
      
      prisma.rental.count({
        where: whereClause
      })
    ]);
    
    // Transform data efficiently
    const formattedRentals = rentals.map(rental => ({
      id: rental.id,
      startDate: rental.startDate,
      endDate: rental.endDate,
      status: rental.status,
      totalPrice: rental.totalPrice,
      trailerId: rental.trailerId,
      trailerTitle: rental.trailer.title,
      trailerType: rental.trailer.type,
      trailerImage: rental.trailer.images[0]?.url || null,
      pickupLocation: rental.pickupLocation,
      dropoffLocation: rental.returnLocation,
      renter: rental.renter ? {
        id: rental.renter.id,
        firstName: rental.renter.firstName || '',
        lastName: rental.renter.lastName || '',
        phoneNumber: rental.renter.phone,
        email: rental.renter.email,
        profilePicture: rental.renter.profilePicture
      } : null,
      lessor: rental.lessor ? {
        id: rental.lessor.id,
        firstName: rental.lessor.firstName || '',
        lastName: rental.lessor.lastName || '',
        phoneNumber: rental.lessor.phone,
        email: rental.lessor.email
      } : null,
      renterId: rental.renterId,
      lessorId: rental.lessorId || rental.trailer.ownerId,
      // Additional fields that might be needed
      serviceFee: rental.serviceFee,
      insuranceFee: rental.insuranceFee,
      deliveryFee: rental.deliveryFee,
      securityDeposit: rental.securityDeposit,
      actualReturnDate: rental.actualReturnDate,
      needsDelivery: rental.needsDelivery,
      specialNotes: rental.specialNotes,
      cancellationReason: rental.cancellationReason,
      cancellationDate: rental.cancellationDate
    }));
    
    const executionTime = Math.round(performance.now() - startTime);
    
    // logger.info(`Lessor History Response`, {
    //   userId,
    //   rentalCount: rentals.length,
    //   totalCount,
    //   executionTime
    // });
    
    const response = NextResponse.json({
      rentals: formattedRentals,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
      _debug: process.env.NODE_ENV === 'development' ? {
        executionTime,
        userId,
        rentalCount: rentals.length
      } : undefined
    });
    
    // Set cache headers for better performance
    response.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');
    
    return response;
    
  } catch (error) {
    // logger.error('Error fetching lessor rental history', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch lessor rental history' },
      { status: 500 }
    );
  }
}