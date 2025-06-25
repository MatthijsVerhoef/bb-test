// app/api/favorites/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth"; // Adjust path as needed

// POST /api/favorites/sync - Sync localStorage favorites with database
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { favorites } = await request.json();

    if (!Array.isArray(favorites)) {
      return NextResponse.json(
        { error: "Invalid favorites data" },
        { status: 400 }
      );
    }

    // Get user's existing favorites from the database
    const existingFavorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        trailerId: true,
      },
    });

    const existingTrailerIds = existingFavorites.map((fav) => fav.trailerId);

    // Filter out trailers that are already in favorites
    const newFavorites = favorites.filter(
      (fav) => !existingTrailerIds.includes(fav.id)
    );

    // Add each new favorite to the database
    const createdFavorites = [];
    for (const fav of newFavorites) {
      try {
        // Verify the trailer exists first
        const trailer = await prisma.trailer.findUnique({
          where: { id: fav.id },
        });
        
        if (trailer) {
          const created = await prisma.favorite.create({
            data: {
              userId: session.user.id,
              trailerId: fav.id,
            },
          });
          createdFavorites.push(created);
        }
      } catch (error) {
        console.error(`Error adding favorite for trailer ${fav.id}:`, error);
        // Continue with the next favorite even if one fails
      }
    }

    // Fetch the updated list of favorites
    const updatedFavorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        trailer: {
          select: {
            id: true,
            title: true,
            city: true,
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
    const formattedFavorites = updatedFavorites.map((fav) => ({
      id: fav.trailer.id,
      title: fav.trailer.title,
      city: fav.trailer.city,
      pricePerDay: fav.trailer.pricePerDay,
      available: fav.trailer.available,
      mainImage: fav.trailer.images[0]?.url || "/images/trailer-placeholder.jpg",
      note: fav.note || "",
    }));

    return NextResponse.json({
      message: "Favorites synced successfully",
      favorites: formattedFavorites,
      added: createdFavorites.length,
    });
  } catch (error) {
    console.error("Error syncing favorites:", error);
    return NextResponse.json(
      { error: "Failed to sync favorites" },
      { status: 500 }
    );
  }
}

// Explicitly define what methods are allowed
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'POST, OPTIONS',
    },
  });
}