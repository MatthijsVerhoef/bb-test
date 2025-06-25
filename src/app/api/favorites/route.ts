// app/api/favorites/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth"; // Adjust path as needed

// GET /api/favorites - Get all favorites for the logged-in user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        trailer: {
          select: {
            id: true,
            title: true,
            city: true,
            createdAt: true,
            pricePerDay: true,
            available: true,
            images: {
              take: 1,
              select: {
                url: true,
              },
            },
          },
        },
      },
    });

    // Transform data to match the expected format
    const formattedFavorites = favorites.map((fav) => ({
      id: fav.trailer.id,
      title: fav.trailer.title,
      city: fav.trailer.city,
      pricePerDay: fav.trailer.pricePerDay,
      createdAt: fav.trailer.createdAt,
      available: fav.trailer.available,
      mainImage: fav.trailer.images[0]?.url || "/images/default-trailer.jpg",
      note: fav.note || "",
    }));

    // Add cache headers to improve performance
    // stale-while-revalidate pattern allows serving stale data while fetching fresh data in background
    return NextResponse.json(
      { favorites: formattedFavorites },
      { 
        headers: {
          // Can be cached for 5 minutes, but used for up to 1 hour while revalidating
          'Cache-Control': 'max-age=300, stale-while-revalidate=3600',
          // Add ETag for additional validation
          'ETag': `W/"favorites-${session.user.id}-${Date.now()}"`,
          // Indicate this response can be cached
          'Vary': 'Authorization, Cookie'
        }
      }
    );
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add a trailer to favorites
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { trailerId } = await request.json();

    if (!trailerId) {
      return NextResponse.json(
        { error: "Trailer ID is required" },
        { status: 400 }
      );
    }

    // Check if the trailer exists
    const trailer = await prisma.trailer.findUnique({
      where: { id: trailerId },
    });

    if (!trailer) {
      return NextResponse.json(
        { error: "Trailer not found" },
        { status: 404 }
      );
    }

    // Check if already in favorites
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_trailerId: {
          userId: session.user.id,
          trailerId,
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json(
        { message: "Trailer already in favorites" },
        { status: 200 }
      );
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        trailerId,
      },
    });

    return NextResponse.json(
      { message: "Trailer added to favorites", favorite },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

// Explicitly define what methods are allowed
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
    },
  });
}