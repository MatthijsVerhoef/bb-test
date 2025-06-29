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
      
      const result = await prisma.$queryRaw<{
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
        WHERE ownerId = ${session.user.id}
      `;
  
      const stats = result[0] || {};
  
      // Calculate utilization rate (simplified)
      const activeCount = Number(stats.activeTrailers || 0);
      const utilizationRate = activeCount > 0 ? 75.5 : 0; // Placeholder - implement real calculation
  
      return NextResponse.json({
        trailerStats: {
          totalTrailers: Number(stats.totalTrailers || 0),
          activeTrailers: activeCount,
          utilizationRate,
          averagePrice: stats.avgPrice || 0,
          trailersNeedingMaintenance: Number(stats.maintenanceCount || 0),
          overdueMaintenanceTrailers: Number(stats.overdueCount || 0),
        }
      }, {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        }
      });
    } catch (error) {
      console.error('Error fetching trailer stats:', error);
      return NextResponse.json({ error: 'Failed to fetch trailer stats' }, { status: 500 });
    }
  }