import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import {prisma} from "@/lib/prisma";
import { startOfDay, subDays, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "30"; // days
    const daysToFetch = parseInt(period);

    const revenueData = [];
    const now = new Date();

    for (let i = daysToFetch - 1; i >= 0; i--) {
      const date = startOfDay(subDays(now, i));
      const nextDate = startOfDay(subDays(now, i - 1));

      const dailyRevenue = await prisma.rental.aggregate({
        _sum: {
          serviceFee: true,
          totalPrice: true,
        },
        _count: true,
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
          status: { in: ["COMPLETED", "ACTIVE"] },
        },
      });

      revenueData.push({
        date: format(date, "yyyy-MM-dd"),
        revenue: dailyRevenue._sum.serviceFee || 0,
        transactionVolume: dailyRevenue._sum.totalPrice || 0,
        rentalCount: dailyRevenue._count || 0,
      });
    }

    return NextResponse.json({ data: revenueData });
  } catch (error) {
    console.error("Error fetching revenue trends:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue trends" },
      { status: 500 }
    );
  }
}