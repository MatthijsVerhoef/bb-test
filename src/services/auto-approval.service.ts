import { prisma } from '@/lib/prisma';

export class AutoApprovalService {
  /**
   * Check if a rental should be auto-approved based on lessor settings
   */
  static async shouldAutoApprove(
    lessorId: string,
    renterId: string
  ): Promise<{ shouldApprove: boolean; reason?: string }> {
    try {
      console.log(`[AUTO-APPROVAL] Checking auto-approval for lessor ${lessorId} and renter ${renterId}`);
      
      // Get lessor settings
      const lessorSettings = await prisma.lessorSettings.findUnique({
        where: { userId: lessorId },
      });

      // If no settings or auto-approval disabled, don't auto-approve
      if (!lessorSettings || !lessorSettings.autoApprovalEnabled) {
        console.log(`[AUTO-APPROVAL] Auto-approval is disabled for lessor ${lessorId}`);
        return { shouldApprove: false, reason: 'Auto-approval not enabled' };
      }

      // Get renter information including stats and verification
      const renter = await prisma.user.findUnique({
        where: { id: renterId },
        include: {
          stats: true,
          verification: true,
        },
      });

      if (!renter) {
        console.log(`[AUTO-APPROVAL] Renter ${renterId} not found`);
        return { shouldApprove: false, reason: 'Renter not found' };
      }

      // Check verified status if required
      if (lessorSettings.autoApprovalVerifiedOnly) {
        if (!renter.verification?.licenseVerified) {
          console.log(`[AUTO-APPROVAL] Renter ${renterId} does not have verified license`);
          return { 
            shouldApprove: false, 
            reason: 'Renter does not have a verified driver\'s license' 
          };
        }
      }

      // Check minimum rentals
      const completedRentals = renter.stats?.completedRentals || 0;
      if (completedRentals < lessorSettings.autoApprovalMinRentals) {
        console.log(`[AUTO-APPROVAL] Renter ${renterId} has ${completedRentals} completed rentals, minimum required: ${lessorSettings.autoApprovalMinRentals}`);
        return { 
          shouldApprove: false, 
          reason: `Renter needs at least ${lessorSettings.autoApprovalMinRentals} completed rentals (has ${completedRentals})` 
        };
      }

      // Check rating (only if a minimum rating is set)
      if (lessorSettings.autoApprovalMinRating !== null) {
        const averageRating = renter.stats?.averageRating;
        
        // If renter has no rating yet but we require one, don't auto-approve
        if (!averageRating) {
          console.log(`[AUTO-APPROVAL] Renter ${renterId} has no rating yet, but minimum rating is required`);
          return { 
            shouldApprove: false, 
            reason: 'Renter has no rating yet' 
          };
        }
        
        if (averageRating < lessorSettings.autoApprovalMinRating) {
          console.log(`[AUTO-APPROVAL] Renter ${renterId} rating ${averageRating} is below minimum ${lessorSettings.autoApprovalMinRating}`);
          return { 
            shouldApprove: false, 
            reason: `Renter rating (${averageRating.toFixed(1)}) is below minimum (${lessorSettings.autoApprovalMinRating.toFixed(1)})` 
          };
        }
      }

      // All checks passed
      console.log(`[AUTO-APPROVAL] All checks passed for renter ${renterId}`);
      return { shouldApprove: true };
      
    } catch (error) {
      console.error('[AUTO-APPROVAL] Error checking auto-approval:', error);
      return { 
        shouldApprove: false, 
        reason: 'Error checking auto-approval criteria' 
      };
    }
  }

  /**
   * Auto-approve a rental if criteria are met
   */
  static async processAutoApproval(rentalId: string): Promise<boolean> {
    try {
      console.log(`[AUTO-APPROVAL] Processing auto-approval for rental ${rentalId}`);
      
      // Get rental details
      const rental = await prisma.rental.findUnique({
        where: { id: rentalId },
        include: {
          trailer: {
            select: {
              title: true,
              ownerId: true,
            },
          },
          renter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          lessor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!rental) {
        console.error(`[AUTO-APPROVAL] Rental ${rentalId} not found`);
        return false;
      }

      // Only process if rental is still pending
      if (rental.status !== 'PENDING') {
        console.log(`[AUTO-APPROVAL] Rental ${rentalId} is not pending (status: ${rental.status})`);
        return false;
      }

      // Check auto-approval criteria
      const { shouldApprove, reason } = await this.shouldAutoApprove(
        rental.lessorId,
        rental.renterId
      );

      if (!shouldApprove) {
        console.log(`[AUTO-APPROVAL] Rental ${rentalId} not auto-approved: ${reason}`);
        
        // Create notification for lessor about manual review needed
        await prisma.notification.create({
          data: {
            userId: rental.lessorId,
            message: `Nieuwe reservering voor "${rental.trailer.title}" vereist handmatige goedkeuring. ${reason}`,
            type: 'BOOKING',
            actionUrl: `/profiel?tab=rentals&mode=lessor`,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        
        return false;
      }

      // Auto-approve the rental
      console.log(`[AUTO-APPROVAL] Auto-approving rental ${rentalId}`);
      
      await prisma.$transaction(async (tx) => {
        // Update rental status
        await tx.rental.update({
          where: { id: rentalId },
          data: {
            status: 'CONFIRMED',
            specialNotes: 'Automatisch goedgekeurd op basis van verhuurderscriteria',
          },
        });

        // Create notifications
        await tx.notification.create({
          data: {
            userId: rental.renterId,
            message: `Je reservering voor "${rental.trailer.title}" is automatisch goedgekeurd!`,
            type: 'BOOKING',
            actionUrl: `/profiel?tab=rentals&mode=renter`,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        await tx.notification.create({
          data: {
            userId: rental.lessorId,
            message: `Reservering voor "${rental.trailer.title}" is automatisch goedgekeurd op basis van je criteria.`,
            type: 'BOOKING',
            actionUrl: `/profiel?tab=rentals&mode=lessor`,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      });

      // Send confirmation emails
      try {
        const { sendBookingConfirmationEmail } = await import('@/lib/email');
        
        if (rental.renter?.email) {
          const renterName = [rental.renter.firstName, rental.renter.lastName].filter(Boolean).join(' ') || 'Huurder';
          const ownerName = [rental.lessor?.firstName, rental.lessor?.lastName].filter(Boolean).join(' ') || 'Verhuurder';
          
          console.log(`[AUTO-APPROVAL] Sending auto-approval confirmation email to renter ${rental.renterId}`);
          
          await sendBookingConfirmationEmail(
            rental.renter.email,
            renterName,
            rental.trailer.title || 'Aanhanger',
            {
              startDate: rental.startDate,
              endDate: rental.endDate,
              ownerName: ownerName,
              totalPrice: rental.totalPrice,
              bookingId: rental.id,
              pickupLocation: rental.pickupLocation || 'Nader overeen te komen',
              renterId: rental.renterId,
            }
          );
        }
      } catch (emailError) {
        console.error('[AUTO-APPROVAL] Error sending auto-approval email:', emailError);
      }

      console.log(`[AUTO-APPROVAL] Successfully auto-approved rental ${rentalId}`);
      return true;
      
    } catch (error) {
      console.error('[AUTO-APPROVAL] Error processing auto-approval:', error);
      return false;
    }
  }
}