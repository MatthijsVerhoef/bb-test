
import { RentalStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sendNewReservationEmail } from '@/lib/email';
import { AutoApprovalService } from './auto-approval.service';

interface CreateReservationData {
  startDate: Date;
  endDate: Date;
  pickupTime: string;
  returnTime: string;
  needsDelivery: boolean;
  specialNotes?: string;
  totalPrice: number;
  serviceFee: number;
  securityDeposit?: number;
  deliveryFee?: number;
  insuranceFee?: number;
  discountAmount?: number;
  pickupLocation?: string;
  returnLocation?: string;
  trailerId: string;
  renterId: string;
  couponId?: string;
  paymentMethod: PaymentMethod;
  paymentIntentId: string;
  termsAccepted: boolean;
}

export class ReservationService {
  public static async createReservation(data: CreateReservationData) {
    try {
      const trailer = await prisma.trailer.findUnique({
        where: { id: data.trailerId },
        select: { ownerId: true, securityDeposit: true, deliveryFee: true }
      });

      if (!trailer) {
        throw new Error('Trailer not found');
      }

      if (!data.termsAccepted) {
        throw new Error('Terms and conditions must be accepted');
      }

      const startDateObj = new Date(data.startDate);
      const endDateObj = new Date(data.endDate);
      
      if (data.pickupTime) {
        const [pickupHours, pickupMinutes] = data.pickupTime.split(':').map(Number);
        startDateObj.setHours(pickupHours || 12, pickupMinutes || 0, 0, 0);
      }
      
      if (data.returnTime) {
        const [returnHours, returnMinutes] = data.returnTime.split(':').map(Number);
        endDateObj.setHours(returnHours || 12, returnMinutes || 0, 0, 0);
      }
      
      const rental = await prisma.$transaction(async (tx) => {        
        const newRental = await tx.rental.create({
          data: {
            startDate: startDateObj,
            endDate: endDateObj,
            status: RentalStatus.PENDING,
            totalPrice: data.totalPrice,
            serviceFee: data.serviceFee,
            securityDeposit: data.securityDeposit || trailer.securityDeposit || 0,
            deliveryFee: data.deliveryFee || (data.needsDelivery ? trailer.deliveryFee : 0) || 0,
            insuranceFee: data.insuranceFee || 0,
            discountAmount: data.discountAmount || 0,
            pickupLocation: data.pickupLocation,
            returnLocation: data.returnLocation,
            pickupTime: startDateObj,
            returnTime: endDateObj,
            needsDelivery: data.needsDelivery,
            specialNotes: data.specialNotes,
            termsAccepted: true,
            couponId: data.couponId,
            trailer: { connect: { id: data.trailerId } },
            renter: { connect: { id: data.renterId } },
            lessor: { connect: { id: trailer.ownerId } }
          }
        });
        
        await tx.trailer.update({
          where: { id: data.trailerId },
          data: {
            rentals: {
              connect: { id: newRental.id }
            }
          }
        });
      
        await tx.payment.create({
          data: {
            amount: data.totalPrice,
            status: PaymentStatus.PENDING,
            paymentMethod: data.paymentMethod,
            externalTransactionId: data.paymentIntentId,
            rental: { connect: { id: newRental.id } }
          }
        });

        await tx.transactionLog.create({
          data: {
            type: 'BOOKING',
            amount: data.totalPrice,
            currency: 'EUR',
            message: `Reservation created for trailer ID: ${data.trailerId}`,
            referenceId: newRental.id,
            user: { connect: { id: data.renterId } }
          }
        });

        return newRental;
      });

      try {
        const wasAutoApproved = await AutoApprovalService.processAutoApproval(rental.id);
        
        if (wasAutoApproved) {
          return rental;
        }
      } catch (autoApprovalError) {
        console.error('[RESERVATION] Error checking auto-approval:', autoApprovalError);
      }

      try {
        const trailerDetails = await prisma.trailer.findUnique({
          where: { id: data.trailerId },
          select: { title: true, owner: { select: { id: true, firstName: true, lastName: true, email: true } } }
        });

        const renterDetails = await prisma.user.findUnique({
          where: { id: data.renterId },
          select: { firstName: true, lastName: true, email: true }
        });

        await prisma.notification.create({
          data: {
            message: `Je reservering voor een aanhanger is aangemaakt en wacht op bevestiging.`,
            type: 'BOOKING',
            actionUrl: `/profiel?tab=rentals&mode=renter`,
            userId: data.renterId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });

        await prisma.notification.create({
          data: {
            message: `Nieuwe reserveringsaanvraag ontvangen voor je aanhanger.`,
            type: 'BOOKING',
            actionUrl: `/profiel?tab=rentals&mode=lessor`,
            userId: trailer.ownerId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });

        if (trailerDetails && renterDetails && renterDetails.email) {
          const renterName = [renterDetails.firstName, renterDetails.lastName].filter(Boolean).join(' ') || 'Huurder';
          const ownerName = [trailerDetails.owner?.firstName, trailerDetails.owner?.lastName].filter(Boolean).join(' ') || 'Verhuurder';
          
          await sendNewReservationEmail(
            renterDetails.email,
            renterName,
            trailerDetails.title || 'Aanhanger',
            {
              startDate: rental.startDate,
              endDate: rental.endDate,
              ownerName: ownerName,
              totalPrice: rental.totalPrice,
              bookingId: rental.id,
              pickupLocation: rental.pickupLocation || undefined,
              renterId: data.renterId
            }
          );
          
          if (trailerDetails.owner?.email) {
            const { sendNewBookingEmail } = await import('@/lib/email');
            
            await sendNewBookingEmail(
              trailerDetails.owner.email,
              ownerName,
              trailerDetails.title || 'Aanhanger',
              {
                startDate: rental.startDate,
                endDate: rental.endDate,
                renterName: renterName,
                totalPrice: rental.totalPrice,
                bookingId: rental.id,
                ownerId: trailer.ownerId
              }
            );
          }
        }
      } catch (emailError) {
        console.error('Error sending reservation email:', emailError);
      }

      return rental;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  }

  public static async confirmReservation(rentalId: string, paymentIntentId: string) {
    try {
      const rental = await prisma.rental.findUnique({
        where: { id: rentalId },
        include: { 
          payment: true,
          trailer: {
            select: {
              id: true,
              title: true
            }
          },
          renter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          lessor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!rental) {
        throw new Error('Rental not found');
      }

      if (rental.payment?.externalTransactionId !== paymentIntentId) {
        throw new Error('Payment intent ID does not match');
      }

      const updatedRental = await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { rentalId },
          data: { 
            status: PaymentStatus.COMPLETED,
            paymentDate: new Date()
          }
        });

        const updated = await tx.rental.update({
          where: { id: rentalId },
          data: { status: RentalStatus.CONFIRMED }
        });

        await tx.notification.create({
          data: {
            message: `Je reservering voor trailer is bevestigd.`,
            type: 'BOOKING',
            actionUrl: `/rentals/${rentalId}`,
            user: { connect: { id: rental.renterId } }
          }
        });

        await tx.notification.create({
          data: {
            message: `Nieuwe reservering ontvangen voor je aanhanger.`,
            type: 'BOOKING',
            actionUrl: `/profile/lessor/rentals/${rentalId}`,
            user: { connect: { id: rental.lessorId } }
          }
        });

        return updated;
      });

      try {
        if (rental.renter?.email && rental.trailer?.title) {
          const { sendBookingConfirmationEmail, sendNewBookingEmail } = await import('@/lib/email');
          
          const renterName = [rental.renter?.firstName, rental.renter?.lastName].filter(Boolean).join(' ') || 'Huurder';
          const lessorName = [rental.lessor?.firstName, rental.lessor?.lastName].filter(Boolean).join(' ') || 'Verhuurder';
          
          const renterId = rental.renter?.id || rental.renterId;
          const lessorId = rental.lessor?.id || rental.lessorId;
                    
          if (rental.renter.email && renterId) {
            const emailSent = await sendBookingConfirmationEmail(
              rental.renter.email,
              renterName,
              rental.trailer.title,
              {
                startDate: rental.startDate,
                endDate: rental.endDate,
                ownerName: lessorName,
                totalPrice: rental.totalPrice,
                bookingId: rental.id,
                pickupLocation: rental.pickupLocation || 'Not specified',
                renterId: renterId 
              }
            );
          }
          
          if (rental.lessor?.email && lessorId) {
            const emailSent = await sendNewBookingEmail(
              rental.lessor.email,
              lessorName,
              rental.trailer.title,
              {
                startDate: rental.startDate,
                endDate: rental.endDate,
                renterName: renterName,
                totalPrice: rental.totalPrice,
                bookingId: rental.id,
                ownerId: lessorId
              }
            );
          }
        }
      } catch (emailError) {
        console.error('Error sending confirmation emails:', emailError);
      }

      return updatedRental;
    } catch (error) {
      console.error('Error confirming reservation:', error);
      throw error;
    }
  }

  public static async cancelReservation(rentalId: string, reason: string, cancelledBy: string) {
    try {
      const rental = await prisma.rental.findUnique({
        where: { id: rentalId },
        include: { 
          payment: true,
          trailer: {
            select: {
              id: true,
              title: true
            }
          },
          renter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          lessor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!rental) {
        throw new Error('Rental not found');
      }

      if (rental.status !== RentalStatus.PENDING && rental.status !== RentalStatus.CONFIRMED) {
        throw new Error(`Cannot cancel a rental with status: ${rental.status}`);
      }

      const updatedRental = await prisma.$transaction(async (tx) => {
        const updated = await tx.rental.update({
          where: { id: rentalId },
          data: { 
            status: RentalStatus.CANCELLED,
            cancellationReason: reason,
            cancellationDate: new Date()
          }
        });

        if (rental.payment && rental.payment.status === PaymentStatus.COMPLETED) {
          await tx.payment.update({
            where: { rentalId },
            data: { status: PaymentStatus.REFUNDED }
          });
        }

        await tx.notification.create({
          data: {
            message: `Reservering #${rentalId.slice(-6)} is geannuleerd.`,
            type: 'BOOKING',
            user: { connect: { id: rental.renterId } }
          }
        });

        await tx.notification.create({
          data: {
            message: `Reservering #${rentalId.slice(-6)} is geannuleerd.`,
            type: 'BOOKING',
            user: { connect: { id: rental.lessorId } }
          }
        });

        await tx.transactionLog.create({
          data: {
            type: 'BOOKING',
            message: `Reservation ${rentalId} cancelled: ${reason}`,
            referenceId: rentalId,
            user: { connect: { id: cancelledBy } }
          }
        });

        return updated;
      });
      
      try {
        if (rental.renter?.email && rental.trailer?.title) {
          const { sendBookingCancelledEmail, sendBookingCancelledToOwnerEmail } = await import('@/lib/email');
          
          const renterName = [rental.renter?.firstName, rental.renter?.lastName].filter(Boolean).join(' ') || 'Huurder';
          const lessorName = [rental.lessor?.firstName, rental.lessor?.lastName].filter(Boolean).join(' ') || 'Verhuurder';
          
          const renterId = rental.renter?.id || rental.renterId;
          const lessorId = rental.lessor?.id || rental.lessorId;
                  
          const cancelledByRenter = cancelledBy === renterId;
          
          if (rental.renter.email && renterId) {
            const emailSent = await sendBookingCancelledEmail(
              rental.renter.email,
              renterName,
              rental.trailer.title,
              {
                startDate: rental.startDate,
                endDate: rental.endDate,
                ownerName: lessorName,
                totalPrice: rental.totalPrice,
                bookingId: rental.id,
                cancellationReason: reason,
                renterId: renterId
              }
            );
          }
          
          if (rental.lessor?.email && lessorId) {
            const emailSent = await sendBookingCancelledToOwnerEmail(
              rental.lessor.email,
              lessorName,
              rental.trailer.title,
              {
                startDate: rental.startDate,
                endDate: rental.endDate,
                renterName: renterName,
                totalPrice: rental.totalPrice,
                bookingId: rental.id,
                cancellationReason: reason,
                ownerId: lessorId,
                cancelledByRenter: cancelledByRenter
              }
            );
          }
        }
      } catch (emailError) {
        console.error('Error sending cancellation emails:', emailError);
      }

      return updatedRental;
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      throw error;
    }
  }
}