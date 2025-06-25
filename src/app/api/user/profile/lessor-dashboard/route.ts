// app/api/user/profile/lessor-dashboard/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const currentDate = new Date();
    const lastMonth = subMonths(currentDate, 1);
    const startOfLastMonth = startOfMonth(lastMonth);
    const endOfLastMonth = endOfMonth(lastMonth);

    // Execute all queries in a single transaction for better performance
    const dashboardData = await prisma.$transaction(async (tx) => {
      // Get or create user stats
      const userStats = await tx.userStats.upsert({
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
      });

      // Aggregate trailer statistics in a single query
      const trailerAggregates = await tx.trailer.aggregate({
        where: { ownerId: userId },
        _count: { _all: true },
        _avg: { pricePerDay: true },
      });

      const activeTrailers = await tx.trailer.count({
        where: { ownerId: userId, status: 'ACTIVE' },
      });

      // Get maintenance counts in parallel
      const [maintenanceCount, overdueCount] = await Promise.all([
        tx.trailer.count({
          where: { ownerId: userId, status: 'MAINTENANCE' },
        }),
        tx.trailer.count({
          where: { ownerId: userId, nextMaintenance: { lt: currentDate } },
        }),
      ]);

      // Get current month rentals with minimal data
      const currentMonthRentals = await tx.rental.findMany({
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
      });

      // Get last month revenue (just the sum)
      const lastMonthRevenue = await tx.rental.aggregate({
        where: {
          lessorId: userId,
          startDate: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { totalPrice: true },
        _count: { _all: true },
      });

      // Get top performing trailers with aggregated data
      const topTrailers = await tx.trailer.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          title: true,
          _count: {
            select: { rentals: { where: { status: 'COMPLETED' } } },
          },
        },
        orderBy: {
          rentals: { _count: 'desc' },
        },
        take: 5,
      });

      // Calculate revenue for top trailers
      const topTrailerIds = topTrailers.map(t => t.id);
      const topTrailerRevenues = await tx.rental.groupBy({
        by: ['trailerId'],
        where: {
          trailerId: { in: topTrailerIds },
          status: 'COMPLETED',
        },
        _sum: { totalPrice: true },
      });

      // Get upcoming rentals efficiently
      const upcomingRentals = await tx.rental.findMany({
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
      });

      // Get most viewed trailers
      const mostViewedTrailers = await tx.trailer.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          title: true,
          views: true,
          featured: true,
        },
        orderBy: { views: 'desc' },
        take: 5,
      });

      // Calculate utilization for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const utilizationData = await tx.rental.findMany({
        where: {
          lessorId: userId,
          status: { in: ['COMPLETED', 'ACTIVE'] },
          startDate: { gte: thirtyDaysAgo },
        },
        select: { startDate: true, endDate: true },
      });

      return {
        userStats,
        trailerAggregates,
        activeTrailers,
        maintenanceCount,
        overdueCount,
        currentMonthRentals,
        lastMonthRevenue,
        topTrailers,
        topTrailerRevenues,
        upcomingRentals,
        mostViewedTrailers,
        utilizationData,
      };
    });

    // Process data after transaction
    const currentMonthRevenue = dashboardData.currentMonthRentals.reduce(
      (sum, rental) => sum + rental.totalPrice,
      0
    );

    const revenueChange = dashboardData.lastMonthRevenue._sum.totalPrice
      ? ((currentMonthRevenue - dashboardData.lastMonthRevenue._sum.totalPrice) /
          dashboardData.lastMonthRevenue._sum.totalPrice) * 100
      : 100;

    // Calculate utilization
    let totalDaysRented = 0;
    dashboardData.utilizationData.forEach(rental => {
      const start = new Date(rental.startDate) < dashboardData.thirtyDaysAgo 
        ? dashboardData.thirtyDaysAgo 
        : new Date(rental.startDate);
      const end = new Date(rental.endDate) > currentDate 
        ? currentDate 
        : new Date(rental.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (days > 0) totalDaysRented += days;
    });

    const utilizationRate = dashboardData.activeTrailers > 0
      ? (totalDaysRented / (dashboardData.activeTrailers * 30)) * 100
      : 0;

    // Map revenue to top trailers
    const revenueMap = dashboardData.topTrailerRevenues.reduce((acc, item) => {
      acc[item.trailerId] = item._sum.totalPrice || 0;
      return acc;
    }, {} as Record<string, number>);

    const topPerformingTrailers = dashboardData.topTrailers.map(trailer => ({
      id: trailer.id,
      title: trailer.title,
      totalRentals: trailer._count.rentals,
      totalRevenue: revenueMap[trailer.id] || 0,
    }));

    return NextResponse.json({
      stats: {
        totalRentals: dashboardData.userStats.totalRentals,
        totalIncome: dashboardData.userStats.totalIncome,
        completedRentals: dashboardData.userStats.completedRentals,
        cancelledRentals: dashboardData.userStats.cancelledRentals,
        averageRating: dashboardData.userStats.averageRating,
        responseRate: dashboardData.userStats.responseRate,
        responseTime: dashboardData.userStats.responseTime,
        acceptanceRate: dashboardData.userStats.acceptanceRate,
      },
      trailerStats: {
        totalTrailers: dashboardData.trailerAggregates._count._all,
        activeTrailers: dashboardData.activeTrailers,
        utilizationRate,
        averagePrice: dashboardData.trailerAggregates._avg.pricePerDay || 0,
        trailersNeedingMaintenance: dashboardData.maintenanceCount,
        overdueMaintenanceTrailers: dashboardData.overdueCount,
      },
      revenueStats: {
        currentMonthRevenue,
        lastMonthRevenue: dashboardData.lastMonthRevenue._sum.totalPrice || 0,
        revenueChange,
        currentMonthRentals: dashboardData.currentMonthRentals.length,
        lastMonthRentals: dashboardData.lastMonthRevenue._count._all,
      },
      topPerformingTrailers,
      mostViewedTrailers: dashboardData.mostViewedTrailers,
      upcomingRentals: dashboardData.upcomingRentals.map(rental => ({
        id: rental.id,
        startDate: rental.startDate,
        endDate: rental.endDate,
        trailerTitle: rental.trailer.title,
        renterName: `${rental.renter.firstName} ${rental.renter.lastName}`,
        totalPrice: rental.totalPrice,
        images: rental.trailer.images,
      })),
    });
  } catch (error) {
    console.error('Error fetching lessor dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessor dashboard data' },
      { status: 500 }
    );
  }
}