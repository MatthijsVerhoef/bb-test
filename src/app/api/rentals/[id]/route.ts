// app/api/rentals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to access this resource' },
        { status: 401 }
      );
    }

    const rentalId = params.id;
    if (!rentalId) {
      return NextResponse.json(
        { error: 'Rental ID is required' },
        { status: 400 }
      );
    }

    // Fetch the rental with all necessary relations
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        trailer: {
          include: {
            images: {
              select: {
                url: true,
                title: true,
                id: true,
                order: true,
              },
              orderBy: {
                order: 'asc',
              },
              take: 5,
            },
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profilePicture: true,
              },
            },
            category: true,
          },
        },
        payment: true,
      },
    });

    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    // Security check: Only allow the renter, lessor, or admin to access the rental
    const userId = session.user.id;
    if (
      rental.renterId !== userId &&
      rental.lessorId !== userId &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to access this rental' },
        { status: 403 }
      );
    }

    // Format some fields for the frontend
    const formattedRental = {
      ...rental,
      // Format pickup and return times for display
      pickupTime: rental.pickupTime ? 
        new Date(rental.pickupTime).toLocaleTimeString('nl-NL', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : null,
      returnTime: rental.returnTime ? 
        new Date(rental.returnTime).toLocaleTimeString('nl-NL', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : null,
      // Add pickup location (using trailer address if not specified)
      pickupLocation: rental.pickupLocation || 
        `${rental.trailer.address}, ${rental.trailer.city}`,
      // Add return location (same as pickup if not specified)
      returnLocation: rental.returnLocation || 
        rental.pickupLocation || 
        `${rental.trailer.address}, ${rental.trailer.city}`,
    };

    return NextResponse.json({ 
      rental: formattedRental 
    });
    
  } catch (error) {
    console.error('Error fetching rental:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the rental' },
      { status: 500 }
    );
  }
}