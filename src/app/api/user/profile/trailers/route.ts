// app/api/user/profile/trailers/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unstable_cache as cache } from 'next/cache';

// Strong cache headers for better performance
const CACHE_CONTROL_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    
    const filter: any = { ownerId: session.user.id };
    if (status && status !== 'all') {
      filter.status = status.toUpperCase();
    }
    
    const trailers = await prisma.trailer.findMany({
      where: filter,
      select: {
        id: true,
        title: true,
        description: true,
        pricePerDay: true,
        views: true,
        status: true,
        type: true,
        city: true,
        location: true,
        address: true,
        postalCode: true,
        length: true,
        width: true,
        height: true,
        weight: true,
        capacity: true,
        lastMaintenance: true,
        available: true,
        
        // Get only the first image for performance
        images: {
          take: 1,
          orderBy: { order: 'asc' },
          select: { url: true }
        },
        
        // Use aggregation for rental count
        _count: {
          select: { rentals: true }
        }
      },
      orderBy: { createdAt: 'desc' }, // Show newest first
      take: limit
    });
    
    // OPTIMIZATION: Get last rental dates in a single query for all trailers
    const trailerIds = trailers.map(t => t.id);
    const lastRentals = trailerIds.length > 0 ? await prisma.rental.findMany({
      where: {
        trailerId: { in: trailerIds },
        status: { in: ['COMPLETED', 'ACTIVE'] }
      },
      select: {
        trailerId: true,
        startDate: true
      },
      distinct: ['trailerId'],
      orderBy: { startDate: 'desc' }
    }) : [];
    
    // Create a map for O(1) lookup
    const lastRentalMap = new Map(
      lastRentals.map(rental => [rental.trailerId, rental.startDate])
    );
    
    // Format the results
    const formattedTrailers = trailers.map(trailer => ({
      id: trailer.id,
      title: trailer.title,
      description: trailer.description,
      pricePerDay: trailer.pricePerDay,
      views: trailer.views || 0,
      status: trailer.status,
      available: trailer.available,
      type: trailer.type,
      mainImage: trailer.images[0]?.url || null,
      location: trailer.city || trailer.location || null,
      address: trailer.address,
      city: trailer.city,
      postalCode: trailer.postalCode,
      length: trailer.length,
      width: trailer.width,
      height: trailer.height,
      weight: trailer.weight,
      capacity: trailer.capacity,
      rentalCount: trailer._count.rentals,
      lastRented: lastRentalMap.get(trailer.id) || null,
      lastMaintenance: trailer.lastMaintenance,
    }));
    
    return NextResponse.json({
      trailers: formattedTrailers,
      pagination: {
        total: formattedTrailers.length,
        limit,
        offset: 0,
        pages: 1,
      },
    }, {
      headers: CACHE_CONTROL_HEADERS
    });
    
  } catch (error) {
    console.error('Error fetching trailers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trailers' },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint to remove a trailer
 */
export async function DELETE(request: Request) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const trailerId = searchParams.get('id');
    
    if (!trailerId) {
      return NextResponse.json(
        { error: 'Trailer ID is required' },
        { status: 400 }
      );
    }
    
    // Verify the trailer belongs to the user and check active rentals in one query
    const trailer = await prisma.trailer.findUnique({
      where: { id: trailerId },
      select: {
        ownerId: true,
        rentals: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
          },
          take: 1,
          select: { id: true },
        },
      },
    });
    
    if (!trailer) {
      return NextResponse.json(
        { error: 'Trailer not found' },
        { status: 404 }
      );
    }
    
    if (trailer.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this trailer' },
        { status: 403 }
      );
    }
    
    // Check if the trailer has any active rentals
    if (trailer.rentals.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a trailer with active rentals' },
        { status: 400 }
      );
    }
    
    // Delete the trailer
    await prisma.trailer.delete({
      where: { id: trailerId },
    });
    
    // Invalidate cache tags
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate?tag=trailers`, {
      method: 'POST',
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting trailer:', error);
    return NextResponse.json(
      { error: 'Failed to delete trailer' },
      { status: 500 }
    );
  }
}

// API handler for DELETE requests with ID in the URL
export async function DELETE_WITH_ID(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const trailerId = params.id;
    
    // Verify the trailer belongs to the user and check active rentals in one efficient query
    const trailer = await prisma.trailer.findUnique({
      where: { id: trailerId },
      select: {
        ownerId: true,
        rentals: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
          },
          take: 1,
          select: { id: true },
        },
      },
    });
    
    if (!trailer) {
      return NextResponse.json(
        { error: 'Trailer not found' },
        { status: 404 }
      );
    }
    
    if (trailer.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this trailer' },
        { status: 403 }
      );
    }
    
    // Check if the trailer has any active rentals
    if (trailer.rentals.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a trailer with active rentals' },
        { status: 400 }
      );
    }
    
    // Delete the trailer
    await prisma.trailer.delete({
      where: { id: trailerId },
    });
    
    // Invalidate cache tags
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate?tag=trailers`, {
      method: 'POST',
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting trailer:', error);
    return NextResponse.json(
      { error: 'Failed to delete trailer' },
      { status: 500 }
    );
  }
}

// API route for cache revalidation - must be secured properly
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  
  if (!tag) {
    return NextResponse.json({ revalidated: false, error: 'Tag is required' }, { status: 400 });
  }
  
  try {
    // Revalidate all cache entries with the specified tag
    // This is needed if we want to flush specific cache entries
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate?tag=${tag}`, {
      method: 'POST',
    });
    
    return NextResponse.json({ revalidated: true });
  } catch (error) {
    console.error('Error revalidating cache:', error);
    return NextResponse.json({ revalidated: false, error: 'Failed to revalidate' }, { status: 500 });
  }
}