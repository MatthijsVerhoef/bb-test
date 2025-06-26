import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import TrailerDetailClientWrapper from "@/components/trailer-details/rental-success-wrapper";
import TrailerDetailClient from "./page-client";

export const revalidate = 300;

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  // Optimize metadata query to be more efficient
  const trailer = await prisma.$transaction(async (tx) => {
    return tx.trailer.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        city: true,
        type: true,
      },
    });
  });

  if (!trailer) {
    return {
      title: "Trailer Not Found",
      description: "The requested trailer could not be found.",
    };
  }

  return {
    title: `${trailer.title} | Trailer Rental`,
    description: trailer.description?.substring(0, 160),
    openGraph: {
      title: trailer.title,
      description: trailer.description?.substring(0, 160),
      type: "website",
    },
  };
}

async function getTrailerData(id: string) {
  const startDateFilter = new Date();
  const endDateFilter = new Date(
    new Date().setMonth(startDateFilter.getMonth() + 6)
  );

  // Optimize data fetching with prisma transaction
  const data = await prisma.$transaction(async (tx) => {
    // First check if trailer exists (lightweight query)
    const trailerExists = await tx.trailer.findUnique({
      where: { id },
      select: { id: true },
    });

    // If trailer doesn't exist, return early
    if (!trailerExists) return null;

    // Fetch all necessary data in parallel with specific selects
    const [
      trailerBasic,
      weeklyAvailability,
      rentals,
      availabilityExceptions,
      blockedPeriods, // Add blockedPeriods to the Promise.all array
      images,
      owner,
      reviews,
      reviewers,
      category,
      faqs,
      accessories,
    ] = await Promise.all([
      // Basic trailer info without relationships to avoid N+1 problem
      tx.trailer.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          pricePerDay: true,
          pricePerWeek: true,
          pricePerMonth: true,
          securityDeposit: true,
          available: true,
          location: true,
          address: true,
          city: true,
          postalCode: true,
          country: true,
          latitude: true,
          longitude: true,
          licensePlate: true,
          cancellationPolicy: true,
          maxRentalDuration: true,
          minRentalDuration: true,
          features: true,
          requiresDriversLicense: true,
          includesInsurance: true,
          homeDelivery: true,
          deliveryFee: true,
          maxDeliveryDistance: true,
          instructions: true,
          views: true,
          featured: true,
          status: true,
          type: true,
          manufacturer: true,
          model: true,
          year: true,
          weight: true,
          length: true,
          width: true,
          height: true,
          capacity: true,
          axles: true,
          brakes: true,
          towBallWeight: true,
          maxSpeed: true,
          vinNumber: true,
          lastMaintenance: true,
          nextMaintenance: true,
          maintenanceNotes: true,
          createdAt: true,
          updatedAt: true,
          ownerId: true,
          categoryId: true,
        },
      }),

      // Fetch weekly availability settings (always fetch all days)
      tx.weeklyAvailability.findMany({
        where: { trailerId: id },
        select: {
          id: true,
          day: true,
          available: true, // This is the correct field
          timeSlot1Start: true, // These are the correct time slot fields
          timeSlot1End: true,
          timeSlot2Start: true,
          timeSlot2End: true,
          timeSlot3Start: true,
          timeSlot3End: true,
          createdAt: true,
          updatedAt: true,
          trailerId: true,
        },
        orderBy: { day: "asc" }, // Order by day for consistent display
      }),

      // Fetch rentals for availability calendar
      tx.rental.findMany({
        where: {
          trailerId: id,
          status: { in: ["CONFIRMED", "ACTIVE"] },
          OR: [
            { startDate: { gte: startDateFilter, lte: endDateFilter } },
            { endDate: { gte: startDateFilter, lte: endDateFilter } },
            {
              startDate: { lte: startDateFilter },
              endDate: { gte: endDateFilter },
            },
          ],
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true,
          pickupTime: true,
          returnTime: true,
        },
        orderBy: { startDate: "asc" },
      }),

      // Fetch availability exceptions
      tx.availabilityException.findMany({
        where: {
          trailerId: id,
          date: { gte: startDateFilter, lte: endDateFilter },
        },
        select: {
          id: true,
          date: true,
          morning: true,
          afternoon: true,
          evening: true,
          morningStart: true,
          morningEnd: true,
          afternoonStart: true,
          afternoonEnd: true,
          eveningStart: true,
          eveningEnd: true,
        },
      }),

      // Fetch blocked periods
      tx.blockedPeriod.findMany({
        where: {
          OR: [
            // Periods specific to this trailer
            { trailerId: id },
            // Periods that apply to all trailers (trailerId is null)
            {
              trailerId: null,
              // Only include global blocks from the trailer's owner
              user: {
                trailers: {
                  some: {
                    id,
                  },
                },
              },
            },
          ],
          // Ensure the period overlaps with our date range
          OR: [
            {
              // Period starts in our range
              startDate: {
                gte: startDateFilter,
                lte: endDateFilter,
              },
            },
            {
              // Period ends in our range
              endDate: {
                gte: startDateFilter,
                lte: endDateFilter,
              },
            },
            {
              // Period spans our entire range
              startDate: {
                lte: startDateFilter,
              },
              endDate: {
                gte: endDateFilter,
              },
            },
          ],
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          reason: true,
          trailerId: true,
          allDay: true,
          morning: true,
          afternoon: true,
          evening: true,
        },
      }),

      // Fetch trailer images
      tx.media.findMany({
        where: { trailerId: id },
        select: {
          id: true,
          url: true,
          title: true,
          order: true,
        },
        orderBy: { order: "asc" },
      }),

      // Fetch owner data
      tx.user.findUnique({
        where: {
          id: await tx.trailer
            .findUnique({
              where: { id },
              select: { ownerId: true },
            })
            .then((t) => t?.ownerId || ""),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
          bio: true,
          email: true,
          phone: true,
          memberSince: true,
          responseRate: true,
          responseTime: true,
        },
      }),

      // Fetch reviews
      tx.review.findMany({
        where: { trailerId: id },
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          response: true,
          responseDate: true,
          photos: true,
          cleanliness: true,
          maintenance: true,
          valueForMoney: true,
          communication: true,
          accuracy: true,
          recommended: true,
          createdAt: true,
          updatedAt: true,
          reviewerId: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10, // Limit to 10 reviews initially
      }),

      // Fetch all reviewers in one query
      tx.user.findMany({
        where: {
          id: {
            in: await tx.review
              .findMany({
                where: { trailerId: id },
                select: { reviewerId: true },
                take: 10,
              })
              .then((reviews) => reviews.map((r) => r.reviewerId)),
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      }),

      // Fetch category data
      tx.trailerCategory.findUnique({
        where: {
          id: await tx.trailer
            .findUnique({
              where: { id },
              select: { categoryId: true },
            })
            .then((t) => t?.categoryId || ""),
        },
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          mainCategoryId: true,
        },
      }),

      // Fetch FAQs
      tx.trailerFAQ.findMany({
        where: { trailerId: id },
        select: {
          id: true,
          question: true,
          answer: true,
        },
        orderBy: { createdAt: "asc" },
      }),

      // Fetch accessories
      tx.accessory.findMany({
        where: { trailerId: id },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
        },
      }),
    ]);

    // If trailer doesn't exist, return null
    if (!trailerBasic) return null;

    // Create lookup for reviewers
    const reviewersById = reviewers.reduce((acc, reviewer) => {
      acc[reviewer.id] = reviewer;
      return acc;
    }, {});

    // Connect reviewers to reviews
    const reviewsWithReviewers = reviews.map((review) => ({
      ...review,
      reviewer: reviewersById[review.reviewerId] || null,
    }));

    // Assemble the complete trailer object
    const trailer = {
      ...trailerBasic,
      weeklyAvailability,
      owner: owner || {
        id: trailerBasic.ownerId,
        firstName: "Unknown",
        lastName: "User",
      },
      images,
      reviews: reviewsWithReviewers,
      category,
      faqs,
      accessories,
    };

    return {
      trailer,
      rentals,
      availabilityExceptions,
      blockedPeriods,
    };
  });

  // If transaction returns null, return null
  if (!data) return null;

  const { trailer, rentals, availabilityExceptions, blockedPeriods } = data;

  // Format dates for serialization
  const formattedRentals = rentals.map((rental) => ({
    ...rental,
    startDate: rental.startDate.toISOString(),
    endDate: rental.endDate.toISOString(),
    pickupTime: rental.pickupTime?.toISOString() || null,
    returnTime: rental.returnTime?.toISOString() || null,
  }));

  const formattedExceptions = availabilityExceptions.map((exception) => ({
    ...exception,
    date: exception.date.toISOString(),
  }));

  // Format blocked periods for serialization
  const formattedBlockedPeriods = blockedPeriods.map((period) => ({
    ...period,
    startDate: period.startDate.toISOString(),
    endDate: period.endDate.toISOString(),
  }));

  // Return the trailer object and availability data separately
  return {
    trailer,
    availabilityData: {
      rentals: formattedRentals,
      availabilityExceptions: formattedExceptions,
      weeklyAvailability: trailer.weeklyAvailability,
      blockedPeriods: formattedBlockedPeriods, // Include the formatted blocked periods
    },
  };
}

interface TrailerDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TrailerDetailPage({
  params,
}: TrailerDetailPageProps) {
  const { id } = await params;

  // Fetch trailer data with optimized query
  const result = await getTrailerData(id);

  // If trailer not found, return 404
  if (!result || !result.trailer) {
    notFound();
  }

  const { trailer, availabilityData } = result;

  // Calculate average rating
  const avgRating =
    trailer.reviews.length > 0
      ? trailer.reviews.reduce((sum, review) => sum + review.rating, 0) /
        trailer.reviews.length
      : null;

  // Format trailer data for components
  const trailerData = {
    ...trailer,
    avgRating,
    imageUrls: trailer.images.map((img) => img.url),
  };

  // Format feature data from JSON
  const features =
    typeof trailer.features === "string"
      ? JSON.parse(trailer.features as string)
      : trailer.features;

  const shareData = {
    id: trailer.id,
    title: trailer.title,
    city: trailer.city,
    country: trailer.country,
    pricePerDay: trailer.pricePerDay,
    imageUrls: trailerData.imageUrls,
  };

  return (
    <TrailerDetailClientWrapper
      trailerId={id}
      availabilityData={availabilityData}
    >
      <div className="container mx-auto pb-24 pt-10 md:pt-22 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <TrailerDetailClient
          trailer={trailer}
          trailerData={trailerData}
          avgRating={avgRating}
          features={features}
          shareData={shareData}
          availabilityData={availabilityData}
        />
      </div>
    </TrailerDetailClientWrapper>
  );
}
