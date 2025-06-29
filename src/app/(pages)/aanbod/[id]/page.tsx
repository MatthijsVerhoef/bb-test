import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import TrailerDetailClientWrapper from "@/components/trailer-details/rental-success-wrapper";
import TrailerDetailClient from "./page-client";
import {
  PerformanceLogger,
  logServerPerformance,
} from "@/lib/performance-logger";

export const revalidate = 300;

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const metadataStart = Date.now();
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

  logServerPerformance(`Metadata generation for ${id}`, metadataStart);

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
  const totalStart = Date.now();
  const logger = new PerformanceLogger();

  try {
    logger.start("Total getTrailerData");

    const startDateFilter = new Date();
    const endDateFilter = new Date(
      new Date().setMonth(startDateFilter.getMonth() + 6)
    );

    // Optimize data fetching with prisma transaction
    const data = await logger.measure("Prisma Transaction", async () => {
      return prisma.$transaction(async (tx) => {
        // First check if trailer exists (lightweight query)
        const trailerExists = await logger.measure(
          "Check Trailer Exists",
          async () => {
            return tx.trailer.findUnique({
              where: { id },
              select: { id: true },
            });
          }
        );

        // If trailer doesn't exist, return early
        if (!trailerExists) return null;

        // Fetch all necessary data in parallel with specific selects
        const [
          trailerBasic,
          weeklyAvailability,
          rentals,
          availabilityExceptions,
          blockedPeriods,
          images,
          owner,
          reviews,
          reviewers,
          category,
          faqs,
          accessories,
        ] = await logger.measure("Parallel Data Fetch", async () => {
          return Promise.all([
            // Basic trailer info
            logger.measure("Fetch Basic Trailer", () =>
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
              })
            ),

            // Weekly availability
            logger.measure("Fetch Weekly Availability", () =>
              tx.weeklyAvailability.findMany({
                where: { trailerId: id },
                select: {
                  id: true,
                  day: true,
                  available: true,
                  timeSlot1Start: true,
                  timeSlot1End: true,
                  timeSlot2Start: true,
                  timeSlot2End: true,
                  timeSlot3Start: true,
                  timeSlot3End: true,
                  createdAt: true,
                  updatedAt: true,
                  trailerId: true,
                },
                orderBy: { day: "asc" },
              })
            ),

            // Rentals
            logger.measure("Fetch Rentals", () =>
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
              })
            ),

            // Availability exceptions
            logger.measure("Fetch Availability Exceptions", () =>
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
              })
            ),

            // Blocked periods
            logger.measure("Fetch Blocked Periods", () =>
              tx.blockedPeriod.findMany({
                where: {
                  OR: [
                    { trailerId: id },
                    {
                      trailerId: null,
                      user: {
                        trailers: {
                          some: { id },
                        },
                      },
                    },
                  ],
                  OR: [
                    {
                      startDate: {
                        gte: startDateFilter,
                        lte: endDateFilter,
                      },
                    },
                    {
                      endDate: {
                        gte: startDateFilter,
                        lte: endDateFilter,
                      },
                    },
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
                  reason: true,
                  trailerId: true,
                  allDay: true,
                  morning: true,
                  afternoon: true,
                  evening: true,
                },
              })
            ),

            // Images
            logger.measure("Fetch Images", () =>
              tx.media.findMany({
                where: { trailerId: id },
                select: {
                  id: true,
                  url: true,
                  title: true,
                  order: true,
                },
                orderBy: { order: "asc" },
              })
            ),

            // Owner
            logger.measure("Fetch Owner", async () => {
              const ownerId = await tx.trailer
                .findUnique({
                  where: { id },
                  select: { ownerId: true },
                })
                .then((t) => t?.ownerId || "");

              return tx.user.findUnique({
                where: { id: ownerId },
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
              });
            }),

            // Reviews
            logger.measure("Fetch Reviews", () =>
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
                take: 10,
              })
            ),

            // Reviewers
            logger.measure("Fetch Reviewers", async () => {
              const reviewerIds = await tx.review
                .findMany({
                  where: { trailerId: id },
                  select: { reviewerId: true },
                  take: 10,
                })
                .then((reviews) => reviews.map((r) => r.reviewerId));

              return tx.user.findMany({
                where: {
                  id: { in: reviewerIds },
                },
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                },
              });
            }),

            // Category
            logger.measure("Fetch Category", async () => {
              const categoryId = await tx.trailer
                .findUnique({
                  where: { id },
                  select: { categoryId: true },
                })
                .then((t) => t?.categoryId || "");

              return tx.trailerCategory.findUnique({
                where: { id: categoryId },
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
              });
            }),

            // FAQs
            logger.measure("Fetch FAQs", () =>
              tx.trailerFAQ.findMany({
                where: { trailerId: id },
                select: {
                  id: true,
                  question: true,
                  answer: true,
                },
                orderBy: { createdAt: "asc" },
              })
            ),

            // Accessories
            logger.measure("Fetch Accessories", () =>
              tx.accessory.findMany({
                where: { trailerId: id },
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                },
              })
            ),
          ]);
        });

        // If trailer doesn't exist, return null
        if (!trailerBasic) return null;

        // Process and assemble data
        const processingStart = Date.now();

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

        logServerPerformance("Data Processing", processingStart);

        return {
          trailer,
          rentals,
          availabilityExceptions,
          blockedPeriods,
        };
      });
    });

    // If transaction returns null, return null
    if (!data) return null;

    const { trailer, rentals, availabilityExceptions, blockedPeriods } = data;

    // Format dates for serialization
    const formattingStart = Date.now();

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

    const formattedBlockedPeriods = blockedPeriods.map((period) => ({
      ...period,
      startDate: period.startDate.toISOString(),
      endDate: period.endDate.toISOString(),
    }));

    logServerPerformance("Date Formatting", formattingStart);

    logger.end("Total getTrailerData");
    logger.getSummary();

    return {
      trailer,
      availabilityData: {
        rentals: formattedRentals,
        availabilityExceptions: formattedExceptions,
        weeklyAvailability: trailer.weeklyAvailability,
        blockedPeriods: formattedBlockedPeriods,
      },
    };
  } catch (error) {
    logger.end("Total getTrailerData");
    logger.getSummary();
    throw error;
  } finally {
    logServerPerformance(`Total getTrailerData for ${id}`, totalStart);
  }
}

interface TrailerDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TrailerDetailPage({
  params,
}: TrailerDetailPageProps) {
  const pageStart = Date.now();
  const { id } = await params;

  // Fetch trailer data with optimized query
  const result = await getTrailerData(id);

  // If trailer not found, return 404
  if (!result || !result.trailer) {
    notFound();
  }

  const { trailer, availabilityData } = result;

  // Calculate average rating
  const processingStart = Date.now();
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

  logServerPerformance("Page Processing", processingStart);
  logServerPerformance(`Total Page Load for ${id}`, pageStart);

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
