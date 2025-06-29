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
  
      const topTrailers = await prisma.$queryRaw<{
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
        WHERE t.ownerId = ${session.user.id}
        GROUP BY t.id, t.title
        ORDER BY totalRevenue DESC, rentalCount DESC
        LIMIT 5
      `;
  
      return NextResponse.json({
        trailers: topTrailers.map(t => ({
          id: t.id,
          title: t.title,
          totalRentals: Number(t.rentalCount),
          totalRevenue: t.totalRevenue,
        }))
      }, {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        }
      });
    } catch (error) {
      console.error('Error fetching top performing trailers:', error);
      return NextResponse.json({ error: 'Failed to fetch top trailers' }, { status: 500 });
    }
  }