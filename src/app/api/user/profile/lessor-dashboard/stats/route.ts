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

    const stats = await prisma.userStats.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        totalRentals: 0,
        totalIncome: 0,
        totalSpent: 0,
        cancelledRentals: 0,
        completedRentals: 0,
      },
      update: {},
    });

    return NextResponse.json({
      stats: {
        totalRentals: stats.totalRentals,
        totalIncome: stats.totalIncome,
        completedRentals: stats.completedRentals,
        cancelledRentals: stats.cancelledRentals,
        averageRating: stats.averageRating,
        responseRate: stats.responseRate,
        responseTime: stats.responseTime,
        acceptanceRate: stats.acceptanceRate,
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
