import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const currentDate = new Date();
      const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
  
      const [currentMonthData, lastMonthData] = await Promise.all([
        prisma.rental.aggregate({
          where: {
            lessorId: session.user.id,
            startDate: { gte: currentMonth },
            status: { in: ['COMPLETED', 'ACTIVE'] },
          },
          _sum: { totalPrice: true },
          _count: { _all: true },
        }),
        prisma.rental.aggregate({
          where: {
            lessorId: session.user.id,
            startDate: { gte: lastMonth, lte: lastMonthEnd },
            status: { in: ['COMPLETED', 'ACTIVE'] },
          },
          _sum: { totalPrice: true },
          _count: { _all: true },
        }),
      ]);
  
      const currentRevenue = currentMonthData._sum.totalPrice || 0;
      const lastRevenue = lastMonthData._sum.totalPrice || 0;
      const revenueChange = lastRevenue > 0 
        ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
        : currentRevenue > 0 ? 100 : 0;
  
      return NextResponse.json({
        revenueStats: {
          currentMonthRevenue: currentRevenue,
          lastMonthRevenue: lastRevenue,
          revenueChange,
          currentMonthRentals: currentMonthData._count._all,
          lastMonthRentals: lastMonthData._count._all,
        }
      }, {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        }
      });
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      return NextResponse.json({ error: 'Failed to fetch revenue stats' }, { status: 500 });
    }
  }