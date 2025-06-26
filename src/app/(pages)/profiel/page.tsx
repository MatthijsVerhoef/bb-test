import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileClient from "@/components/profile/ProfileClient";
import ProfileLoading from "@/components/profile/ProfileLoading";
import { unstable_cache } from "next/cache";

// Type definitions
type UserRole = "ADMIN" | "USER" | "LESSOR" | "SUPPORT";

interface ProfilePageProps {
  searchParams: Promise<{ tab?: string; mode?: string }>;
}

// Cached user query with 5 minute revalidation
const getCachedUser = unstable_cache(
  async (userId: string) => {
    return prisma.user.findUnique({
      where: { id: userId },
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
        isVerified: true,
        role: true,
      },
    });
  },
  ["user-profile"],
  {
    revalidate: 300, // 5 minutes
    tags: ["user-profile"],
  }
);

// Optimized lessor stats query for initial load
async function getLessorQuickStats(userId: string) {
  try {
    const [stats, trailerCount, activeRentals] = await Promise.all([
      // Get or create user stats
      prisma.userStats.findUnique({
        where: { userId },
        select: {
          totalRentals: true,
          totalIncome: true,
          averageRating: true,
          responseRate: true,
        },
      }),
      // Quick trailer count
      prisma.trailer.count({
        where: { ownerId: userId },
      }),
      // Active rentals count
      prisma.rental.count({
        where: {
          lessorId: userId,
          status: { in: ["ACTIVE", "CONFIRMED"] },
        },
      }),
    ]);

    return {
      quickStats: {
        totalTrailers: trailerCount,
        activeRentals,
        totalIncome: stats?.totalIncome || 0,
        averageRating: stats?.averageRating || null,
      },
    };
  } catch (error) {
    console.error("Error fetching lessor quick stats:", error);
    return null;
  }
}

// Optimized rental history fetcher with better performance
async function fetchRentalHistory(
  userId: string,
  role: UserRole,
  limit: number = 10
) {
  const isLessor = role === "LESSOR";

  try {
    // Use Promise.all for parallel execution
    const [rentals, counts] = await Promise.all([
      // Fetch rentals
      prisma.rental.findMany({
        where: isLessor ? { lessorId: userId } : { renterId: userId },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true,
          totalPrice: true,
          trailerId: true,
          pickupLocation: true,
          returnLocation: true,
          pickupTime: true,
          returnTime: true,
          serviceFee: true,
          insuranceFee: true,
          deliveryFee: true,
          securityDeposit: true,
          actualReturnDate: true,
          needsDelivery: true,
          specialNotes: true,
          cancellationReason: true,
          cancellationDate: true,
          lessorId: true,
          renterId: true,
          createdAt: true,
          updatedAt: true,
          trailer: {
            select: {
              id: true,
              title: true,
              type: true,
              licensePlate: true,
              images: {
                select: {
                  url: true,
                  type: true,
                },
                take: 1,
                orderBy: { order: "asc" },
              },
            },
          },
          ...(isLessor
            ? {
                renter: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    email: true,
                    profilePicture: true,
                    isVerified: true,
                  },
                },
              }
            : {
                lessor: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    email: true,
                  },
                },
              }),
          payment: {
            select: {
              id: true,
              status: true,
              amount: true,
              paymentMethod: true,
              paymentDate: true,
            },
          },
          damageReports: {
            select: {
              id: true,
              description: true,
              damageStatus: true,
              reportedById: true,
              createdAt: true,
            },
          },
          ...(isLessor
            ? {
                insuranceClaims: {
                  select: {
                    id: true,
                    status: true,
                    amount: true,
                  },
                },
                rentalExtensions: {
                  select: {
                    id: true,
                    newEndDate: true,
                    approved: true,
                    additionalCost: true,
                  },
                },
              }
            : {}),
        },
        orderBy: { startDate: "desc" },
        take: limit,
      }),

      // Get counts only if lessor
      isLessor
        ? prisma.rental.groupBy({
            by: ["status"],
            where: { lessorId: userId },
            _count: { _all: true },
          })
        : Promise.resolve([]),
    ]);

    // Process counts for lessor
    let processedCounts = {
      upcoming: 0,
      current: 0,
      past: 0,
    };

    if (isLessor && counts.length > 0) {
      (counts as any).forEach(({ status, _count }: any) => {
        if (status === "PENDING" || status === "CONFIRMED") {
          processedCounts.upcoming += _count._all;
        } else if (
          status === "ACTIVE" ||
          status === "LATE_RETURN" ||
          status === "DISPUTED"
        ) {
          processedCounts.current += _count._all;
        } else if (status === "COMPLETED" || status === "CANCELLED") {
          processedCounts.past += _count._all;
        }
      });
    }

    // Format response based on role
    if (isLessor) {
      return {
        lessorHistory: {
          rentals: rentals.map((rental) => ({
            ...rental,
            trailerTitle: rental.trailer.title,
            trailerImage: rental.trailer.images[0]?.url || null,
            renter: (rental as any).renter,
          })),
          counts: processedCounts,
        },
      };
    }

    // For renters
    return {
      rentals: rentals.map((rental) => ({
        ...rental,
        trailerTitle: rental.trailer.title,
        trailerImage: rental.trailer.images[0]?.url || null,
        lessor: (rental as any).lessor,
      })),
    };
  } catch (error) {
    console.error("Error fetching rental history:", error);
    return null;
  }
}

// Main data fetching function
async function getInitialDataForTab(
  userId: string,
  tab: string | null,
  userRole: UserRole
) {
  try {
    // For lessor dashboard tab, include quick stats
    if (userRole === "LESSOR" && (!tab || tab === "lessor-dashboard")) {
      const [quickStats, rentalHistory] = await Promise.all([
        getLessorQuickStats(userId),
        fetchRentalHistory(userId, userRole),
      ]);

      return {
        ...quickStats,
        ...rentalHistory,
      };
    }

    // For rental tabs, fetch rental history with appropriate limit
    if (tab === "rentals" || tab === "lessor-rentals") {
      return await fetchRentalHistory(userId, userRole, 20); // Load more for rental-specific tabs
    }

    // For profile/default tab
    if (!tab || tab === "profile") {
      // For lessors, prefetch some data
      if (userRole === "LESSOR") {
        return await getLessorQuickStats(userId);
      }
    }

    return null;
  } catch (error) {
    console.error("Error prefetching data:", error);
    return null;
  }
}

// Generate static params for common tabs
export async function generateStaticParams() {
  return [
    { tab: "profile", mode: "renter" },
    { tab: "lessor-dashboard", mode: "lessor" },
    { tab: "rentals", mode: "renter" },
    { tab: "lessor-rentals", mode: "lessor" },
  ];
}

// Main page component
export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  // Get params
  const params = await searchParams;

  // Get session with minimal data
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Determine if we need full user data or can use session data
  const needsFullUserData = !session.user.firstName || !session.user.role;

  // Fetch data in parallel
  const [user, initialData] = await Promise.all([
    // Get user data (cached or fresh)
    needsFullUserData
      ? getCachedUser(session.user.id)
      : Promise.resolve(session.user as any), // Use session data if complete

    // Get initial data based on tab and role
    getInitialDataForTab(
      session.user.id,
      params.tab || null,
      (session.user.role || "USER") as UserRole
    ),
  ]);

  if (!user) {
    redirect("/login");
  }

  // Add performance hints
  const headers = new Headers();

  // Preload dashboard API for lessors
  if (user.role === "LESSOR") {
    headers.append(
      "Link",
      "</api/user/profile/lessor-dashboard>; rel=preload; as=fetch"
    );
  }

  // Preload critical assets
  headers.append(
    "Link",
    "</fonts/inter-var.woff2>; rel=preload; as=font; type=font/woff2; crossorigin"
  );

  return (
    <div className="px-3 md:px-0">
      <Suspense fallback={<ProfileLoading />}>
        <ProfileClient
          user={user}
          initialTab={params.tab}
          initialMode={params.mode}
          initialData={initialData}
        />
      </Suspense>
    </div>
  );
}

// Enable ISR for profile pages
export const revalidate = 300; // 5 minutes
export const dynamic = "force-dynamic"; // Always fetch fresh session data
