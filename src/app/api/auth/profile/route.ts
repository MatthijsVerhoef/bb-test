import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(request: Request) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    console.log("PROFILE ROUTE: Token details:", token);
    
    if (!token || !token.email) {
      console.log("PROFILE ROUTE: No valid token found");
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }
    
    // Fetch user basic info
    const user = await prisma.user.findUnique({
      where: { email: token.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        profilePicture: true,
        bio: true,
        companyName: true,
        kvkNumber: true,
        vatNumber: true,
        responseRate: true,
        responseTime: true,
        isVerified: true,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: true,
        languagePreference: true,
        lastLogin: true,
        role: true,
        memberSince: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch user stats
    const stats = await prisma.userStats.findUnique({
      where: { userId: user.id },
      select: {
        totalRentals: true,
        totalIncome: true,
        totalSpent: true,
        cancelledRentals: true,
        completedRentals: true,
        averageRating: true,
        responseRate: true,
        responseTime: true,
        acceptanceRate: true,
        lastUpdated: true,
      },
    });

    // Fetch user wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
      select: {
        balance: true,
        currency: true,
        lastPayout: true,
      },
    });

    // Fetch listings (for lessors)
    let listings = [];
    if (user.role === 'LESSOR') {
      listings = await prisma.trailer.findMany({
        where: { ownerId: user.id },
        select: {
          id: true,
          title: true,
          pricePerDay: true,
          views: true,
          status: true,
          type: true,
          images: {
            where: { type: 'IMAGE' },
            orderBy: { order: 'asc' },
            take: 1,
            select: {
              url: true,
            },
          },
        },
      });

      // Format the listings data
      listings = listings.map((listing) => ({
        id: listing.id,
        title: listing.title,
        pricePerDay: listing.pricePerDay,
        views: listing.views,
        status: listing.status,
        type: listing.type,
        mainImage: listing.images[0]?.url || null,
      }));
    }

    // Fetch rentals
    const rentals = await prisma.rental.findMany({
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
        trailer: {
          select: {
            title: true,
            images: {
              where: { type: 'IMAGE' },
              orderBy: { order: 'asc' },
              take: 1,
              select: {
                url: true,
              },
            },
          },
        },
        renter: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        lessor: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
    });

    // Format the rentals data
    const formattedRentals = rentals.map((rental) => ({
      id: rental.id,
      startDate: rental.startDate,
      endDate: rental.endDate,
      status: rental.status,
      totalPrice: rental.totalPrice,
      trailerId: rental.trailerId,
      renter: rental.renter,
      lessor: rental.lessor,
      trailerTitle: rental.trailer.title,
      trailerImage: rental.trailer.images[0]?.url || null,
    }));

    // Fetch reviews
    const reviews = await prisma.review.findMany({
      where: {
        OR: [
          { reviewerId: user.id },
          { reviewedUserId: user.id }
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        createdAt: true,
        trailer: {
          select: {
            title: true,
          },
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Format the reviews data
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      createdAt: review.createdAt,
      trailerTitle: review.trailer?.title || null,
      reviewerName: review.reviewer ? `${review.reviewer.firstName} ${review.reviewer.lastName}` : null,
    }));

    // Note: We still fetch favorites from the database, but they will be
    // overridden by context favorites in the useProfile hook.
    // This provides a fallback if context doesn't work for some reason.
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        trailerId: true,
        trailer: {
          select: {
            title: true,
            pricePerDay: true,
            images: {
              where: { type: 'IMAGE' },
              orderBy: { order: 'asc' },
              take: 1,
              select: {
                url: true,
              },
            },
          },
        },
      },
    });

    // Format the favorites data
    const formattedFavorites = favorites.map((favorite) => ({
      id: favorite.id,
      trailerId: favorite.trailerId,
      trailerTitle: favorite.trailer.title,
      trailerImage: favorite.trailer.images[0]?.url || null,
      pricePerDay: favorite.trailer.pricePerDay,
    }));

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        message: true,
        read: true,
        type: true,
        createdAt: true,
      },
    });

    // Fetch documents
    const documents = await prisma.document.findMany({
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

    // Combine all data
    const profileData = {
      user,
      stats: stats || {
        totalRentals: 0,
        totalIncome: 0,
        totalSpent: 0,
        cancelledRentals: 0,
        completedRentals: 0,
        averageRating: null,
        responseRate: null,
        responseTime: null,
        acceptanceRate: null,
      },
      wallet,
      listings,
      rentals: formattedRentals,
      reviews: formattedReviews,
      favorites: formattedFavorites, // We keep this for backward compatibility
      notifications,
      documents,
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Get user profile data error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching user profile data" },
      { status: 500 }
    );
  }
}