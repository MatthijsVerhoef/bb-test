import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import {prisma} from "@/lib/prisma";
import { startOfDay, subDays, subMonths } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const today = startOfDay(now);
    const yesterday = subDays(today, 1);
    const lastWeek = subDays(today, 7);
    const lastMonth = subMonths(today, 1);
    const last3Months = subMonths(today, 3);

    // Platform Overview Stats
    const [
      totalUsers,
      totalLessors,
      totalRenters,
      activeUsers24h,
      activeUsers7d,
      activeUsers30d,
      newUsersToday,
      newUsersThisMonth,
      verifiedUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "LESSOR" } }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { lastActive: { gte: yesterday } } }),
      prisma.user.count({ where: { lastActive: { gte: lastWeek } } }),
      prisma.user.count({ where: { lastActive: { gte: lastMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: lastMonth } } }),
      prisma.userVerification.count({ where: { licenseVerified: true } }),
    ]);

    // Rental Stats
    const [
      totalRentals,
      activeRentals,
      completedRentals,
      cancelledRentals,
      disputedRentals,
      rentalsToday,
      rentalsThisMonth,
    ] = await Promise.all([
      prisma.rental.count(),
      prisma.rental.count({ where: { status: "ACTIVE" } }),
      prisma.rental.count({ where: { status: "COMPLETED" } }),
      prisma.rental.count({ where: { status: "CANCELLED" } }),
      prisma.rental.count({ where: { status: "DISPUTED" } }),
      prisma.rental.count({ where: { createdAt: { gte: today } } }),
      prisma.rental.count({ where: { createdAt: { gte: lastMonth } } }),
    ]);

    // Financial Stats
    const totalRevenueResult = await prisma.rental.aggregate({
      _sum: {
        serviceFee: true,
        totalPrice: true,
      },
      where: {
        status: { in: ["COMPLETED", "ACTIVE"] },
      },
    });

    const monthlyRevenueResult = await prisma.rental.aggregate({
      _sum: {
        serviceFee: true,
        totalPrice: true,
      },
      where: {
        status: { in: ["COMPLETED", "ACTIVE"] },
        createdAt: { gte: lastMonth },
      },
    });

    const pendingPayments = await prisma.payment.count({
      where: { status: "PENDING" },
    });

    const failedPayments = await prisma.payment.count({
      where: { status: "FAILED" },
    });

    // Trailer Stats
    const [
      totalTrailers,
      activeTrailers,
      featuredTrailers,
      totalViews,
      totalFavorites,
    ] = await Promise.all([
      prisma.trailer.count(),
      prisma.trailer.count({ where: { status: "ACTIVE" } }),
      prisma.trailer.count({ where: { featured: true } }),
      prisma.trailer.aggregate({ _sum: { views: true } }),
      prisma.favorite.count(),
    ]);

    // Support Stats - Fixed to calculate resolution time from createdAt and closedAt
    const [openTickets, resolvedTickets] = await Promise.all([
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
      prisma.supportTicket.count({ where: { status: "CLOSED" } }),
    ]);

    // Calculate average resolution time manually
    const closedTicketsWithTime = await prisma.supportTicket.findMany({
      where: {
        status: "CLOSED",
        closedAt: { not: null },
      },
      select: {
        createdAt: true,
        closedAt: true,
      },
    });

    let avgResponseTimeHours = 0;
    if (closedTicketsWithTime.length > 0) {
      const totalResolutionTime = closedTicketsWithTime.reduce((sum, ticket) => {
        if (ticket.closedAt) {
          const resolutionTime = ticket.closedAt.getTime() - ticket.createdAt.getTime();
          return sum + resolutionTime;
        }
        return sum;
      }, 0);
      
      const avgResolutionTimeMs = totalResolutionTime / closedTicketsWithTime.length;
      avgResponseTimeHours = Math.round(avgResolutionTimeMs / 3600000); // Convert to hours
    }

    // Calculate growth rates
    const previousMonthUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: subMonths(lastMonth, 1),
          lt: lastMonth,
        },
      },
    });

    const userGrowthRate = previousMonthUsers
      ? ((newUsersThisMonth - previousMonthUsers) / previousMonthUsers) * 100
      : 0;

    // Visitor data for last 90 days (mock data for now - should be replaced with actual analytics)
    const visitorData = [];
    for (let i = 89; i >= 0; i--) {
      const date = subDays(now, i);
      visitorData.push({
        date: date.toISOString().split("T")[0],
        desktop: Math.floor(Math.random() * 400) + 100,
        mobile: Math.floor(Math.random() * 300) + 100,
      });
    }

    // Geographic distribution - Fixed to use trailer city through join
    const rentalsWithLocation = await prisma.rental.findMany({
      include: {
        trailer: {
          select: {
            city: true,
          },
        },
      },
      take: 1000, // Limit for performance
    });

    // Group by city manually
    const cityCountMap = new Map<string, number>();
    rentalsWithLocation.forEach((rental) => {
      const city = rental.trailer.city || "Unknown";
      cityCountMap.set(city, (cityCountMap.get(city) || 0) + 1);
    });

    // Convert to array and sort
    const locationStats = Array.from(cityCountMap.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Popular trailer types
    const trailerTypeStats = await prisma.trailer.groupBy({
      by: ["type"],
      _count: true,
      _avg: {
        views: true,
      },
    });

    // User engagement metrics
    const reviewStats = await prisma.review.aggregate({
      _avg: {
        rating: true,
      },
      _count: true,
    });

    const searchVolume = await prisma.searchHistory.count({
      where: {
        createdAt: { gte: lastMonth },
      },
    });

    return NextResponse.json({
      overview: {
        totalRevenue: totalRevenueResult._sum.serviceFee || 0,
        monthlyRevenue: monthlyRevenueResult._sum.serviceFee || 0,
        totalUsers,
        activeUsers: activeUsers24h,
        userGrowthRate: userGrowthRate.toFixed(1),
      },
      users: {
        total: totalUsers,
        lessors: totalLessors,
        renters: totalRenters,
        verified: verifiedUsers,
        activeDaily: activeUsers24h,
        activeWeekly: activeUsers7d,
        activeMonthly: activeUsers30d,
        newToday: newUsersToday,
        newThisMonth: newUsersThisMonth,
      },
      rentals: {
        total: totalRentals,
        active: activeRentals,
        completed: completedRentals,
        cancelled: cancelledRentals,
        disputed: disputedRentals,
        today: rentalsToday,
        thisMonth: rentalsThisMonth,
        completionRate:
          totalRentals > 0
            ? ((completedRentals / totalRentals) * 100).toFixed(1)
            : 0,
        cancellationRate:
          totalRentals > 0
            ? ((cancelledRentals / totalRentals) * 100).toFixed(1)
            : 0,
      },
      financials: {
        totalRevenue: totalRevenueResult._sum.serviceFee || 0,
        totalTransactionVolume: totalRevenueResult._sum.totalPrice || 0,
        monthlyRevenue: monthlyRevenueResult._sum.serviceFee || 0,
        monthlyTransactionVolume: monthlyRevenueResult._sum.totalPrice || 0,
        pendingPayments,
        failedPayments,
        paymentSuccessRate:
          pendingPayments + failedPayments > 0
            ? (
                (1 - failedPayments / (pendingPayments + failedPayments)) *
                100
              ).toFixed(1)
            : 100,
      },
      trailers: {
        total: totalTrailers,
        active: activeTrailers,
        featured: featuredTrailers,
        totalViews: totalViews._sum.views || 0,
        totalFavorites,
        averageViewsPerTrailer:
          totalTrailers > 0
            ? Math.round((totalViews._sum.views || 0) / totalTrailers)
            : 0,
      },
      support: {
        openTickets,
        resolvedTickets,
        avgResponseTimeHours,
      },
      engagement: {
        averageRating: reviewStats._avg.rating?.toFixed(1) || 0,
        totalReviews: reviewStats._count || 0,
        monthlySearches: searchVolume,
      },
      visitorData,
      locationStats,
      trailerTypeStats: trailerTypeStats.map((type) => ({
        type: type.type || "Other",
        count: type._count,
        avgViews: Math.round(type._avg.views || 0),
      })),
    });
  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}