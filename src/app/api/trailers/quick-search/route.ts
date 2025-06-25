// app/api/trailers/quick-search/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Extract search parameters
  const city = searchParams.get("city") || "";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  try {
    // Build filter conditions
    const where: any = {
      available: true,
    };
    
    // Add city filter if provided
    if (city.trim()) {
      where.city = {
        contains: city,
        // Remove mode: "insensitive" - use case-insensitive default behavior
      };
    }
    
    // If dates are provided, check availability
    if (startDate && endDate) {
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);
      
      // Only include trailers that don't have confirmed rentals during this period
      where.rentals = {
        none: {
          AND: [
            { status: { in: ['CONFIRMED', 'ACTIVE'] } },
            {
              OR: [
                // Rental starts during our period
                {
                  startDate: {
                    gte: startDateTime,
                    lte: endDateTime
                  }
                },
                // Rental ends during our period
                {
                  endDate: {
                    gte: startDateTime,
                    lte: endDateTime
                  }
                },
                // Rental spans our entire period
                {
                  startDate: { lte: startDateTime },
                  endDate: { gte: endDateTime }
                }
              ]
            }
          ]
        }
      };
      
      // Check through WeeklyAvailability
      // Ensure there's some availability on those days
      where.weeklyAvailability = {
        some: {
          OR: [
            { morning: true },
            { afternoon: true },
            { evening: true }
          ]
        }
      };
    }
    
    // Fetch results with pagination
    const [trailers, totalCount] = await Promise.all([
      prisma.trailer.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          pricePerDay: true,
          pricePerWeek: true,
          pricePerMonth: true,
          city: true,
          latitude: true,
          longitude: true,
          type: true,
          weight: true,
          length: true,
          width: true,
          height: true,
          images: {
            take: 1,
            select: {
              url: true
            }
          },
          category: {
            select: {
              name: true
            }
          },
          owner: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          }
        },
        orderBy: {
          // Order results by most recent first
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.trailer.count({ where })
    ]);
    
    // Format trailer data for the response
    const formattedTrailers = trailers.map(trailer => {
      // Calculate average rating
      const avgRating = trailer.reviews.length > 0
        ? trailer.reviews.reduce((sum, review) => sum + review.rating, 0) / trailer.reviews.length
        : null;
      
      // Determine size category
      let sizeCategory = "Gemiddeld";
      if ((trailer.weight && trailer.weight < 750) || 
          (trailer.length && trailer.length < 3.5) || 
          (trailer.width && trailer.width < 1.8)) {
        sizeCategory = "Klein";
      } else if ((trailer.weight && trailer.weight > 1500) || 
                (trailer.length && trailer.length > 5) || 
                (trailer.width && trailer.width > 2.2) || 
                (trailer.height && trailer.height > 2.2)) {
        sizeCategory = "Groot";
      }
      
      // Format owner name
      const ownerName = `${trailer.owner.firstName || ""} ${trailer.owner.lastName || ""}`.trim() || "Owner";
      
      return {
        id: trailer.id,
        title: trailer.title,
        description: trailer.description,
        pricePerDay: trailer.pricePerDay,
        pricePerWeek: trailer.pricePerWeek,
        pricePerMonth: trailer.pricePerMonth,
        city: trailer.city,
        latitude: trailer.latitude,
        longitude: trailer.longitude,
        type: trailer.type,
        categoryName: trailer.category?.name,
        mainImage: trailer.images[0]?.url || "/images/default-trailer.jpg",
        avgRating,
        sizeCategory,
        ownerName
      };
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      trailers: formattedTrailers,
      totalCount,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error("Error searching trailers:", error);
    
    // Fallback method if the first method fails
    try {
      console.log("Using fallback method for trailer search");
      // Simplified query without complex filtering
      const trailers = await prisma.trailer.findMany({
        where: {
          available: true,
          // Simple city filter if provided
          ...(city.trim() && { 
            city: { contains: city } 
          }),
        },
        select: {
          id: true,
          title: true,
          description: true,
          pricePerDay: true,
          city: true,
          images: {
            take: 1,
            select: { url: true }
          },
          owner: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });
      
      // Basic formatting
      const simpleResults = trailers.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        pricePerDay: t.pricePerDay,
        city: t.city,
        mainImage: t.images[0]?.url || "/images/trailer-placeholder.jpg",
        ownerName: `${t.owner.firstName || ""} ${t.owner.lastName || ""}`.trim() || "Owner",
      }));
      
      return NextResponse.json({
        trailers: simpleResults,
        totalCount: simpleResults.length,
        totalPages: 1,
        currentPage: 1
      });
    } catch (fallbackError) {
      console.error("Error with fallback trailer search:", fallbackError);
      return NextResponse.json(
        { error: "Failed to search trailers" },
        { status: 500 }
      );
    }
  }
}