// app/api/user/profile/lessor-history/counts/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// This endpoint is specifically for getting counts quickly
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Use raw query for better performance
    const counts = await prisma.$queryRaw<{
      status: string;
      count: bigint;
    }[]>`
      SELECT status, COUNT(*) as count
      FROM Rental
      WHERE lessorId = ${userId}
      GROUP BY status
    `;

    // Process counts
    const result = {
      upcoming: 0,
      current: 0,
      past: 0,
      total: 0,
    };

    counts.forEach(({ status, count }) => {
      const countNum = Number(count);
      result.total += countNum;
      
      if (status === 'PENDING' || status === 'CONFIRMED') {
        result.upcoming += countNum;
      } else if (status === 'ACTIVE' || status === 'LATE_RETURN' || status === 'DISPUTED') {
        result.current += countNum;
      } else if (status === 'COMPLETED' || status === 'CANCELLED') {
        result.past += countNum;
      }
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error('Error fetching lessor counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch counts' },
      { status: 500 }
    );
  }
}