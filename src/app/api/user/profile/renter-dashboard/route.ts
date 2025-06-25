// app/api/user/profile/renter-dashboard/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const currentDate = new Date();
    
    // Get user's active/upcoming rentals
    const activeRentals = await prisma.rental.findMany({
      where: {
        renterId: session.user.id,
        status: {
          in: ['ACTIVE', 'CONFIRMED']
        }
      },
      include: {
        trailer: {
          include: {
            images: {
              take: 1,
              orderBy: {
                order: 'asc'
              }
            },
            owner: {
              select: {
                firstName: true,
                lastName: true,
                responseTime: true,
                stats: {
                  select: {
                    averageRating: true,
                    responseRate: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });
    
    // Get favorite trailers with current availability
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        trailer: {
          include: {
            images: {
              take: 1,
              orderBy: {
                order: 'asc'
              }
            },
            rentals: {
              where: {
                endDate: {
                  gte: currentDate
                },
                status: {
                  in: ['ACTIVE', 'CONFIRMED', 'PENDING']
                }
              },
              select: {
                startDate: true,
                endDate: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    // Get messages about rentals (including unread)
    const rentalMessages = await prisma.chatMessage.findMany({
      where: {
        receiverId: session.user.id,
        read: false
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            profilePicture: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    // Get user's rental statistics
    const userStats = await prisma.userStats.findUnique({
      where: {
        userId: session.user.id
      }
    });
    
    const userRentals = await prisma.rental.findMany({
      where: {
        renterId: session.user.id,
        status: 'COMPLETED'
      },
      include: {
        trailer: {
          select: {
            type: true,
            pricePerDay: true
          }
        }
      }
    });
    
    // Calculate preferred trailer type and price range
    const typePreferences = userRentals.reduce((acc: Record<string, number>, rental) => {
      const type = rental.trailer.type || 'OVERIG';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    const preferredTypes = Object.entries(typePreferences)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
    
    const avgPrice = userRentals.length > 0
      ? userRentals.reduce((sum, rental) => sum + rental.trailer.pricePerDay, 0) / userRentals.length
      : 50; // Default average price
    
    // Get recommended trailers
    const recommendedTrailers = await prisma.trailer.findMany({
      where: {
        status: 'ACTIVE',
        type: preferredTypes.length > 0 ? { in: preferredTypes } : undefined,
        pricePerDay: {
          gte: avgPrice * 0.8,
          lte: avgPrice * 1.2
        },
        // Exclude user's own trailers if they have any
        NOT: {
          ownerId: session.user.id
        }
      },
      include: {
        images: {
          take: 1,
          orderBy: {
            order: 'asc'
          }
        },
        owner: {
          select: {
            firstName: true,
            lastName: true,
            stats: {
              select: {
                averageRating: true,
                responseRate: true
              }
            }
          }
        }
      },
      orderBy: {
        views: 'desc'
      },
      take: 6
    });
    
    // Calculate savings compared to average prices
    const averageMarketPrice = await prisma.trailer.aggregate({
      _avg: {
        pricePerDay: true
      }
    });
    
    const totalSavings = userRentals.reduce((sum, rental) => {
      const marketValue = (averageMarketPrice._avg.pricePerDay || 50) * 
        Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24));
      return sum + (marketValue - rental.totalPrice);
    }, 0);
    
    return NextResponse.json({
      activeRentals: activeRentals.map(rental => ({
        id: rental.id,
        startDate: rental.startDate,
        endDate: rental.endDate,
        status: rental.status,
        trailerTitle: rental.trailer.title,
        trailerImage: rental.trailer.images[0]?.url || null,
        ownerName: `${rental.trailer.owner.firstName || ''} ${rental.trailer.owner.lastName || ''}`.trim(),
        ownerResponseTime: rental.trailer.owner.responseTime,
        totalPrice: rental.totalPrice
      })),
      favoriteTrailers: favorites.map(fav => {
        // Check availability for next week
        const nextWeekStart = addDays(currentDate, 1);
        const nextWeekEnd = addDays(currentDate, 7);
        
        const isAvailable = !fav.trailer.rentals.some(rental => 
          (rental.startDate <= nextWeekEnd && rental.endDate >= nextWeekStart)
        );
        
        return {
          id: fav.trailer.id,
          title: fav.trailer.title,
          pricePerDay: fav.trailer.pricePerDay,
          image: fav.trailer.images[0]?.url || null,
          isAvailable,
          nextAvailableDate: isAvailable ? null : 
            fav.trailer.rentals
              .filter(rental => rental.endDate > currentDate)
              .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())[0]?.endDate
        };
      }),
      recommendedTrailers: recommendedTrailers.map(trailer => ({
        id: trailer.id,
        title: trailer.title,
        pricePerDay: trailer.pricePerDay,
        image: trailer.images[0]?.url || null,
        type: trailer.type,
        ownerName: `${trailer.owner.firstName || ''} ${trailer.owner.lastName || ''}`.trim(),
        ownerRating: trailer.owner.stats?.averageRating || null,
        ownerResponseRate: trailer.owner.stats?.responseRate || null
      })),
      messages: rentalMessages.map(message => ({
        id: message.id,
        senderName: `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim(),
        senderImage: message.sender.profilePicture,
        message: message.message,
        createdAt: message.createdAt
      })),
      stats: {
        totalRentals: userStats?.totalRentals || 0,
        totalSavings,
        unreadMessages: rentalMessages.length,
        favoriteCount: favorites.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching renter dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}