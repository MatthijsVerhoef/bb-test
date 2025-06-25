import { prisma } from '@/lib/prisma';

/**
 * Service for updating user statistics
 * This should be called periodically or after specific events
 */
export class UserStatsService {
  /**
   * Update all statistics for a specific user
   * @param userId The user ID to update statistics for
   */
  public static async updateAllStats(userId: string): Promise<void> {
    try {
      const [
        // Rental counts
        rentalStatusCounts,
        totalIncome,
        totalSpent,
        
        // Listings
        listingsCount,
        
        // Reviews
        writtenReviewsCount,
        receivedReviewsCount,
        reviewsByRating,
        averageRating,
        
        // Other counts
        favoritesCount,
        unreadNotificationsCount,
        
        // Performance metrics
        responseRate,
        responseTime,
        acceptanceRate,
      ] = await Promise.all([
        // Get rental counts by status
        prisma.rental.groupBy({
          by: ['status'],
          where: {
            OR: [
              { lessorId: userId },
              { renterId: userId }
            ]
          },
          _count: {
            id: true
          }
        }),
        
        // Calculate total income (as lessor)
        prisma.rental.aggregate({
          where: {
            lessorId: userId,
            status: 'COMPLETED'
          },
          _sum: {
            totalPrice: true
          }
        }),
        
        // Calculate total spent (as renter)
        prisma.rental.aggregate({
          where: {
            renterId: userId,
            status: 'COMPLETED'
          },
          _sum: {
            totalPrice: true
          }
        }),
        
        // Count trailers owned by user
        prisma.trailer.count({
          where: { ownerId: userId }
        }),
        
        // Count reviews written by user
        prisma.review.count({
          where: { reviewerId: userId }
        }),
        
        // Count reviews received by user
        prisma.review.count({
          where: { reviewedUserId: userId }
        }),
        
        // Get reviews breakdown by rating
        prisma.review.groupBy({
          by: ['rating'],
          where: { reviewedUserId: userId },
          _count: {
            rating: true
          }
        }),
        
        // Get average rating
        prisma.review.aggregate({
          where: { reviewedUserId: userId },
          _avg: {
            rating: true
          }
        }),
        
        // Count favorites
        prisma.favorite.count({
          where: { userId }
        }),
        
        // Count unread notifications
        prisma.notification.count({
          where: { 
            userId,
            read: false
          }
        }),
        
        // Calculate response rate (from ChatMessage)
        prisma.$queryRaw<{ rate: number }>`
          SELECT 
            COUNT(DISTINCT cr.id) / COUNT(DISTINCT cm.chatRoomId) AS rate
          FROM ChatRoomParticipant crp
          JOIN ChatRoom cr ON crp.chatRoomId = cr.id
          LEFT JOIN ChatMessage cm ON cm.chatRoomId = cr.id AND cm.senderId = ${userId}
          WHERE crp.userId = ${userId}
        `,
        
        // Calculate average response time (from ChatMessage)
        prisma.$queryRaw<{ avgTime: number }>`
          SELECT 
            AVG(TIMESTAMPDIFF(MINUTE, cm1.createdAt, cm2.createdAt)) AS avgTime
          FROM ChatMessage cm1
          JOIN ChatMessage cm2 ON cm1.chatRoomId = cm2.chatRoomId
          WHERE cm1.senderId != ${userId}
          AND cm2.senderId = ${userId}
          AND cm2.createdAt > cm1.createdAt
          AND NOT EXISTS (
            SELECT 1 FROM ChatMessage cm3
            WHERE cm3.chatRoomId = cm1.chatRoomId
            AND cm3.createdAt > cm1.createdAt
            AND cm3.createdAt < cm2.createdAt
          )
        `,
        
        // Calculate acceptance rate
        prisma.$queryRaw<{ rate: number }>`
          SELECT 
            COUNT(CASE WHEN status IN ('CONFIRMED', 'ACTIVE', 'COMPLETED') THEN 1 END) / 
            COUNT(*) AS rate
          FROM Rental
          WHERE lessorId = ${userId}
          AND status != 'PENDING'
        `,
      ]);

      // Process the rental status counts
      const statusCounts: Record<string, number> = {
        PENDING: 0,
        CONFIRMED: 0,
        ACTIVE: 0,
        COMPLETED: 0,
        CANCELLED: 0,
        LATE_RETURN: 0,
        DISPUTED: 0
      };
      
      rentalStatusCounts.forEach(item => {
        statusCounts[item.status] = item._count.id;
      });
      
      // Calculate positive and improvement reviews
      let positiveReviews = 0;
      let improvementReviews = 0;
      const ratingBreakdown: Record<string, number> = {};
      
      reviewsByRating.forEach(item => {
        const rating = item.rating;
        const count = item._count.rating;
        
        ratingBreakdown[rating] = count;
        
        if (rating >= 4) {
          positiveReviews += count;
        } else {
          improvementReviews += count;
        }
      });

      // Update user stats
      await prisma.userStats.upsert({
        where: { userId },
        create: {
          userId,
          totalRentals: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
          totalIncome: totalIncome._sum.totalPrice || 0,
          totalSpent: totalSpent._sum.totalPrice || 0,
          cancelledRentals: statusCounts.CANCELLED || 0,
          completedRentals: statusCounts.COMPLETED || 0,
          
          // Performance metrics
          averageRating: averageRating._avg.rating || null,
          responseRate: responseRate[0]?.rate || null,
          responseTime: responseTime[0]?.avgTime || null,
          acceptanceRate: acceptanceRate[0]?.rate || null,
          
          // Expanded counts
          listingsCount,
          favoritesCount,
          writtenReviewsCount,
          receivedReviewsCount,
          unreadNotifications: unreadNotificationsCount,
          
          // Rental counts by status
          pendingRentals: statusCounts.PENDING || 0,
          confirmedRentals: statusCounts.CONFIRMED || 0,
          activeRentals: statusCounts.ACTIVE || 0,
          completedRentalsCount: statusCounts.COMPLETED || 0,
          cancelledRentalsCount: statusCounts.CANCELLED || 0,
          lateReturnRentals: statusCounts.LATE_RETURN || 0,
          disputedRentals: statusCounts.DISPUTED || 0,
          
          // Review statistics
          positiveReviews,
          improvementReviews,
          ratingBreakdown: ratingBreakdown,
          
          lastUpdated: new Date(),
        },
        update: {
          totalRentals: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
          totalIncome: totalIncome._sum.totalPrice || 0,
          totalSpent: totalSpent._sum.totalPrice || 0,
          cancelledRentals: statusCounts.CANCELLED || 0,
          completedRentals: statusCounts.COMPLETED || 0,
          
          // Performance metrics
          averageRating: averageRating._avg.rating || null,
          responseRate: responseRate[0]?.rate || null,
          responseTime: responseTime[0]?.avgTime || null,
          acceptanceRate: acceptanceRate[0]?.rate || null,
          
          // Expanded counts
          listingsCount,
          favoritesCount,
          writtenReviewsCount,
          receivedReviewsCount,
          unreadNotifications: unreadNotificationsCount,
          
          // Rental counts by status
          pendingRentals: statusCounts.PENDING || 0,
          confirmedRentals: statusCounts.CONFIRMED || 0,
          activeRentals: statusCounts.ACTIVE || 0,
          completedRentalsCount: statusCounts.COMPLETED || 0,
          cancelledRentalsCount: statusCounts.CANCELLED || 0,
          lateReturnRentals: statusCounts.LATE_RETURN || 0,
          disputedRentals: statusCounts.DISPUTED || 0,
          
          // Review statistics
          positiveReviews,
          improvementReviews,
          ratingBreakdown: ratingBreakdown,
          
          lastUpdated: new Date(),
        }
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  /**
   * Updates specific stat counters for a user when certain events occur
   * More efficient than updating all stats
   */
  public static async incrementCounter(
    userId: string, 
    counterType: 'reviews' | 'rentals' | 'listings' | 'favorites' | 'notifications',
    increment: number = 1
  ): Promise<void> {
    try {
      const updateData: any = {};
      
      switch (counterType) {
        case 'reviews':
          updateData.receivedReviewsCount = { increment };
          break;
        case 'rentals':
          updateData.totalRentals = { increment };
          break;
        case 'listings':
          updateData.listingsCount = { increment };
          break;
        case 'favorites':
          updateData.favoritesCount = { increment };
          break;
        case 'notifications':
          updateData.unreadNotifications = { increment };
          break;
      }
      
      await prisma.userStats.upsert({
        where: { userId },
        create: {
          userId,
          ...Object.fromEntries(
            Object.entries(updateData).map(([key, value]) => [key, (value as any).increment])
          ),
          lastUpdated: new Date(),
        },
        update: {
          ...updateData,
          lastUpdated: new Date(),
        },
      });
    } catch (error) {
      console.error(`Error incrementing ${counterType} counter:`, error);
    }
  }
  
  /**
   * Schedule a background update of user stats
   * @param userId The user ID to update
   */
  public static scheduleUpdate(userId: string): void {
    // Add to queue or use setTimeout for a simple implementation
    setTimeout(() => {
      this.updateAllStats(userId).catch(err => 
        console.error(`Failed to update stats for user ${userId}:`, err)
      );
    }, 100);
  }
}