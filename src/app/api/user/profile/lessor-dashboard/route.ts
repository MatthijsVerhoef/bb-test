import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

export async function GET(request: Request) {
  console.time('Lessor Dashboard Total Time');

  try {
    console.time('Session Fetch');
    const session = await getServerSession(authOptions);
    console.timeEnd('Session Fetch');

    if (!session?.user) {
      console.timeEnd('Lessor Dashboard Total Time');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Check cache first
    const cacheKey = `lessor-dashboard-${userId}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Returning cached dashboard data');
      console.timeEnd('Lessor Dashboard Total Time');
      return NextResponse.json(cached.data);
    }

    const currentDate = new Date();
    const lastMonth = subMonths(currentDate, 1);
    const startOfLastMonth = startOfMonth(lastMonth);
    const endOfLastMonth = endOfMonth(lastMonth);

    console.time('Database Transaction');
    
    // Execute all queries in parallel
    const [
      userStats,
      trailerStats,
      currentMonthRentals,
      lastMonthRevenue,
      topTrailersWithRevenue,
      upcomingRentals,
      mostViewedTrailers,
      utilizationData
    ] = await Promise.all([
      // 1. User Stats
      prisma.userStats.upsert({
        where: { userId },
        create: {
          userId,
          totalRentals: 0,
          totalIncome: 0,
          totalSpent: 0,
          cancelledRentals: 0,
          completedRentals: 0,
        },
        update: {},
      }),

      // 2. Trailer Stats - Combined query
      prisma.$queryRaw<{
        totalTrailers: bigint;
        activeTrailers: bigint;
        maintenanceCount: bigint;
        overdueCount: bigint;
        avgPrice: number | null;
      }[]>`
        SELECT 
          COUNT(DISTINCT id) as totalTrailers,
          COUNT(DISTINCT CASE WHEN status = 'ACTIVE' THEN id END) as activeTrailers,
          COUNT(DISTINCT CASE WHEN status = 'MAINTENANCE' THEN id END) as maintenanceCount,
          COUNT(DISTINCT CASE WHEN nextMaintenance < ${currentDate} THEN id END) as overdueCount,
          AVG(pricePerDay) as avgPrice
        FROM Trailer
        WHERE ownerId = ${userId}
      `,

      // 3. Current Month Rentals
      prisma.rental.findMany({
        where: {
          lessorId: userId,
          startDate: {
            gte: startOfMonth(currentDate),
            lte: endOfMonth(currentDate),
          },
        },
        select: {
          id: true,
          totalPrice: true,
          startDate: true,
          endDate: true,
          status: true,
          trailer: {
            select: { id: true, title: true },
          },
        },
      }),

      // 4. Last Month Revenue
      prisma.rental.aggregate({
        where: {
          lessorId: userId,
          startDate: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { totalPrice: true },
        _count: { _all: true },
      }),

      // 5. Top Performing Trailers with Revenue
      prisma.$queryRaw<{
        id: string;
        title: string;
        rentalCount: bigint;
        totalRevenue: number;
      }[]>`
        SELECT 
          t.id,
          t.title,
          COUNT(r.id) as rentalCount,
          COALESCE(SUM(r.totalPrice), 0) as totalRevenue
        FROM Trailer t
        LEFT JOIN Rental r ON t.id = r.trailerId AND r.status = 'COMPLETED'
        WHERE t.ownerId = ${userId}
        GROUP BY t.id, t.title
        ORDER BY rentalCount DESC
        LIMIT 5
      `,

      // 6. Upcoming Rentals
      prisma.rental.findMany({
        where: {
          lessorId: userId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          startDate: { gte: currentDate },
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          totalPrice: true,
          trailer: {
            select: {
              title: true,
              images: {
                take: 1,
                select: { url: true },
              },
            },
          },
          renter: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { startDate: 'asc' },
        take: 5,
      }),

      // 7. Most Viewed Trailers
      prisma.trailer.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          title: true,
          views: true,
          featured: true,
        },
        orderBy: { views: 'desc' },
        take: 5,
      }),

      // 8. Utilization Data - Simplified
      prisma.rental.findMany({
        where: {
          lessorId: userId,
          status: { in: ['COMPLETED', 'ACTIVE'] },
          startDate: { gte: subMonths(currentDate, 1) },
        },
        select: { startDate: true, endDate: true },
      })
    ]);

    console.timeEnd('Database Transaction');

    console.time('Post Processing');
    
    // Process trailer stats
    const trailerAggregates = trailerStats[0] || {
      totalTrailers: 0n,
      activeTrailers: 0n,
      maintenanceCount: 0n,
      overdueCount: 0n,
      avgPrice: null
    };

    // Calculate current month revenue
    const currentMonthRevenue = currentMonthRentals.reduce(
      (sum, rental) => sum + rental.totalPrice,
      0
    );

    // Calculate revenue change
    const revenueChange = lastMonthRevenue._sum.totalPrice
      ? ((currentMonthRevenue - lastMonthRevenue._sum.totalPrice) /
          lastMonthRevenue._sum.totalPrice) * 100
      : 100;

    // Calculate utilization rate
    const thirtyDaysAgo = subMonths(currentDate, 1);
    let totalDaysRented = 0;
    
    utilizationData.forEach(rental => {
      const start = new Date(rental.startDate) < thirtyDaysAgo 
        ? thirtyDaysAgo 
        : new Date(rental.startDate);
      const end = new Date(rental.endDate) > currentDate 
        ? currentDate 
        : new Date(rental.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (days > 0) totalDaysRented += days;
    });

    const activeTrailerCount = Number(trailerAggregates.activeTrailers);
    const utilizationRate = activeTrailerCount > 0
      ? (totalDaysRented / (activeTrailerCount * 30)) * 100
      : 0;

    // Format top performing trailers
    const topPerformingTrailers = topTrailersWithRevenue.map(trailer => ({
      id: trailer.id,
      title: trailer.title,
      totalRentals: Number(trailer.rentalCount),
      totalRevenue: trailer.totalRevenue,
    }));

    console.timeEnd('Post Processing');

    // Build response
    const dashboardData = {
      stats: {
        totalRentals: userStats.totalRentals,
        totalIncome: userStats.totalIncome,
        completedRentals: userStats.completedRentals,
        cancelledRentals: userStats.cancelledRentals,
        averageRating: userStats.averageRating,
        responseRate: userStats.responseRate,
        responseTime: userStats.responseTime,
        acceptanceRate: userStats.acceptanceRate,
      },
      trailerStats: {
        totalTrailers: Number(trailerAggregates.totalTrailers),
        activeTrailers: activeTrailerCount,
        utilizationRate,
        averagePrice: trailerAggregates.avgPrice || 0,
        trailersNeedingMaintenance: Number(trailerAggregates.maintenanceCount),
        overdueMaintenanceTrailers: Number(trailerAggregates.overdueCount),
      },
      revenueStats: {
        currentMonthRevenue,
        lastMonthRevenue: lastMonthRevenue._sum.totalPrice || 0,
        revenueChange,
        currentMonthRentals: currentMonthRentals.length,
        lastMonthRentals: lastMonthRevenue._count._all,
      },
      topPerformingTrailers,
      mostViewedTrailers,
      upcomingRentals: upcomingRentals.map(rental => ({
        id: rental.id,
        startDate: rental.startDate,
        endDate: rental.endDate,
        trailerTitle: rental.trailer.title,
        renterName: `${rental.renter.firstName} ${rental.renter.lastName}`,
        totalPrice: rental.totalPrice,
        images: rental.trailer.images,
      })),
    };

    // Update cache
    cache.set(cacheKey, {
      data: dashboardData,
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

    console.timeEnd('Lessor Dashboard Total Time');
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching lessor dashboard data:', error);
    console.timeEnd('Lessor Dashboard Total Time');
    return NextResponse.json(
      { error: 'Failed to fetch lessor dashboard data' },
      { status: 500 }
    );
  }
}