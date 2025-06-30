import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import TrailerDetailClientWrapper from "@/components/trailer-details/rental-success-wrapper";
import TrailerDetailClient from "./page-client";
import { PerformanceLogger, logServerPerformance, logger } from "@/lib/logger";
import { headers } from "next/headers";

export const revalidate = 300;

// Helper to get request ID from headers
async function getRequestId() {
  try {
    const headersList = await headers();
    return headersList.get("x-request-id") || "no-id";
  } catch {
    return "no-id";
  }
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const metadataStart = Date.now();
  const { id } = await params;
  const requestId = await getRequestId();

  logger.log(
    `[REQ ${requestId}] Starting metadata generation for trailer ${id}`
  );

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

  const duration = Date.now() - metadataStart;
  logger.log(
    `[REQ ${requestId}] Metadata generation completed in ${duration}ms`
  );
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
  const requestId = await getRequestId();
  const perfLogger = new PerformanceLogger(); // Renamed to avoid confusion

  try {
    perfLogger.start("Total getTrailerData");
    logger.log(`[REQ ${requestId}] Starting getTrailerData for ${id}`);

    const startDateFilter = new Date();
    const endDateFilter = new Date(
      new Date().setMonth(startDateFilter.getMonth() + 6)
    );

    // Log cache check
    const cacheCheckStart = Date.now();
    // If you have any caching mechanism, log it here
    logger.log(
      `[REQ ${requestId}] Cache check completed in ${
        Date.now() - cacheCheckStart
      }ms`
    );

    // Optimize data fetching with prisma transaction
    const data = await perfLogger.measure("Prisma Transaction", async () => {
      const transactionStart = Date.now();
      logger.log(`[REQ ${requestId}] Starting Prisma transaction`);

      return prisma.$transaction(async (tx) => {
        // First check if trailer exists (lightweight query)
        const trailerExists = await perfLogger.measure(
          "Check Trailer Exists",
          async () => {
            const checkStart = Date.now();
            const result = await tx.trailer.findUnique({
              where: { id },
              select: { id: true },
            });
            logger.log(
              `[REQ ${requestId}] Trailer exists check: ${
                Date.now() - checkStart
              }ms`
            );
            return result;
          }
        );

        // If trailer doesn't exist, return early
        if (!trailerExists) {
          logger.log(`[REQ ${requestId}] Trailer ${id} not found`);
          return null;
        }

        logger.log(`[REQ ${requestId}] Starting parallel data fetch`);
        const parallelStart = Date.now();

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
        ] = await perfLogger.measure("Parallel Data Fetch", async () => {
          return Promise.all([
            // Basic trailer info
            perfLogger.measure("Fetch Basic Trailer", async () => {
              const start = Date.now();
              const result = await tx.trailer.findUnique({
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
              });
              logger.log(
                `[REQ ${requestId}] Basic trailer fetched in ${
                  Date.now() - start
                }ms`
              );
              return result;
            }),

            // Weekly availability
            perfLogger.measure("Fetch Weekly Availability", async () => {
              const start = Date.now();
              const result = await tx.weeklyAvailability.findMany({
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
              });
              logger.log(
                `[REQ ${requestId}] Weekly availability fetched in ${
                  Date.now() - start
                }ms (${result.length} records)`
              );
              return result;
            }),

            // Rentals
            perfLogger.measure("Fetch Rentals", async () => {
              const start = Date.now();
              const result = await tx.rental.findMany({
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
              });
              logger.log(
                `[REQ ${requestId}] Rentals fetched in ${
                  Date.now() - start
                }ms (${result.length} records)`
              );
              return result;
            }),

            // Availability exceptions
            perfLogger.measure("Fetch Availability Exceptions", async () => {
              const start = Date.now();
              const result = await tx.availabilityException.findMany({
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
              });
              logger.log(
                `[REQ ${requestId}] Availability exceptions fetched in ${
                  Date.now() - start
                }ms (${result.length} records)`
              );
              return result;
            }),

            // Blocked periods
            perfLogger.measure("Fetch Blocked Periods", async () => {
              const start = Date.now();
              const result = await tx.blockedPeriod.findMany({
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
              });
              logger.log(
                `[REQ ${requestId}] Blocked periods fetched in ${
                  Date.now() - start
                }ms (${result.length} records)`
              );
              return result;
            }),

            // Images
            perfLogger.measure("Fetch Images", async () => {
              const start = Date.now();
              const result = await tx.media.findMany({
                where: { trailerId: id },
                select: {
                  id: true,
                  url: true,
                  title: true,
                  order: true,
                },
                orderBy: { order: "asc" },
              });
              logger.log(
                `[REQ ${requestId}] Images fetched in ${
                  Date.now() - start
                }ms (${result.length} images)`
              );
              return result;
            }),

            // Owner
            perfLogger.measure("Fetch Owner", async () => {
              const start = Date.now();
              const ownerId = await tx.trailer
                .findUnique({
                  where: { id },
                  select: { ownerId: true },
                })
                .then((t) => t?.ownerId || "");

              const result = await tx.user.findUnique({
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
              logger.log(
                `[REQ ${requestId}] Owner fetched in ${Date.now() - start}ms`
              );
              return result;
            }),

            // Reviews
            perfLogger.measure("Fetch Reviews", async () => {
              const start = Date.now();
              const result = await tx.review.findMany({
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
              });
              logger.log(
                `[REQ ${requestId}] Reviews fetched in ${
                  Date.now() - start
                }ms (${result.length} reviews)`
              );
              return result;
            }),

            // Reviewers
            perfLogger.measure("Fetch Reviewers", async () => {
              const start = Date.now();
              const reviewerIds = await tx.review
                .findMany({
                  where: { trailerId: id },
                  select: { reviewerId: true },
                  take: 10,
                })
                .then((reviews) => reviews.map((r) => r.reviewerId));

              const result = await tx.user.findMany({
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
              logger.log(
                `[REQ ${requestId}] Reviewers fetched in ${
                  Date.now() - start
                }ms (${result.length} reviewers)`
              );
              return result;
            }),

            // Category
            perfLogger.measure("Fetch Category", async () => {
              const start = Date.now();
              const categoryId = await tx.trailer
                .findUnique({
                  where: { id },
                  select: { categoryId: true },
                })
                .then((t) => t?.categoryId || "");

              const result = await tx.trailerCategory.findUnique({
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
              logger.log(
                `[REQ ${requestId}] Category fetched in ${Date.now() - start}ms`
              );
              return result;
            }),

            // FAQs
            perfLogger.measure("Fetch FAQs", async () => {
              const start = Date.now();
              const result = await tx.trailerFAQ.findMany({
                where: { trailerId: id },
                select: {
                  id: true,
                  question: true,
                  answer: true,
                },
                orderBy: { createdAt: "asc" },
              });
              logger.log(
                `[REQ ${requestId}] FAQs fetched in ${Date.now() - start}ms (${
                  result.length
                } FAQs)`
              );
              return result;
            }),

            // Accessories
            perfLogger.measure("Fetch Accessories", async () => {
              const start = Date.now();
              const result = await tx.accessory.findMany({
                where: { trailerId: id },
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                },
              });
              logger.log(
                `[REQ ${requestId}] Accessories fetched in ${
                  Date.now() - start
                }ms (${result.length} accessories)`
              );
              return result;
            }),
          ]);
        });

        logger.log(
          `[REQ ${requestId}] Parallel fetch completed in ${
            Date.now() - parallelStart
          }ms`
        );

        // If trailer doesn't exist, return null
        if (!trailerBasic) {
          logger.log(`[REQ ${requestId}] Trailer basic data not found`);
          return null;
        }

        // Process and assemble data
        const processingStart = Date.now();
        logger.log(`[REQ ${requestId}] Starting data processing`);

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

        logger.log(
          `[REQ ${requestId}] Data processing completed in ${
            Date.now() - processingStart
          }ms`
        );
        logServerPerformance("Data Processing", processingStart);

        logger.log(
          `[REQ ${requestId}] Transaction completed in ${
            Date.now() - transactionStart
          }ms`
        );

        return {
          trailer,
          rentals,
          availabilityExceptions,
          blockedPeriods,
        };
      });
    });

    // If transaction returns null, return null
    if (!data) {
      logger.log(`[REQ ${requestId}] Transaction returned null`);
      return null;
    }

    const { trailer, rentals, availabilityExceptions, blockedPeriods } = data;

    // Format dates for serialization
    const formattingStart = Date.now();
    logger.log(`[REQ ${requestId}] Starting date formatting`);

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

    logger.log(
      `[REQ ${requestId}] Date formatting completed in ${
        Date.now() - formattingStart
      }ms`
    );
    logServerPerformance("Date Formatting", formattingStart);

    perfLogger.end("Total getTrailerData");
    perfLogger.getSummary();

    const totalDuration = Date.now() - totalStart;
    logger.log(
      `[REQ ${requestId}] Total getTrailerData completed in ${totalDuration}ms`
    );

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
    logger.error(`[REQ ${requestId}] Error in getTrailerData:`, error);
    perfLogger.end("Total getTrailerData");
    perfLogger.getSummary();
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
  const requestId = await getRequestId();

  logger.log(`[REQ ${requestId}] TrailerDetailPage started for ${id}`);

  // Fetch trailer data with optimized query
  const dataFetchStart = Date.now();
  const result = await getTrailerData(id);
  logger.log(
    `[REQ ${requestId}] getTrailerData completed in ${
      Date.now() - dataFetchStart
    }ms`
  );

  // If trailer not found, return 404
  if (!result || !result.trailer) {
    logger.log(`[REQ ${requestId}] Trailer not found, returning 404`);
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

  logger.log(
    `[REQ ${requestId}] Page processing completed in ${
      Date.now() - processingStart
    }ms`
  );
  logServerPerformance("Page Processing", processingStart);

  const totalPageTime = Date.now() - pageStart;
  logger.log(
    `[REQ ${requestId}] Total page generation completed in ${totalPageTime}ms`
  );
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
