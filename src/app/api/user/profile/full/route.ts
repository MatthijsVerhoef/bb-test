// app/api/user/profile/full/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { createHash } from "crypto";
import { getCacheValue, setCacheValue } from "@/lib/redis-client";

// Cache TTL in seconds (5 minutes)
const CACHE_TTL = 300;

export async function GET(request: Request) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    if (!token || !token.email) {
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }

    // Parse URL to get params
    const url = new URL(request.url);
    const includedSections = url.searchParams.get('include')?.split(',') || ['all'];
    const includeAll = includedSections.includes('all');
    const skipCache = url.searchParams.get('skipCache') === 'true';
    
    // Create a cache key based on the user email and requested sections
    const cacheKey = `profile:${createHash('md5').update(token.email + includedSections.sort().join('|')).digest('hex')}`;
    
    // Try to get data from cache first (if not explicitly skipped)
    if (!skipCache) {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          return NextResponse.json(cachedData);
        }
      } catch (cacheError) {
        // Log but continue - cache errors shouldn't block operation
        console.warn("Cache error:", cacheError);
      }
    }

    // Just get the user ID and role - use URL params to determine what to fetch
    const user = await prisma.user.findUnique({
      where: { email: token.email },
      select: { 
        id: true, 
        role: true 
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prepare optimized query selections based on requested sections
    const sections = {
      wallet: includeAll || includedSections.includes('wallet'),
      listings: (includeAll || includedSections.includes('listings')) && user.role === 'LESSOR',
      rentals: includeAll || includedSections.includes('rentals'),
      reviews: includeAll || includedSections.includes('reviews'),
      favorites: includeAll || includedSections.includes('favorites'),
      notifications: includeAll || includedSections.includes('notifications'),
      documents: includeAll || includedSections.includes('documents'),
    };

    // Build queries - only include the ones requested
    const queries: Record<string, Promise<any>> = {};
    
    if (sections.wallet) {
      queries.wallet = prisma.wallet.findUnique({
        where: { userId: user.id },
        select: {
          balance: true,
          currency: true,
          lastPayout: true,
        },
      });
    }
    
    if (sections.listings) {
      queries.listings = prisma.trailer.findMany({
        where: { ownerId: user.id },
        select: {
          id: true,
          title: true,
          pricePerDay: true,
          views: true,
          status: true,
          type: true,
        },
      });
      
      // Separate query for images to avoid N+1 problem
      queries.trailerImages = prisma.media.findMany({
        where: { 
          type: 'IMAGE',
          trailer: {
            ownerId: user.id
          }
        },
        orderBy: { order: 'asc' },
        select: {
          url: true,
          trailerId: true,
        },
        distinct: ['trailerId'],
      });
    }
    
    if (sections.rentals) {
      queries.rentals = prisma.rental.findMany({
        where: {
          OR: [
            { renterId: user.id },
            { lessorId: user.id }
          ],
        },
        orderBy: { startDate: 'desc' },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true,
          totalPrice: true,
          trailerId: true,
          renterId: true,
          lessorId: true,
        },
      });
      
      // Get trailers in a single query
      queries.rentalTrailers = prisma.$queryRaw`
        SELECT t.id, t.title
        FROM Trailer t
        JOIN Rental r ON r.trailerId = t.id
        WHERE r.renterId = ${user.id} OR r.lessorId = ${user.id}
      `;
      
      // Get users in a single query
      queries.rentalUsers = prisma.$queryRaw`
        SELECT u.id, u.firstName, u.lastName 
        FROM User u
        WHERE u.id IN (
          SELECT r.renterId FROM Rental r WHERE r.lessorId = ${user.id}
          UNION
          SELECT r.lessorId FROM Rental r WHERE r.renterId = ${user.id}
        )
      `;
      
      // Get rental images more efficiently
      queries.rentalImages = prisma.media.findMany({
        where: {
          type: 'IMAGE',
          trailer: {
            rentals: {
              some: {
                OR: [
                  { renterId: user.id },
                  { lessorId: user.id }
                ]
              }
            }
          }
        },
        orderBy: { order: 'asc' },
        select: {
          url: true,
          trailerId: true,
        },
        distinct: ['trailerId'],
      });
    }
    
    if (sections.reviews) {
      queries.writtenReviews = prisma.review.findMany({
        where: { reviewerId: user.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          createdAt: true,
          trailerId: true,
          reviewerId: true,
          reviewedUserId: true,
        },
      });
      
      queries.receivedReviews = prisma.review.findMany({
        where: { reviewedUserId: user.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          createdAt: true,
          trailerId: true,
          reviewerId: true,
        },
      });
      
      // Get review related users and trailers in bulk
      queries.reviewUsers = sections.reviews ? prisma.$queryRaw`
        SELECT u.id, u.firstName, u.lastName
        FROM User u
        WHERE u.id IN (
          SELECT r.reviewerId FROM Review r WHERE r.reviewedUserId = ${user.id}
          UNION
          SELECT r.reviewedUserId FROM Review r WHERE r.reviewerId = ${user.id}
        )
      ` : Promise.resolve([]);
      
      queries.reviewTrailers = sections.reviews ? prisma.$queryRaw`
        SELECT t.id, t.title
        FROM Trailer t
        WHERE t.id IN (
          SELECT r.trailerId FROM Review r WHERE r.reviewerId = ${user.id}
          UNION
          SELECT r.trailerId FROM Review r WHERE r.reviewedUserId = ${user.id}
        )
      ` : Promise.resolve([]);
    }
    
    if (sections.favorites) {
      queries.favorites = prisma.favorite.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          trailerId: true,
        },
      });
      
      // Get favorite trailers in a single query
      queries.favoriteTrailers = prisma.trailer.findMany({
        where: {
          favorites: {
            some: {
              userId: user.id
            }
          }
        },
        select: {
          id: true,
          title: true,
          pricePerDay: true,
        }
      });
      
      // Get favorite images in a single query
      queries.favoriteImages = prisma.media.findMany({
        where: {
          type: 'IMAGE',
          trailer: {
            favorites: {
              some: {
                userId: user.id
              }
            }
          }
        },
        orderBy: { order: 'asc' },
        select: {
          url: true,
          trailerId: true,
        },
        distinct: ['trailerId'],
      });
    }
    
    if (sections.notifications) {
      queries.notifications = prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          message: true,
          read: true,
          type: true,
          createdAt: true,
        },
      });
    }
    
    if (sections.documents) {
      queries.documents = prisma.document.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          type: true,
          name: true,
          verified: true,
          expiryDate: true,
          url: true,
        },
      });
    }

    // Execute all queries in parallel
    const results = await Promise.all(Object.values(queries));
    
    // Assign results to named variables
    const queryKeys = Object.keys(queries);
    const resultMap: Record<string, any> = {};
    queryKeys.forEach((key, index) => {
      resultMap[key] = results[index];
    });
    
    // Format response with proper mapping
    let formattedData: Record<string, any> = {};
    
    // Format listings if needed
    if (sections.listings) {
      const listings = resultMap.listings || [];
      const trailerImages = resultMap.trailerImages || [];
      
      // Create a map of trailerId -> imageUrl for faster lookup
      const imageMap = trailerImages.reduce((map: Record<string, string>, img: any) => {
        if (!map[img.trailerId]) {
          map[img.trailerId] = img.url;
        }
        return map;
      }, {});
      
      formattedData.listings = listings.map((listing: any) => ({
        id: listing.id,
        title: listing.title,
        pricePerDay: listing.pricePerDay,
        views: listing.views,
        status: listing.status,
        type: listing.type,
        mainImage: imageMap[listing.id] || null,
      }));
    }
    
    // Format rentals if needed
    if (sections.rentals) {
      const rentals = resultMap.rentals || [];
      const rentalTrailers = resultMap.rentalTrailers || [];
      const rentalUsers = resultMap.rentalUsers || [];
      const rentalImages = resultMap.rentalImages || [];
      
      // Create maps for faster lookups
      const trailerMap = rentalTrailers.reduce((map: Record<string, any>, trailer: any) => {
        map[trailer.id] = trailer;
        return map;
      }, {});
      
      const userMap = rentalUsers.reduce((map: Record<string, any>, user: any) => {
        map[user.id] = user;
        return map;
      }, {});
      
      const imageMap = rentalImages.reduce((map: Record<string, string>, img: any) => {
        if (!map[img.trailerId]) {
          map[img.trailerId] = img.url;
        }
        return map;
      }, {});
      
      formattedData.rentals = rentals.map((rental: any) => ({
        id: rental.id,
        startDate: rental.startDate,
        endDate: rental.endDate,
        status: rental.status,
        totalPrice: rental.totalPrice,
        trailerId: rental.trailerId,
        renter: rental.renterId ? {
          id: rental.renterId,
          firstName: userMap[rental.renterId]?.firstName || '',
          lastName: userMap[rental.renterId]?.lastName || '',
        } : null,
        lessor: rental.lessorId ? {
          id: rental.lessorId,
          firstName: userMap[rental.lessorId]?.firstName || '',
          lastName: userMap[rental.lessorId]?.lastName || '',
        } : null,
        trailerTitle: trailerMap[rental.trailerId]?.title || '',
        trailerImage: imageMap[rental.trailerId] || null,
      }));
    }
    
    // Format reviews if needed
    if (sections.reviews) {
      const writtenReviews = resultMap.writtenReviews || [];
      const receivedReviews = resultMap.receivedReviews || [];
      const reviewUsers = resultMap.reviewUsers || [];
      const reviewTrailers = resultMap.reviewTrailers || [];
      
      // Create maps for faster lookups
      const userMap = reviewUsers.reduce((map: Record<string, any>, user: any) => {
        map[user.id] = user;
        return map;
      }, {});
      
      const trailerMap = reviewTrailers.reduce((map: Record<string, any>, trailer: any) => {
        map[trailer.id] = trailer;
        return map;
      }, {});
      
      // Combine reviews
      const allReviews = [...writtenReviews, ...receivedReviews];
      
      // Sort by date
      allReviews.sort((a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      formattedData.reviews = allReviews.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        createdAt: review.createdAt,
        trailerTitle: trailerMap[review.trailerId]?.title || null,
        reviewerName: review.reviewerId && userMap[review.reviewerId] 
          ? `${userMap[review.reviewerId].firstName} ${userMap[review.reviewerId].lastName}` 
          : null,
        reviewedUserName: review.reviewedUserId && userMap[review.reviewedUserId] 
          ? `${userMap[review.reviewedUserId].firstName} ${userMap[review.reviewedUserId].lastName}` 
          : null,
      }));
    }
    
    // Format favorites if needed
    if (sections.favorites) {
      const favorites = resultMap.favorites || [];
      const favoriteTrailers = resultMap.favoriteTrailers || [];
      const favoriteImages = resultMap.favoriteImages || [];
      
      // Create maps for faster lookups
      const trailerMap = favoriteTrailers.reduce((map: Record<string, any>, trailer: any) => {
        map[trailer.id] = trailer;
        return map;
      }, {});
      
      const imageMap = favoriteImages.reduce((map: Record<string, string>, img: any) => {
        if (!map[img.trailerId]) {
          map[img.trailerId] = img.url;
        }
        return map;
      }, {});
      
      formattedData.favorites = favorites.map((favorite: any) => ({
        id: favorite.id,
        trailerId: favorite.trailerId,
        trailerTitle: trailerMap[favorite.trailerId]?.title || '',
        trailerImage: imageMap[favorite.trailerId] || null,
        pricePerDay: trailerMap[favorite.trailerId]?.pricePerDay || 0,
      }));
    }
    
    // Add other sections
    if (sections.wallet) {
      formattedData.wallet = resultMap.wallet;
    }
    
    if (sections.notifications) {
      formattedData.notifications = resultMap.notifications;
    }
    
    if (sections.documents) {
      formattedData.documents = resultMap.documents;
    }

    // Cache the results if caching is available
    try {
      await redis.set(cacheKey, formattedData, { ex: CACHE_TTL });
    } catch (cacheError) {
      console.warn("Cache write error:", cacheError);
    }

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Get full profile data error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching additional profile data" },
      { status: 500 }
    );
  }
}