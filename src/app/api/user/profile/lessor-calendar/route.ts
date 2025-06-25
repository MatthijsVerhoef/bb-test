// // /app/api/user/profile/lessor-calendar/route.js
// import { NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/lib/auth';
// import { prisma } from '@/lib/prisma';

// export async function GET(request) {
//   try {
//     const session = await getServerSession(authOptions);
    
//     if (!session?.user?.id) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const userId = session.user.id;

//     // Get all trailers owned by the user
//     const trailers = await prisma.trailer.findMany({
//       where: {
//         ownerId: userId,
//       },
//       select: {
//         id: true,
//         title: true,
//         pricePerDay: true,
//         available: true,
//         images: {
//           select: {
//             url: true,
//           },
//           take: 1,
//         },
//       },
//     });

//     // Get all rentals for the user's trailers
//     const rentals = await prisma.rental.findMany({
//       where: {
//         trailer: {
//           ownerId: userId,
//         },
//         status: {
//           in: ['CONFIRMED', 'ACTIVE'],
//         },
//       },
//       select: {
//         id: true,
//         startDate: true,
//         endDate: true,
//         status: true,
//         renter: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             profilePicture: true,
//           },
//         },
//         trailer: {
//           select: {
//             id: true,
//             title: true,
//             pricePerDay: true,
//             images: {
//               select: {
//                 url: true,
//               },
//               take: 1,
//             },
//           },
//         },
//       },
//     });

//     // Get all blocked periods for the user
//     const blockedPeriods = await prisma.blockedPeriod.findMany({
//       where: {
//         OR: [
//           // Blocked periods created by this user
//           { userId: userId },
//           // Blocked periods for trailers owned by this user
//           {
//             trailer: {
//               ownerId: userId,
//             },
//           },
//         ],
//       },
//       select: {
//         id: true,
//         startDate: true,
//         endDate: true,
//         reason: true,
//         trailerId: true,
//         allDay: true,
//         morning: true,
//         afternoon: true,
//         evening: true,
//       },
//     });

//     // Get the weekly availability settings for all user's trailers
//     const weeklyAvailabilityData = await prisma.weeklyAvailability.findMany({
//       where: {
//         trailer: {
//           ownerId: userId,
//         },
//       },
//       select: {
//         id: true,
//         day: true,
//         available: true,
//         timeSlot1Start: true,
//         timeSlot1End: true,
//         timeSlot2Start: true,
//         timeSlot2End: true,
//         timeSlot3Start: true,
//         timeSlot3End: true,
//         trailerId: true,
//       },
//     });

//     // Transform weekly availability into a more usable format
//     // Group by trailer and convert to the format expected by the calendar
//     const weeklyAvailabilityByTrailer = {};
    
//     weeklyAvailabilityData.forEach(setting => {
//       if (!weeklyAvailabilityByTrailer[setting.trailerId]) {
//         weeklyAvailabilityByTrailer[setting.trailerId] = {};
//       }
      
//       // Convert day enum to lowercase for calendar compatibility
//       const dayLower = setting.day.toLowerCase();
//       weeklyAvailabilityByTrailer[setting.trailerId][dayLower] = setting.available;
//     });

//     // If there's only one trailer or we want a combined view, 
//     // create a merged availability object
//     const combinedWeeklyAvailability = {};
//     const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
//     daysOfWeek.forEach(day => {
//       // A day is available if ANY trailer has it available
//       combinedWeeklyAvailability[day] = Object.values(weeklyAvailabilityByTrailer).some(
//         trailerAvailability => trailerAvailability[day] === true
//       );
//     });

//     // Get availability exceptions if needed
//     const availabilityExceptions = await prisma.availabilityException.findMany({
//       where: {
//         trailer: {
//           ownerId: userId,
//         },
//       },
//       select: {
//         id: true,
//         date: true,
//         morning: true,
//         afternoon: true,
//         evening: true,
//         trailerId: true,
//       },
//     });

//     return NextResponse.json({
//       trailers,
//       rentals,
//       blockedPeriods,
//       weeklyAvailability: combinedWeeklyAvailability,
//       weeklyAvailabilityByTrailer,
//       weeklyAvailabilityData, // Raw data if needed
//       availabilityExceptions,
//     });
//   } catch (error) {
//     console.error('Error fetching lessor calendar data:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch calendar data' },
//       { status: 500 }
//     );
//   }
// }

// /app/api/user/profile/lessor-calendar/route.js - Fixed to include 'available' field

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all trailers owned by the user
    const trailers = await prisma.trailer.findMany({
      where: {
        ownerId: userId,
      },
      select: {
        id: true,
        title: true,
        pricePerDay: true,
        available: true,
        images: {
          select: {
            url: true,
          },
          take: 1,
        },
      },
    });

    // Get all rentals for the user's trailers
    const rentals = await prisma.rental.findMany({
      where: {
        trailer: {
          ownerId: userId,
        },
        status: {
          in: ['CONFIRMED', 'ACTIVE'],
        },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        renter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        trailer: {
          select: {
            id: true,
            title: true,
            pricePerDay: true,
            images: {
              select: {
                url: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    // Get all blocked periods for the user
    const blockedPeriods = await prisma.blockedPeriod.findMany({
      where: {
        OR: [
          // Blocked periods created by this user
          { userId: userId },
          // Blocked periods for trailers owned by this user
          {
            trailer: {
              ownerId: userId,
            },
          },
        ],
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        reason: true,
        trailerId: true,
        userId: true,
        allDay: true,
        morning: true,
        afternoon: true,
        evening: true,
      },
    });

    // Get the weekly availability settings for all user's trailers
    // THIS IS THE KEY QUERY - Make sure we're selecting the 'available' field
    const weeklyAvailabilityData = await prisma.weeklyAvailability.findMany({
      where: {
        trailer: {
          ownerId: userId,
        },
      },
      select: {
        id: true,
        day: true,
        available: true, // IMPORTANT: This field must be included
        timeSlot1Start: true,
        timeSlot1End: true,
        timeSlot2Start: true,
        timeSlot2End: true,
        timeSlot3Start: true,
        timeSlot3End: true,
        trailerId: true,
      },
    });

    console.log(`📅 API: Found ${weeklyAvailabilityData.length} weekly availability records`);
    
    // Log a sample to verify the data structure
    if (weeklyAvailabilityData.length > 0) {
      console.log('📅 API: Sample weekly availability:', weeklyAvailabilityData[0]);
    }

    // Transform weekly availability into a more usable format for backward compatibility
    // Group by trailer and convert to the format expected by the calendar
    const weeklyAvailabilityByTrailer = {};
    
    weeklyAvailabilityData.forEach(setting => {
      if (!weeklyAvailabilityByTrailer[setting.trailerId]) {
        weeklyAvailabilityByTrailer[setting.trailerId] = {};
      }
      
      // Convert day enum to lowercase for calendar compatibility
      const dayLower = setting.day.toLowerCase();
      weeklyAvailabilityByTrailer[setting.trailerId][dayLower] = setting.available;
    });

    // Create a combined weekly availability (for backward compatibility)
    const combinedWeeklyAvailability = {};
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    daysOfWeek.forEach(day => {
      // A day is available if ANY trailer has it available
      combinedWeeklyAvailability[day] = Object.values(weeklyAvailabilityByTrailer).some(
        trailerAvailability => trailerAvailability[day] === true
      );
    });

    // Get availability exceptions if needed
    const availabilityExceptions = await prisma.availabilityException.findMany({
      where: {
        trailer: {
          ownerId: userId,
        },
      },
      select: {
        id: true,
        date: true,
        morning: true,
        afternoon: true,
        evening: true,
        trailerId: true,
      },
    });

    return NextResponse.json({
      trailers,
      rentals,
      blockedPeriods,
      weeklyAvailability: combinedWeeklyAvailability, // Legacy format
      weeklyAvailabilityByTrailer, // Legacy format
      weeklyAvailabilityData, // Raw data - THIS IS WHAT WE NEED
      availabilityExceptions,
    });
  } catch (error) {
    console.error('Error fetching lessor calendar data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}