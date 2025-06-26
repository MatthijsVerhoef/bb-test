// app/api/trailers/[trailerId]/availability/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { endOfMonth, startOfMonth, addMonths } from 'date-fns';

// Function to clean up expired temporary blocks
async function cleanupExpiredTemporaryBlocks() {
  try {
    console.log('🧹 [CLEANUP] Checking for expired temporary blocks');
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const expiredBlocks = await prisma.blockedPeriod.findMany({
      where: {
        reason: {
          contains: 'PAYMENT_INTENT:'
        },
        createdAt: {
          lt: oneHourAgo
        }
      },
      select: {
        id: true,
        reason: true,
        trailerId: true,
        createdAt: true
      }
    });
    
    if (expiredBlocks.length > 0) {
      console.log(`🧹 [CLEANUP] Found ${expiredBlocks.length} expired temporary blocks to clean up`);
      
      const result = await prisma.blockedPeriod.deleteMany({
        where: {
          id: {
            in: expiredBlocks.map(block => block.id)
          }
        }
      });
      
      console.log(`🧹 [CLEANUP] Successfully removed ${result.count} expired temporary blocks`);
    } else {
      console.log('🧹 [CLEANUP] No expired temporary blocks found');
    }
  } catch (error) {
    console.error('🧹 [CLEANUP] Error cleaning up expired temporary blocks:', error);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ trailerId: string }> }
) {
  // Run cleanup as a background task
  cleanupExpiredTemporaryBlocks().catch(error => {
    console.error('Background cleanup error:', error);
  });
  
  try {
    const url = new URL(request.url);
    const rangeParam = url.searchParams.get('range') || 'threeMonths';

    // Extract trailerId
    const { trailerId } = await params;

    if (!trailerId) {
      return NextResponse.json(
        { error: 'Trailer ID is required' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    
    // Define date range
    let startDateFilter = new Date();
    let endDateFilter;

    if (rangeParam === 'currentMonth') {
      startDateFilter = startOfMonth(new Date());
      endDateFilter = endOfMonth(new Date());
    } else if (rangeParam === 'threeMonths') {
      endDateFilter = endOfMonth(addMonths(new Date(), 2));
    } else {
      endDateFilter = addMonths(new Date(), 6);
    }

    console.log(`📡 Fetching availability data for trailer ${trailerId} from ${startDateFilter.toISOString()} to ${endDateFilter.toISOString()}`);

    // First, get the trailer's owner ID
    const trailer = await prisma.trailer.findUnique({
      where: { id: trailerId },
      select: { 
        id: true,
        ownerId: true 
      }
    });
    
    if (!trailer) {
      return NextResponse.json(
        { error: 'Trailer not found' },
        { status: 404 }
      );
    }
    
    const trailerOwnerId = trailer.ownerId;
    console.log(`📡 Trailer ${trailerId} is owned by user ${trailerOwnerId}`);

    // Run queries in parallel for better performance
    const [rentals, availabilityExceptions, weeklyAvailability, blockedPeriods] = await Promise.all([
      // Rentals query (unchanged)
      prisma.rental.findMany({
        where: {
          trailerId,
          status: {
            in: ['CONFIRMED', 'ACTIVE']
          },
          OR: [
            {
              startDate: {
                gte: startDateFilter,
                lte: endDateFilter
              }
            },
            {
              endDate: {
                gte: startDateFilter,
                lte: endDateFilter
              }
            },
            {
              startDate: {
                lte: startDateFilter
              },
              endDate: {
                gte: endDateFilter
              }
            }
          ]
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true,
          pickupTime: true,
          returnTime: true,
          renterId: session?.user?.id === undefined ? false : true
        },
        orderBy: {
          startDate: 'asc'
        }
      }),
      
      // Availability exceptions query (unchanged)
      prisma.availabilityException.findMany({
        where: {
          trailerId,
          date: {
            gte: startDateFilter,
            lte: endDateFilter
          }
        },
        select: {
          id: true,
          date: true,
          morning: true,
          afternoon: true,
          evening: true,
          morningStart: true,
          morningEnd: true,
          afternoonStart: true,
          afternoonEnd: true,
          eveningStart: true,
          eveningEnd: true
        }
      }),
      
      // Weekly availability query (unchanged)
      prisma.weeklyAvailability.findMany({
        where: {
          trailerId
        },
        select: {
          id: true,
          day: true,
          available: true,
          timeSlot1Start: true,
          timeSlot1End: true,
          timeSlot2Start: true,
          timeSlot2End: true,
          timeSlot3Start: true,
          timeSlot3End: true
        }
      }),
      
      // FIXED: Blocked periods query
      prisma.blockedPeriod.findMany({
        where: {
          OR: [
            // Case 1: Trailer-specific blocks (including payment blocks)
            { 
              trailerId: trailerId 
            },
            // Case 2: Owner-wide blocks created by this trailer's owner
            {
              trailerId: null,
              userId: trailerOwnerId // This is the key fix!
            }
          ],
          // Date range filtering
          OR: [
            {
              startDate: {
                gte: startDateFilter,
                lte: endDateFilter
              }
            },
            {
              endDate: {
                gte: startDateFilter,
                lte: endDateFilter
              }
            },
            {
              startDate: {
                lte: startDateFilter
              },
              endDate: {
                gte: endDateFilter
              }
            }
          ]
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          reason: true,
          trailerId: true,
          allDay: true,
          morning: true,
          afternoon: true,
          evening: true,
          userId: true,
        }
      })
    ]);

    console.log(`📡 Found ${rentals.length} rentals, ${availabilityExceptions.length} exceptions, ${weeklyAvailability.length} weekly availability entries, and ${blockedPeriods.length} blocked periods`);
    
    // Debug blocked periods
    if (blockedPeriods.length > 0) {
      console.log("📡 Retrieved blocked periods:");
      blockedPeriods.forEach(period => {
        console.log(`📡 Period from ${period.startDate.toISOString().split('T')[0]} to ${period.endDate.toISOString().split('T')[0]}, trailerId: ${period.trailerId || 'owner-wide'}, userId: ${period.userId}`);
      });
    }
    
    // IMPORTANT: Process blocked periods with proper owner identification
    const formattedBlockedPeriods = blockedPeriods.map(period => {
      // Determine if this blocked period belongs to the trailer's owner
      const belongsToThisTrailersOwner = period.userId === trailerOwnerId;
      
      // Check if it's a payment intent or confirmed rental block
      const isTemporaryBlock = period.reason?.includes('PAYMENT_INTENT:') || false;
      const isConfirmedRental = period.reason?.includes('CONFIRMED_RENTAL:') || false;
      
      console.log(`📡 Processing blocked period: trailer-specific: ${!!period.trailerId}, owner: ${period.userId}, belongs to this trailer's owner: ${belongsToThisTrailersOwner}`);
      
      return {
        ...period,
        startDate: period.startDate.toISOString(),
        endDate: period.endDate.toISOString(),
        // Classification fields for client-side filtering
        isGlobal: period.trailerId === null,
        trailerSpecific: period.trailerId === trailerId,
        belongsToThisTrailersOwner, // This is the critical field!
        ownerBlocked: period.trailerId === null && belongsToThisTrailersOwner,
        isTemporaryBlock,
        isConfirmedRental,
      }
    });
    
    // Format other response data
    const formattedRentals = rentals.map(rental => ({
      ...rental,
      startDate: rental.startDate.toISOString(),
      endDate: rental.endDate.toISOString()
    }));

    const formattedExceptions = availabilityExceptions.map(exception => ({
      ...exception,
      date: exception.date.toISOString()
    }));

    // Return the data with cache headers
    return new NextResponse(
      JSON.stringify({
        rentals: formattedRentals,
        availabilityExceptions: formattedExceptions,
        weeklyAvailability: weeklyAvailability,
        blockedPeriods: formattedBlockedPeriods
      }),
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching trailer availability data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trailer availability data' },
      { status: 500 }
    );
  }
}