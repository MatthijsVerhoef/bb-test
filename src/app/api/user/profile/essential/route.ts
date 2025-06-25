// app/api/user/profile/essential/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

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
    
    // Fetch user data - instead of using _count, we'll query the counts separately
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
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Perform separate count queries in parallel
    const [
      rentalsCount,
      writtenReviewsCount,
      receivedReviewsCount,
      favoritesCount,
      listingsCount,
      unreadNotificationsCount,
      stats,
      notifications
    ] = await Promise.all([
      // Count rentals
      prisma.rental.count({
        where: {
          OR: [
            { renterId: user.id },
            { lessorId: user.id }
          ]
        },
      }),
      
      // Count written reviews
      prisma.review.count({
        where: { reviewerId: user.id },
      }),
      
      // Count received reviews
      prisma.review.count({
        where: { reviewedUserId: user.id },
      }),
      
      // Count favorites
      prisma.favorite.count({
        where: { userId: user.id },
      }),
      
      // Count listings if user is a lessor
      user.role === 'LESSOR' 
        ? prisma.trailer.count({
            where: { ownerId: user.id },
          }) 
        : Promise.resolve(0),
      
      // Count unread notifications
      prisma.notification.count({
        where: { 
          userId: user.id,
          read: false 
        },
      }),
      
      // Fetch user stats
      prisma.userStats.findUnique({
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
        },
      }),
      
      // Fetch notifications for initial display
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5, // Only fetch latest 5 notifications for initial display
        select: {
          id: true,
          message: true,
          read: true,
          type: true,
          createdAt: true,
        },
      }),
    ]);

    // Combine essential data
    const essentialProfileData = {
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
      notifications,
      counts: {
        rentals: rentalsCount,
        reviews: writtenReviewsCount + receivedReviewsCount, // Combined reviews count
        favorites: favoritesCount,
        listings: listingsCount,
        unreadNotifications: unreadNotificationsCount
      }
    };

    return NextResponse.json(essentialProfileData);
  } catch (error) {
    console.error("Get essential profile data error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching essential profile data" },
      { status: 500 }
    );
  }
}