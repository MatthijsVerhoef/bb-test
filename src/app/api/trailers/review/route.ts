import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const data = await request.json();

    // Validate required fields
    const {
      rentalId,
      trailerId,
      lessorId,
      rating,
      title,
      comment,
      cleanliness,
      maintenance,
      valueForMoney,
      accuracy,
      recommended,
    } = data;

    if (!rentalId || !trailerId || !rating || !comment) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the rental exists and belongs to the user
    const rental = await prisma.rental.findUnique({
      where: {
        id: rentalId,
        renterId: userId,
      },
    });

    if (!rental) {
      return NextResponse.json(
        { error: "Rental not found or doesn't belong to the user" },
        { status: 404 }
      );
    }

    // Check if a review already exists for this trailer by this user
    const existingReview = await prisma.review.findFirst({
      where: {
        trailerId,
        reviewerId: userId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this trailer" },
        { status: 400 }
      );
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        rating,
        title,
        comment,
        cleanliness,
        maintenance,
        valueForMoney,
        accuracy,
        recommended,
        trailer: {
          connect: {
            id: trailerId,
          },
        },
        reviewer: {
          connect: {
            id: userId,
          },
        },
        // Connect to the reviewed user (lessor)
        reviewedUser: {
          connect: {
            id: lessorId,
          },
        }
      },
    });

    // Update trailer's average rating
    const allTrailerReviews = await prisma.review.findMany({
      where: {
        trailerId,
      },
      select: {
        rating: true,
        cleanliness: true,
        maintenance: true,
        valueForMoney: true,
        accuracy: true,
      },
    });

    // Calculate new average ratings
    const reviewCount = allTrailerReviews.length;
    let totalRating = 0;
    let totalCleanliness = 0;
    let totalMaintenance = 0;
    let totalValueForMoney = 0;
    let totalAccuracy = 0;

    allTrailerReviews.forEach((review) => {
      totalRating += review.rating || 0;
      totalCleanliness += review.cleanliness || 0;
      totalMaintenance += review.maintenance || 0;
      totalValueForMoney += review.valueForMoney || 0;
      totalAccuracy += review.accuracy || 0;
    });

    // Update the trailer with new average ratings
    await prisma.trailer.update({
      where: {
        id: trailerId,
      },
      data: {
        averageRating: reviewCount > 0 ? totalRating / reviewCount : 0,
        reviewCount,
        averageCleanliness:
          reviewCount > 0 ? totalCleanliness / reviewCount : 0,
        averageMaintenance:
          reviewCount > 0 ? totalMaintenance / reviewCount : 0,
        averageValueForMoney:
          reviewCount > 0 ? totalValueForMoney / reviewCount : 0,
        averageAccuracy:
          reviewCount > 0 ? totalAccuracy / reviewCount : 0,
      },
    });

    // Get trailer title from the rental for the notification
    const trailer = await prisma.trailer.findUnique({
      where: { id: trailerId },
      select: { title: true }
    });

    // Send notification to lessor
    await prisma.notification.create({
      data: {
        userId: lessorId,
        type: "BOOKING",
        message: `Je hebt een nieuwe beoordeling (${rating}/5) ontvangen voor je aanhanger "${trailer?.title || 'Onbekend'}"`,
        read: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        review,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}