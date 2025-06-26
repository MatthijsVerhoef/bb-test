// app/api/rentals/[id]/damage-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params first
    const { id: rentalId } = await params;
    
    console.log('Damage report request received for rental:', rentalId);
    
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to access this resource' },
        { status: 401 }
      );
    }
    
    if (!rentalId) {
      return NextResponse.json(
        { error: 'Rental ID is required' },
        { status: 400 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { description, damageStatus, photoUrls, repairCost } = body;

    if (!description || !damageStatus) {
      return NextResponse.json(
        { error: 'Description and damage status are required' },
        { status: 400 }
      );
    }

    // 4. Fetch the rental to verify permissions
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        trailer: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    // 5. Check permissions - either lessor or renter can create damage reports
    const userId = session.user.id;
    const isLessor = rental.lessorId === userId || rental.trailer.ownerId === userId;
    const isRenter = rental.renterId === userId;
    const isAdmin = session.user.role === 'ADMIN';
    const isSupport = session.user.role === 'SUPPORT';

    if (!isLessor && !isRenter && !isAdmin && !isSupport) {
      return NextResponse.json(
        { error: 'You do not have permission to create a damage report for this rental' },
        { status: 403 }
      );
    }

    // 6. Create damage report
    // Limit description length if needed
    const trimmedDescription = description.length > 1000 ? 
      description.substring(0, 1000) + '...' : 
      description;
      
    console.log('Creating damage report with data:', {
      description: `${trimmedDescription.substring(0, 50)}... (${trimmedDescription.length} chars)`,
      damageStatus,
      photoCount: photoUrls?.length || 0,
      repairCost: repairCost ? parseFloat(String(repairCost)) : null,
      rentalId,
      trailerId: rental.trailerId,
      userId
    });
    
    const damageReport = await prisma.damageReport.create({
      data: {
        description: trimmedDescription,
        damageStatus,
        photoUrls: photoUrls || [],
        repairCost: repairCost ? parseFloat(String(repairCost)) : null,
        resolved: false,
        // Connect to both the trailer, rental, and the reporting user
        trailer: {
          connect: {
            id: rental.trailerId
          }
        },
        rental: {
          connect: {
            id: rentalId
          }
        },
        reportedBy: {
          connect: {
            id: userId
          }
        }
      },
      include: {
        trailer: true,
        rental: true,
        reportedBy: true
      },
    });

    // 7. Create notification for the other party
    const notificationUserId = isLessor ? rental.renterId : rental.lessorId;
    
    await prisma.notification.create({
      data: {
        userId: notificationUserId,
        message: `Een schaderapport is ingediend voor verhuring ${rentalId.substring(0, 8)}. Controleer de details.`,
        type: 'SYSTEM',
        read: false,
        actionUrl: `/rental/${rentalId}`,
      },
    });

    // 8. If damage is severe, update rental status to DISPUTED
    if (damageStatus === 'SEVERE' && rental.status === 'ACTIVE') {
      await prisma.rental.update({
        where: { id: rentalId },
        data: {
          status: 'DISPUTED',
          specialNotes: `Ernstige schade gemeld op ${new Date().toISOString().substring(0, 10)}`
        },
      });
      
      // Create additional notification about status change
      await prisma.notification.create({
        data: {
          userId: notificationUserId,
          message: `Verhuurstatus is bijgewerkt naar "In geschil" vanwege een schademelding.`,
          type: 'SYSTEM',
          read: false,
          actionUrl: `/rental/${rentalId}`,
        },
      });
    }

    // 9. Return success response
    return NextResponse.json({ 
      success: true,
      damageReport,
    });
    
  } catch (error) {
    console.error('Error creating damage report:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the damage report' },
      { status: 500 }
    );
  }
}

// If you also have a GET handler in this file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const { id: rentalId } = await params;
    
    // Your GET handler logic here...
    
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}