// app/api/locations/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";

  try {
    // Build where conditions based on whether we have a query
    const whereConditions: any = {
      available: true,
      city: {
        not: null,
      },
    };

    // Add search condition if query provided
    if (query.trim()) {
      whereConditions.city.contains = query;
    }

    // Get unique cities from trailers - simplified approach
    const trailers = await prisma.trailer.findMany({
      where: whereConditions,
      select: {
        city: true,
      },
      distinct: ["city"],
      orderBy: {
        city: 'asc'
      },
      take: 50 // Get more cities, then we'll count and sort them
    });

    // Extract cities and count occurrences manually
    const cityMap = new Map<string, number>();
    
    // If no query, get all available cities for counting
    if (!query.trim()) {
      const allTrailers = await prisma.trailer.findMany({
        where: {
          available: true,
          city: { not: null }
        },
        select: {
          city: true,
        },
      });

      // Count occurrences of each city
      allTrailers.forEach(trailer => {
        if (trailer.city) {
          const city = trailer.city.trim();
          cityMap.set(city, (cityMap.get(city) || 0) + 1);
        }
      });
    } else {
      // For search queries, just use the found cities
      trailers.forEach(trailer => {
        if (trailer.city) {
          const city = trailer.city.trim();
          cityMap.set(city, (cityMap.get(city) || 0) + 1);
        }
      });
    }

    // Convert to array and sort by count (popularity)
    const sortedCities = Array.from(cityMap.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([city]) => city) // Extract just the city names
      .slice(0, 15); // Limit to 15 results

    return NextResponse.json(sortedCities);
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    
    // Simple fallback - just return some common Dutch cities if database fails
    const fallbackCities = query.trim() 
      ? ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven"]
          .filter(city => city.toLowerCase().includes(query.toLowerCase()))
      : ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", "Tilburg", "Groningen", "Almere"];

    return NextResponse.json(fallbackCities);
  }
}