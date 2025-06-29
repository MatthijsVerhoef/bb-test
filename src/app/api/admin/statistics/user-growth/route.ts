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

    const growthData = [];
    const now = new Date();

    for (let i = daysToFetch - 1; i >= 0; i--) {
      const date = startOfDay(subDays(now, i));
      const nextDate = startOfDay(subDays(now, i - 1));

      const [newUsers, newLessors, activeUsers] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
            role: "LESSOR",
          },
        }),
        prisma.user.count({
          where: {
            lastActive: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
      ]);

      // Get cumulative total
      const totalUsers = await prisma.user.count({
        where: {
          createdAt: {
            lt: nextDate,
          },
        },
      });

      growthData.push({
        date: format(date, "yyyy-MM-dd"),
        newUsers,
        newLessors,
        activeUsers,
        totalUsers,
      });
    }

    return NextResponse.json({ data: growthData });
  } catch (error) {
    console.error("Error fetching user growth:", error);
    return NextResponse.json(
      { error: "Failed to fetch user growth" },
      { status: 500 }
    );
  }
}