// app/api/user/profile/lessor-history/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Cache configuration
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (shorter than dashboard for more real-time updates)
const cache = new Map<string, { data: any; timestamp: number }>();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Check cache first
    const cacheKey = `lessor-history-${userId}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Fetch rentals with all necessary data in a single query
    const rentals = await prisma.rental.findMany({
      where: { lessorId: userId },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        totalPrice: true,
        trailerId: true,
        pickupLocation: true,
        returnLocation: true,
        pickupTime: true,
        returnTime: true,
        serviceFee: true,
        insuranceFee: true,
        deliveryFee: true,
        securityDeposit: true,
        actualReturnDate: true,
        needsDelivery: true,
        specialNotes: true,
        cancellationReason: true,
        cancellationDate: true,
        lessorId: true,
        renterId: true,
        createdAt: true,
        updatedAt: true,
        trailer: {
          select: {
            id: true,
            title: true,
            type: true,
            licensePlate: true,
            images: {
              select: { 
                url: true,
                type: true,
              },
              take: 1,
              orderBy: { order: 'asc' },
            },
          },
        },
        renter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            profilePicture: true,
            isVerified: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            paymentMethod: true,
            paymentDate: true,
          },
        },
        damageReports: {
          select: {
            id: true,
            description: true,
            damageStatus: true,
            repairCost: true,
            reportedById: true,
            createdAt: true,
          },
        },
        insuranceClaims: {
          select: {
            id: true,
            status: true,
            amount: true,
          },
        },
        rentalExtensions: {
          select: {
            id: true,
            newEndDate: true,
            approved: true,
            additionalCost: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    // Get counts in parallel with a more efficient query
    const countsByStatus = await prisma.rental.groupBy({
      by: ['status'],
      where: { lessorId: userId },
      _count: { _all: true },
    });

    // Process counts
    const counts = {
      upcoming: 0,
      current: 0,
      past: 0,
    };

    countsByStatus.forEach(({ status, _count }) => {
      if (status === 'PENDING' || status === 'CONFIRMED') {
        counts.upcoming += _count._all;
      } else if (status === 'ACTIVE' || status === 'LATE_RETURN' || status === 'DISPUTED') {
        counts.current += _count._all;
      } else if (status === 'COMPLETED' || status === 'CANCELLED') {
        counts.past += _count._all;
      }
    });

    // Format rentals for frontend
    const formattedRentals = rentals.map(rental => ({
      ...rental,
      trailerTitle: rental.trailer.title,
      trailerImage: rental.trailer.images[0]?.url || null,
      renter: rental.renter,
    }));

    const responseData = {
      rentals: formattedRentals,
      counts,
      lastUpdated: new Date().toISOString(),
    };

    // Update cache
    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    if (cache.size > 100) {
      const now = Date.now();
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION * 2) {
          cache.delete(key);
        }
      }
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching lessor history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental history' },
      { status: 500 }
    );
  }
}

// Separate endpoint for counts only (for quick updates)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get counts only
    const countsByStatus = await prisma.rental.groupBy({
      by: ['status'],
      where: { lessorId: userId },
      _count: { _all: true },
    });

    const counts = {
      upcoming: 0,
      current: 0,
      past: 0,
    };

    countsByStatus.forEach(({ status, _count }) => {
      if (status === 'PENDING' || status === 'CONFIRMED') {
        counts.upcoming += _count._all;
      } else if (status === 'ACTIVE' || status === 'LATE_RETURN' || status === 'DISPUTED') {
        counts.current += _count._all;
      } else if (status === 'COMPLETED' || status === 'CANCELLED') {
        counts.past += _count._all;
      }
    });

    return NextResponse.json(counts);
  } catch (error) {
    console.error('Error fetching lessor counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch counts' },
      { status: 500 }
    );
  }
}