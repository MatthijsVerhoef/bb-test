// app/api/favorites/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth"; // Adjust path as needed

// DELETE /api/favorites/[id] - Remove a trailer from favorites
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const trailerId = params.id;

    if (!trailerId) {
      return NextResponse.json(
        { error: "Trailer ID is required" },
        { status: 400 }
      );
    }

    // Find the favorite first to see if it exists
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_trailerId: {
          userId: session.user.id,
          trailerId,
        },
      },
    });

    if (!favorite) {
      return NextResponse.json(
        { message: "Favorite not found" },
        { status: 404 }
      );
    }

    // Delete the favorite
    await prisma.favorite.delete({
      where: {
        userId_trailerId: {
          userId: session.user.id,
          trailerId,
        },
      },
    });

    return NextResponse.json(
      { message: "Favorite removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing favorite:", error);
    
    // Check if the error is due to the favorite not existing
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { message: "Favorite already removed or not found" },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}

// Explicitly define what methods are allowed
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'DELETE, OPTIONS',
    },
  });
}