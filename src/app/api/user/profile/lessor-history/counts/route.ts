import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
// import { logger } from '@/lib/logger';

// Simple in-memory cache for counts
const countsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds cache

export async function GET() {
  try {
    const startTime = performance.now();
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Check cache first
    const cached = countsCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // logger.debug('Returning cached counts', { userId });
      return NextResponse.json(cached.data);
    }
    
    // logger.info('Fetching fresh counts', { userId });
    
    // Single efficient aggregation query
    const rentalCounts = await prisma.rental.groupBy({
      by: ['status'],
      where: {
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
      },
      _count: {
        id: true
      }
    });
    
    // Initialize counts with all possible statuses
    const statusCounts: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      ACTIVE: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      LATE_RETURN: 0,
      DISPUTED: 0
    };
    
    // Fill in actual counts from query results
    rentalCounts.forEach(item => {
      if (item.status in statusCounts) {
        statusCounts[item.status] = item._count.id;
      }
    });
    
    // Calculate aggregated counts for UI tabs
    const result = {
      total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
      upcoming: statusCounts.PENDING + statusCounts.CONFIRMED,
      current: statusCounts.ACTIVE + statusCounts.LATE_RETURN + statusCounts.DISPUTED,
      past: statusCounts.COMPLETED + statusCounts.CANCELLED,
      detailed: statusCounts,
      _debug: process.env.NODE_ENV === 'development' ? {
        executionTime: Math.round(performance.now() - startTime),
        userId,
        countsFound: rentalCounts.length
      } : undefined
    };
    
    // Cache the result
    countsCache.set(userId, { data: result, timestamp: Date.now() });
    
    // Periodically clean old cache entries (10% chance)
    if (Math.random() < 0.1) {
      const now = Date.now();
      for (const [key, value] of countsCache.entries()) {
        if (now - value.timestamp > CACHE_TTL * 10) {
          countsCache.delete(key);
        }
      }
    }
    
    // logger.info('Counts fetched successfully', {
    //   userId,
    //   total: result.total,
    //   executionTime: result._debug?.executionTime
    // });
    
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    
    return response;
    
  } catch (error) {
    // logger.error('Error fetching lessor rental counts', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch lessor rental counts' },
      { status: 500 }
    );
  }
}