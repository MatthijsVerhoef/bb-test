// app/api/user/profile/reviews/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

// Cache headers for optimized responses
const CACHE_CONTROL_HEADERS = {
  'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300'
};

export async function GET(request: Request) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || session.user.role;
    const rating = searchParams.get('rating');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100); // Cap at 100
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;
    
    // Generate cache key
    const cacheKey = createHash('md5')
      .update(`${session.user.id}-${role}-${rating || 'all'}-${page}-${limit}-v2`)
      .digest('hex');
    
    // OPTIMIZATION 1: Get relevant review IDs first with proper indexing
    let reviewIds: string[] = [];
    let totalCount = 0;
    
    if (role.toUpperCase() === 'LESSOR') {
      // Get trailer IDs owned by user (indexed on ownerId)
      const trailerIds = await prisma.trailer.findMany({
        where: { ownerId: session.user.id },
        select: { id: true }
      });
      
      if (trailerIds.length === 0) {
        return NextResponse.json({
          reviews: [],
          pagination: { total: 0, page, limit, pages: 0 }
        }, { headers: CACHE_CONTROL_HEADERS });
      }

      const trailerIdList = trailerIds.map(t => t.id);
      
      // Build where clause for reviews
      const reviewWhere: any = { trailerId: { in: trailerIdList } };
      if (rating) {
        reviewWhere.rating = parseInt(rating, 10);
      }

      // Get count and review IDs in parallel
      const [count, reviewsWithIds] = await Promise.all([
        prisma.review.count({ where: reviewWhere }),
        prisma.review.findMany({
          where: reviewWhere,
          select: { id: true },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        })
      ]);

      totalCount = count;
      reviewIds = reviewsWithIds.map(r => r.id);
    } else {
      // For users - direct query on reviewerId (indexed)
      const reviewWhere: any = { reviewerId: session.user.id };
      if (rating) {
        reviewWhere.rating = parseInt(rating, 10);
      }

      const [count, reviewsWithIds] = await Promise.all([
        prisma.review.count({ where: reviewWhere }),
        prisma.review.findMany({
          where: reviewWhere,
          select: { id: true },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        })
      ]);

      totalCount = count;
      reviewIds = reviewsWithIds.map(r => r.id);
    }

    if (reviewIds.length === 0) {
      return NextResponse.json({
        reviews: [],
        pagination: { total: totalCount, page, limit, pages: Math.ceil(totalCount / limit) }
      }, { headers: CACHE_CONTROL_HEADERS });
    }

    // OPTIMIZATION 2: Batch load all data with efficient queries
    const [reviews, users, trailers, mediaItems] = await Promise.all([
      // Get full review data for the specific IDs
      prisma.review.findMany({
        where: { id: { in: reviewIds } },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Get all unique users involved (reviewers for LESSOR role)
      role.toUpperCase() === 'LESSOR' ? 
        prisma.review.findMany({
          where: { id: { in: reviewIds } },
          select: { 
            reviewerId: true,
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePicture: true
              }
            }
          }
        }) : Promise.resolve([]),
      
      // Get all trailers involved
      prisma.review.findMany({
        where: { id: { in: reviewIds } },
        select: {
          trailerId: true,
          trailer: {
            select: {
              id: true,
              title: true
            }
          }
        }
      }),
      
      // Get trailer images efficiently
      prisma.review.findMany({
        where: { id: { in: reviewIds } },
        select: {
          trailerId: true,
          trailer: {
            select: {
              id: true,
              images: {
                where: { type: 'IMAGE' },
                orderBy: { order: 'asc' },
                take: 1,
                select: { url: true }
              }
            }
          }
        }
      })
    ]);

    // OPTIMIZATION 3: Create efficient lookup maps
    const userMap = new Map();
    const trailerMap = new Map();
    const imageMap = new Map();

    // Process users (for LESSOR role)
    if (role.toUpperCase() === 'LESSOR') {
      users.forEach((item: any) => {
        if (item.reviewer) {
          userMap.set(item.reviewerId, item.reviewer);
        }
      });
    }

    // Process trailers
    trailers.forEach((item: any) => {
      if (item.trailer) {
        trailerMap.set(item.trailerId, item.trailer);
      }
    });

    // Process images
    mediaItems.forEach((item: any) => {
      if (item.trailer?.images?.length > 0) {
        imageMap.set(item.trailerId, item.trailer.images[0].url);
      }
    });

    // OPTIMIZATION 4: Format results efficiently
    const formattedReviews = reviews.map(review => {
      const reviewer = userMap.get(review.reviewerId);
      const trailer = trailerMap.get(review.trailerId);
      const trailerImage = imageMap.get(review.trailerId);

      return {
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        response: review.response,
        responseDate: review.responseDate,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        cleanliness: review.cleanliness,
        maintenance: review.maintenance,
        valueForMoney: review.valueForMoney,
        communication: review.communication,
        accuracy: review.accuracy,
        recommended: review.recommended,
        // Reviewer info (for LESSOR role)
        reviewerId: review.reviewerId,
        reviewerName: reviewer
          ? `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim()
          : null,
        reviewerImage: reviewer?.profilePicture || null,
        // Trailer info
        trailerId: review.trailerId,
        trailerTitle: trailer?.title || null,
        trailerImage: trailerImage || null
      };
    });

    // Return optimized response
    return NextResponse.json({
      reviews: formattedReviews,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    }, {
      headers: {
        ...CACHE_CONTROL_HEADERS,
        'X-Cache-Key': cacheKey,
        'X-Query-Time': Date.now().toString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}