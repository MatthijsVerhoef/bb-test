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

        const rentals = await prisma.rental.findMany({
            where: {
                lessorId: session.user.id,
                status: { in: ['CONFIRMED', 'PENDING']},
                startDate: {gte: new Date()}
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
                            select: { url: true},
                            orderBy: {order: 'asc'}
                        }
                    }
                },
                renter: {
                    select: {firstName: true, lastName: true}
                }
            },
            orderBy: { startDate: 'asc' },
            take: 5,
        })

        return NextResponse.json({
            rentals: rentals.map(r => ({
                id: r.id,
                startDate: r.startDate.toISOString(),
                endDate: r.endDate.toISOString(),
                trailerTitle: r.trailer.title,
                renterName: `${r.renter.firstName} ${r.renter.lastName}`,
                totalPrice: r.totalPrice,
                images: r.trailer.images
            }))
        }, {
            headers: {
                'Cache-Control': 'private, max-age=120, stale-while-revalidate=300',
              }
        })
    } catch (error) {
        console.error('Error fetching upcoming rentals:', error);
        return NextResponse.json({ error: 'Failed to fetch upcoming rentals' }, { status: 500 });
      }
}