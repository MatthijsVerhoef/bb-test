import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try { 
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({error: 'Unauthorized'}, { status: 401})
        }

        const trailers = await prisma.trailer.findMany({
            where: {ownerId: session.user.id},
            select: {
                id: true,
                title: true,
                views: true,
                featured: true
            },
            orderBy: {views: 'desc'},
            take: 5,
        })
        
        return NextResponse.json({ trailers }, {
            headers: {
                'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
            }
        })
    } catch ( error) {
        console.error('Error fetching most viewed trailers: ', error);
        return NextResponse.json({error: 'Failed to fetch most viewed'}, {status: 500})
    }
}