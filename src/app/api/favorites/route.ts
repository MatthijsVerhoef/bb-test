// app/api/favorites/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Optimized query with only necessary data
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        createdAt: true,
        trailer: {
          select: {
            id: true,
            title: true,
            city: true,
            pricePerDay: true,
            available: true,
            status: true,
            images: {
              select: {
                url: true,
              },
              take: 1,
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to flat structure
    const formattedFavorites = favorites
      .filter(fav => fav.trailer.available && fav.trailer.status === 'ACTIVE')
      .map(fav => ({
        id: fav.trailer.id,
        title: fav.trailer.title,
        city: fav.trailer.city,
        pricePerDay: fav.trailer.pricePerDay,
        mainImage: fav.trailer.images[0]?.url || '',
        createdAt: fav.createdAt.toISOString(),
      }));

    return NextResponse.json(
      { favorites: formattedFavorites },
      {
        headers: {
          'Cache-Control': 'private, max-age=60',
        }
      }
    );

  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { trailerId } = await request.json();

    if (!trailerId) {
      return NextResponse.json(
        { error: 'Trailer ID is required' },
        { status: 400 }
      );
    }

    // Check if trailer exists and is available
    const trailer = await prisma.trailer.findUnique({
      where: { id: trailerId },
      select: { id: true, available: true, status: true }
    });

    if (!trailer || !trailer.available || trailer.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Trailer not available' },
        { status: 400 }
      );
    }

    // Create favorite (upsert to handle duplicates)
    const favorite = await prisma.favorite.upsert({
      where: {
        userId_trailerId: {
          userId: session.user.id,
          trailerId: trailerId,
        }
      },
      update: {}, // Do nothing if exists
      create: {
        userId: session.user.id,
        trailerId: trailerId,
      },
      include: {
        trailer: {
          select: {
            id: true,
            title: true,
            city: true,
            pricePerDay: true,
            images: {
              select: { url: true },
              take: 1,
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    return NextResponse.json({
      favorite: {
        id: favorite.trailer.id,
        title: favorite.trailer.title,
        city: favorite.trailer.city,
        pricePerDay: favorite.trailer.pricePerDay,
        mainImage: favorite.trailer.images[0]?.url || '',
        createdAt: favorite.createdAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}
