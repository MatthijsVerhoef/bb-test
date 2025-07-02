import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";

  try {
    const whereConditions: any = {
      available: true,
      city: {
        not: null,
      },
    };

    if (query.trim()) {
      whereConditions.city.contains = query;
    }

    const trailers = await prisma.trailer.findMany({
      where: whereConditions,
      select: {
        city: true,
      },
      distinct: ["city"],
      orderBy: {
        city: 'asc'
      },
      take: 50
    });

    const cityMap = new Map<string, number>();
    
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

      allTrailers.forEach(trailer => {
        if (trailer.city) {
          const city = trailer.city.trim();
          cityMap.set(city, (cityMap.get(city) || 0) + 1);
        }
      });
    } else {
      trailers.forEach(trailer => {
        if (trailer.city) {
          const city = trailer.city.trim();
          cityMap.set(city, (cityMap.get(city) || 0) + 1);
        }
      });
    }

    const sortedCities = Array.from(cityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([city]) => city) 
      .slice(0, 15);

    return NextResponse.json(sortedCities);
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    
    const fallbackCities = query.trim() 
      ? ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven"]
          .filter(city => city.toLowerCase().includes(query.toLowerCase()))
      : ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", "Tilburg", "Groningen", "Almere"];

    return NextResponse.json(fallbackCities);
  }
}