// app/api/user/profile/lessor-calendar/availability/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { scope, trailerIds, weeklyAvailability } = body;

    if (!trailerIds || !Array.isArray(trailerIds) || trailerIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid trailer IDs' },
        { status: 400 }
      );
    }

    if (!weeklyAvailability || !Array.isArray(weeklyAvailability)) {
      return NextResponse.json(
        { error: 'Invalid availability data' },
        { status: 400 }
      );
    }

    // Verify that the user owns all the trailers
    const ownedTrailers = await prisma.trailer.findMany({
      where: {
        id: { in: trailerIds },
        ownerId: session.user.id,
      },
      select: { id: true },
    });

    if (ownedTrailers.length !== trailerIds.length) {
      return NextResponse.json(
        { error: 'You do not own all the specified trailers' },
        { status: 403 }
      );
    }

    // Update availability for each trailer
    const updates = [];
    
    for (const trailerId of trailerIds) {
      for (const dayData of weeklyAvailability) {
        // Delete existing availability for this trailer and day
        await prisma.weeklyAvailability.deleteMany({
          where: {
            trailerId,
            day: dayData.day,
          },
        });

        // Create new availability record
        updates.push(
          prisma.weeklyAvailability.create({
            data: {
              trailerId,
              day: dayData.day,
              available: dayData.available,
              timeSlot1Start: dayData.timeSlot1Start,
              timeSlot1End: dayData.timeSlot1End,
              timeSlot2Start: dayData.timeSlot2Start,
              timeSlot2End: dayData.timeSlot2End,
              timeSlot3Start: dayData.timeSlot3Start,
              timeSlot3End: dayData.timeSlot3End,
            },
          })
        );
      }
    }

    // Execute all updates in a transaction
    await prisma.$transaction(updates);

    // Log the activity
    await prisma.transactionLog.create({
      data: {
        type: 'OTHER',
        message: `Updated availability for ${trailerIds.length} trailer(s)`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Availability updated for ${trailerIds.length} trailer(s)`,
    });

  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}