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

  // Remove unnecessary transaction for single query
  const trailer = await prisma.trailer.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      city: true,
      type: true,
    },
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
  const perfLogger = new PerformanceLogger();

  try {
    perfLogger.start("Total getTrailerData");
    logger.log(`[REQ ${requestId}] Starting getTrailerData for ${id}`);

    const startDateFilter = new Date();
    const endDateFilter = new Date(
      new Date().setMonth(startDateFilter.getMonth() + 6)
    );

    // First, check if trailer exists (outside of transaction)
    const trailerExists = await perfLogger.measure(
      "Check Trailer Exists",
      async () => {
        const checkStart = Date.now();
        const result = await prisma.trailer.findUnique({
          where: { id },
          select: { id: true, ownerId: true, categoryId: true },
        });
        logger.log(
          `[REQ ${requestId}] Trailer exists check: ${
            Date.now() - checkStart
          }ms`
        );
        return result;
      }
    );

    if (!trailerExists) {
      logger.log(`[REQ ${requestId}] Trailer ${id} not found`);
      return null;
    }

    // Use interactive transaction with proper timeout settings
    const data = await prisma.$transaction(
      async (tx) => {
        const transactionStart = Date.now();
        logger.log(`[REQ ${requestId}] Starting Prisma transaction`);

        // Fetch basic trailer data with all fields
        const trailerBasic = await perfLogger.measure(
          "Fetch Basic Trailer",
          async () => {
            const start = Date.now();
            const result = await tx.trailer.findUnique({
              where: { id },
              include: {
                // Include related data to reduce queries
                weeklyAvailability: {
                  orderBy: { day: "asc" },
                },
                images: {
                  orderBy: { order: "asc" },
                  select: {
                    id: true,
                    url: true,
                    title: true,
                    order: true,
                  },
                },
                owner: {
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
                },
                category: true,
                faqs: {
                  orderBy: { createdAt: "asc" },
                },
                accessories: true,
                reviews: {
                  orderBy: { createdAt: "desc" },
                  take: 10,
                  include: {
                    reviewer: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profilePicture: true,
                      },
                    },
                  },
                },
              },
            });
            logger.log(
              `[REQ ${requestId}] Basic trailer with includes fetched in ${
                Date.now() - start
              }ms`
            );
            return result;
          }
        );

        if (!trailerBasic) {
          logger.log(`[REQ ${requestId}] Trailer basic data not found`);
          return null;
        }

        // Fetch availability data in parallel
        const [rentals, availabilityExceptions, blockedPeriods] =
          await Promise.all([
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
                        listings: {
                          some: { id },
                        },
                      },
                    },
                  ],
                  AND: {
                    OR: [
                      {
                        startDate: { gte: startDateFilter, lte: endDateFilter },
                      },
                      {
                        endDate: { gte: startDateFilter, lte: endDateFilter },
                      },
                      {
                        startDate: { lte: startDateFilter },
                        endDate: { gte: endDateFilter },
                      },
                    ],
                  },
                },
              });
              logger.log(
                `[REQ ${requestId}] Blocked periods fetched in ${
                  Date.now() - start
                }ms (${result.length} records)`
              );
              return result;
            }),
          ]);

        logger.log(
          `[REQ ${requestId}] Transaction completed in ${
            Date.now() - transactionStart
          }ms`
        );

        return {
          trailer: trailerBasic,
          rentals,
          availabilityExceptions,
          blockedPeriods,
        };
      },
      {
        maxWait: 10000, // Maximum time to wait for a transaction slot (10 seconds)
        timeout: 30000, // Maximum time for the transaction to complete (30 seconds)
      }
    );

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
