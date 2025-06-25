// app/api/rentals/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendBookingConfirmationEmail, sendBookingCancelledEmail, sendBookingCancelledToOwnerEmail } from '@/lib/email';

// Valid status transitions - which statuses can transition to which
const VALID_TRANSITIONS = {
  'PENDING': ['CONFIRMED', 'CANCELLED'],
  'CONFIRMED': ['ACTIVE', 'CANCELLED'],
  'ACTIVE': ['COMPLETED', 'LATE_RETURN', 'DISPUTED'],
  'LATE_RETURN': ['COMPLETED', 'DISPUTED'],
  'DISPUTED': ['COMPLETED'],
  'CANCELLED': ['PENDING', 'CONFIRMED'], // Allow reactivating cancelled bookings
  // No transitions from COMPLETED
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to access this resource' },
        { status: 401 }
      );
    }

    // 2. Validate request parameters
    // Fix for Next.js dynamic route parameters warning - explicitly await
    const paramsObj = await Promise.resolve(params);
    const rentalId = paramsObj.id;
    if (!rentalId) {
      return NextResponse.json(
        { error: 'Rental ID is required' },
        { status: 400 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { status, note } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // 4. Fetch the rental
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

    // 5. Check permissions
    const userId = session.user.id;
    const isLessor = rental.lessorId === userId || rental.trailer.ownerId === userId;
    const isAdmin = session.user.role === 'ADMIN';
    const isSupport = session.user.role === 'SUPPORT';

    if (!isLessor && !isAdmin && !isSupport) {
      return NextResponse.json(
        { error: 'You do not have permission to update this rental' },
        { status: 403 }
      );
    }

    // 6. Validate status transition
    if (!VALID_TRANSITIONS[rental.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${rental.status} to ${status}` },
        { status: 400 }
      );
    }

    // 7. Prepare update data
    const updateData: any = {
      status,
    };

    // 8. Add a note if provided
    if (note) {
      // Format the note to include timestamp and user info
      const timestamp = new Date().toISOString().substr(0, 10); // Use just the date part to save space
      const userInfo = `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim().substring(0, 15); // Limit name length
      
      // Limit the note length severely to prevent exceeding database field size
      // Truncate note if needed to keep the total under database limit
      const maxNoteLength = 70; // Much more strict limit
      const truncatedNote = note.length > maxNoteLength 
        ? `${note.substring(0, maxNoteLength)}...` 
        : note;
      
      const formattedNote = `${timestamp} ${userInfo}: ${truncatedNote}`;
      
      // Ensure total specialNotes doesn't exceed database limit (appears to be a small VARCHAR field)
      const maxTotalLength = 100; // Significantly reduced length limit
      
      // Don't even try to append - just use the latest note
      updateData.specialNotes = formattedNote.substring(0, maxTotalLength);
    }

    // 9. Add status-specific fields
    if (status === 'CANCELLED') {
      updateData.cancellationDate = new Date();
      updateData.cancellationReason = note || 'Cancelled by lessor';
    } else if (status === 'COMPLETED') {
      updateData.actualReturnDate = new Date();
    } else if ((status === 'PENDING' || status === 'CONFIRMED') && rental.status === 'CANCELLED') {
      // If reactivating a cancelled rental, clear the cancellation data
      updateData.cancellationDate = null;
      updateData.cancellationReason = null;
    }

    // 10. Update the rental
    const updatedRental = await prisma.rental.update({
      where: { id: rentalId },
      data: updateData,
    });

    // 11. Create notification for the renter with Dutch status
    // Map status to Dutch
    const dutchStatusMap: Record<string, string> = {
      'PENDING': 'In afwachting',
      'CONFIRMED': 'Bevestigd',
      'ACTIVE': 'Actief',
      'CANCELLED': 'Geannuleerd',
      'COMPLETED': 'Voltooid',
      'LATE_RETURN': 'Verlate teruggave',
      'DISPUTED': 'In geschil'
    };
    
    const dutchStatus = dutchStatusMap[status] || status;
    
    // Create the notification message
    let notificationMessage = '';
    
    // Special message for reactivating a cancelled booking
    if ((status === 'PENDING' || status === 'CONFIRMED') && rental.status === 'CANCELLED') {
      notificationMessage = `Je verhuring ${rental.id.substring(0, 8)} is opnieuw geactiveerd met status "${dutchStatus}"${note ? ": " + note : ''}`;
    } else {
      notificationMessage = `Je verhuring ${rental.id.substring(0, 8)} is bijgewerkt naar "${dutchStatus}"${note ? ": " + note : ''}`;
    }
    
    await prisma.notification.create({
      data: {
        userId: rental.renterId,
        message: notificationMessage,
        type: 'BOOKING', // Using valid enum value from NotificationType
        read: false,
        actionUrl: `/profiel?tab=rentals&mode=renter`,
        // Set expiration date to 30 days from now
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
    });

    // 12. Send email notification for status change
    if (status === 'CONFIRMED' || status === 'CANCELLED') {
      try {
        // Fetch detailed information for the email
        const rentalDetails = await prisma.rental.findUnique({
          where: { id: rentalId },
          include: {
            trailer: {
              select: {
                id: true,
                title: true,
                ownerId: true
              }
            },
            renter: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            },
            lessor: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        });

        if (rentalDetails && rentalDetails.renter.email) {
          const renterName = [rentalDetails.renter.firstName, rentalDetails.renter.lastName].filter(Boolean).join(' ') || 'Huurder';
          const ownerName = [rentalDetails.lessor.firstName, rentalDetails.lessor.lastName].filter(Boolean).join(' ') || 'Verhuurder';
          
          // If status is CONFIRMED, send confirmation email
          if (status === 'CONFIRMED') {
            console.log(`Sending booking confirmation email to renter ${rentalDetails.renter.id}`);
            await sendBookingConfirmationEmail(
              rentalDetails.renter.email,
              renterName,
              rentalDetails.trailer.title || 'Aanhanger',
              {
                startDate: rentalDetails.startDate,
                endDate: rentalDetails.endDate,
                ownerName: ownerName,
                totalPrice: rentalDetails.totalPrice,
                bookingId: rentalDetails.id,
                pickupLocation: rentalDetails.pickupLocation || 'Nader overeen te komen',
                renterId: rentalDetails.renter.id  // FIXED: Added renterId
              }
            );
          } 
          // If status is CANCELLED, send cancellation email
          else if (status === 'CANCELLED') {
            console.log(`Sending booking cancellation email to renter ${rentalDetails.renter.id}`);
            await sendBookingCancelledEmail(
              rentalDetails.renter.email,
              renterName,
              rentalDetails.trailer.title || 'Aanhanger',
              {
                startDate: rentalDetails.startDate,
                endDate: rentalDetails.endDate,
                ownerName: ownerName,
                totalPrice: rentalDetails.totalPrice,
                bookingId: rentalDetails.id,
                cancellationReason: note || 'Geannuleerd door verhuurder',
                renterId: rentalDetails.renter.id  // FIXED: Added renterId
              }
            );

            // Also send cancellation email to owner
            if (rentalDetails.lessor.email) {
              console.log(`Sending booking cancellation email to owner ${rentalDetails.lessor.id}`);
              const lessorName = [rentalDetails.lessor.firstName, rentalDetails.lessor.lastName].filter(Boolean).join(' ') || 'Verhuurder';
              
              await sendBookingCancelledToOwnerEmail(
                rentalDetails.lessor.email,
                lessorName,
                rentalDetails.trailer.title || 'Aanhanger',
                {
                  startDate: rentalDetails.startDate,
                  endDate: rentalDetails.endDate,
                  renterName: renterName,
                  totalPrice: rentalDetails.totalPrice,
                  bookingId: rentalDetails.id,
                  cancellationReason: note || 'Geannuleerd',
                  ownerId: rentalDetails.lessor.id,
                  cancelledByRenter: false // Since this is triggered by the lessor
                }
              );
            }
          }
        }
      } catch (emailError) {
        // Log but don't fail the entire operation
        console.error('Error sending status update email:', emailError);
      }
    }

    // 13. Return success response
    return NextResponse.json({ 
      success: true,
      rental: updatedRental,
    });
    
  } catch (error) {
    console.error('Error updating rental status:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the rental status' },
      { status: 500 }
    );
  }
}