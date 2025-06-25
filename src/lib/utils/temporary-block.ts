import { prisma } from '@/lib/prisma';

/**
 * Creates a temporary blocked period for a trailer during the payment process
 * @param trailerId - The ID of the trailer to block
 * @param startDate - Start date of the booking
 * @param endDate - End date of the booking
 * @param userId - ID of the user making the reservation
 * @param paymentIntentId - The Stripe payment intent ID (used to identify the block)
 * @returns The created blocked period or null if creation failed
 */
export async function createTemporaryBlock(
  trailerId: string,
  startDate: Date,
  endDate: Date,
  userId: string,
  paymentIntentId: string
) {
  try {
    // Validate required parameters
    if (!trailerId || !startDate || !endDate || !userId || !paymentIntentId) {
      console.error('🔒 [TEMPORARY-BLOCK] ERROR: Missing required parameters for createTemporaryBlock');
      return null;
    }
    
    // Validate dates
    if (!(startDate instanceof Date) || !(endDate instanceof Date) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('🔒 [TEMPORARY-BLOCK] ERROR: Invalid date parameters for createTemporaryBlock');
      return null;
    }

    // Ensure start date is before end date
    if (startDate >= endDate) {
      console.error(`🔒 [TEMPORARY-BLOCK] ERROR: Start date (${startDate.toISOString()}) must be before end date (${endDate.toISOString()})`);
      return null;
    }

    console.log('🔒 [TEMPORARY-BLOCK] Creating temporary block with the following data:');
    console.log(`🔒 [TEMPORARY-BLOCK] TrailerId: ${trailerId}`);
    console.log(`🔒 [TEMPORARY-BLOCK] StartDate: ${startDate.toISOString()}`);
    console.log(`🔒 [TEMPORARY-BLOCK] EndDate: ${endDate.toISOString()}`);
    console.log(`🔒 [TEMPORARY-BLOCK] UserId: ${userId}`);
    console.log(`🔒 [TEMPORARY-BLOCK] PaymentIntentId: ${paymentIntentId}`);
    
    // Create the exact reason string
    const exactReason = `PAYMENT_INTENT:${paymentIntentId}`;
    
    // Check if a temporary block already exists for this payment intent
    const existingBlock = await prisma.blockedPeriod.findFirst({
      where: {
        reason: exactReason
      }
    });
    
    if (existingBlock) {
      console.log(`🔒 [TEMPORARY-BLOCK] WARNING: Temporary block already exists for payment intent ${paymentIntentId}`);
      console.log(`🔒 [TEMPORARY-BLOCK] Existing block ID: ${existingBlock.id}`);
      return existingBlock;
    }
    
    // Check if the dates are already blocked by other reservations or blocks
    const overlappingBlocks = await prisma.blockedPeriod.findMany({
      where: {
        trailerId,
        // Don't include blocks created by this user
        NOT: {
          userId: userId
        },
        OR: [
          {
            // Block starts during our period
            startDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            // Block ends during our period
            endDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            // Block spans our entire period
            startDate: {
              lte: startDate
            },
            endDate: {
              gte: endDate
            }
          }
        ]
      }
    });
    
    if (overlappingBlocks.length > 0) {
      console.error(`🔒 [TEMPORARY-BLOCK] ERROR: Dates are already blocked for trailer ${trailerId} by another user (${overlappingBlocks.length} overlapping blocks found)`);
      return null;
    }
    
    // IMPORTANT FIX: Check if the user already has ANY block for these dates
    // and either update it or remove it before creating a new one
    const existingUserBlocks = await prisma.blockedPeriod.findMany({
      where: {
        trailerId,
        userId,
        OR: [
          {
            startDate: startDate,
            endDate: endDate
          },
          {
            startDate: { gte: startDate, lte: endDate }
          },
          {
            endDate: { gte: startDate, lte: endDate }
          },
          {
            startDate: { lte: startDate },
            endDate: { gte: endDate }
          }
        ]
      }
    });
    
    if (existingUserBlocks.length > 0) {
      console.log(`🔒 [TEMPORARY-BLOCK] Found ${existingUserBlocks.length} existing blocks by this user for overlapping dates`);
      
      // If there's exactly one block with the same dates, update it
      const exactMatch = existingUserBlocks.find(block => 
        block.startDate.getTime() === startDate.getTime() && 
        block.endDate.getTime() === endDate.getTime()
      );
      
      if (exactMatch) {
        console.log(`🔒 [TEMPORARY-BLOCK] Found exact match block ID: ${exactMatch.id}, current reason: ${exactMatch.reason}`);
        
        // Update the existing block with the new payment intent ID
        const updatedBlock = await prisma.blockedPeriod.update({
          where: {
            id: exactMatch.id
          },
          data: {
            reason: exactReason
          }
        });
        
        console.log(`🔒 [TEMPORARY-BLOCK] Updated existing block with new payment intent ID: ${paymentIntentId}`);
        return updatedBlock;
      } else {
        // Delete all old blocks from this user for overlapping dates
        // This handles cases where user has abandoned payment attempts
        const deletedCount = await prisma.blockedPeriod.deleteMany({
          where: {
            id: {
              in: existingUserBlocks.map(block => block.id)
            }
          }
        });
        
        console.log(`🔒 [TEMPORARY-BLOCK] Deleted ${deletedCount.count} overlapping blocks from previous attempts`);
      }
    }
    
    // Check if trailer exists
    const trailer = await prisma.trailer.findUnique({
      where: { id: trailerId },
      select: { id: true, title: true }
    });
    
    if (!trailer) {
      console.error(`🔒 [TEMPORARY-BLOCK] ERROR: Trailer with ID ${trailerId} not found`);
      return null;
    }
    
    console.log(`🔒 [TEMPORARY-BLOCK] Found trailer: ${trailer.title || 'Unnamed trailer'}`);
    
    // Create a blocked period with the exact reason string
    const blockedPeriod = await prisma.blockedPeriod.create({
      data: {
        startDate,
        endDate,
        reason: exactReason,
        allDay: true,
        trailerId,
        userId
      }
    });

    console.log(`🔒 [TEMPORARY-BLOCK] SUCCESS: Created temporary block ID: ${blockedPeriod.id}`);
    console.log(`🔒 [TEMPORARY-BLOCK] Created block for trailer ${trailerId} from ${startDate.toISOString()} to ${endDate.toISOString()} for payment intent ${paymentIntentId}`);
    return blockedPeriod;
  } catch (error) {
    console.error('🔒 [TEMPORARY-BLOCK] ERROR: Failed to create temporary block:', error);
    return null;
  }
}

/**
 * Removes a temporary blocked period for a trailer if the payment intent is cancelled
 * @param paymentIntentId - The Stripe payment intent ID to find the block
 * @returns Boolean indicating if the operation was successful
 */
export async function removeTemporaryBlock(paymentIntentId: string) {
  if (!paymentIntentId) {
    console.error('🔓 [TEMPORARY-BLOCK] ERROR: Missing required parameter for removeTemporaryBlock');
    return false; // Return false instead of throwing to prevent breaking payment flow
  }

  try {
    console.log(`🔓 [TEMPORARY-BLOCK] Removing temporary block for payment intent: ${paymentIntentId}`);
    
    // Create the exact reason string we expect to find
    const exactReason = `PAYMENT_INTENT:${paymentIntentId}`;
    
    // First, find the blocks to get details before deletion
    const blocksToDelete = await prisma.blockedPeriod.findMany({
      where: {
        reason: exactReason // Use exact match instead of contains
      },
      select: {
        id: true,
        trailerId: true,
        startDate: true,
        endDate: true
      }
    });
    
    console.log(`🔓 [TEMPORARY-BLOCK] Found ${blocksToDelete.length} blocks to remove:`);
    blocksToDelete.forEach(block => {
      console.log(`🔓 [TEMPORARY-BLOCK] - Block ID: ${block.id}, TrailerId: ${block.trailerId}, Dates: ${block.startDate.toISOString()} to ${block.endDate.toISOString()}`);
    });
    
    if (blocksToDelete.length === 0) {
      // Try a broader search if exact match failed - this is a fallback
      console.log(`🔓 [TEMPORARY-BLOCK] No blocks found with exact reason. Trying broader search...`);
      
      const fallbackBlocks = await prisma.blockedPeriod.findMany({
        where: {
          reason: {
            contains: paymentIntentId
          }
        },
        select: {
          id: true,
          reason: true,
          trailerId: true
        }
      });
      
      if (fallbackBlocks.length > 0) {
        console.log(`🔓 [TEMPORARY-BLOCK] Found ${fallbackBlocks.length} blocks in broader search:`);
        fallbackBlocks.forEach(block => {
          console.log(`🔓 [TEMPORARY-BLOCK] - Block ID: ${block.id}, Reason: ${block.reason}, TrailerId: ${block.trailerId}`);
        });
        
        // Only delete blocks that actually contain the payment intent ID in some form
        const blocksToDeleteIds = fallbackBlocks
          .filter(block => block.reason.includes(paymentIntentId))
          .map(block => block.id);
        
        if (blocksToDeleteIds.length > 0) {
          const deletedFallbackBlocks = await prisma.blockedPeriod.deleteMany({
            where: {
              id: {
                in: blocksToDeleteIds
              }
            }
          });
          
          console.log(`🔓 [TEMPORARY-BLOCK] SUCCESS: Removed ${deletedFallbackBlocks.count} temporary blocks in fallback mode for payment intent ${paymentIntentId}`);
          return deletedFallbackBlocks.count > 0;
        } else {
          console.log(`🔓 [TEMPORARY-BLOCK] No suitable blocks found to delete in fallback search`);
          return false;
        }
      } else {
        console.log(`🔓 [TEMPORARY-BLOCK] INFO: No temporary blocks found to remove for payment intent ${paymentIntentId}`);
        return false;
      }
    }
    
    // Find and delete any blocked periods with the exact payment intent ID in the reason
    const deletedBlocks = await prisma.blockedPeriod.deleteMany({
      where: {
        reason: exactReason // Use exact match instead of contains
      }
    });

    console.log(`🔓 [TEMPORARY-BLOCK] SUCCESS: Removed ${deletedBlocks.count} temporary blocks for payment intent ${paymentIntentId}`);
    return deletedBlocks.count > 0;
  } catch (error) {
    console.error('🔓 [TEMPORARY-BLOCK] ERROR: Failed to remove temporary block:', error);
    // Return false instead of throwing to prevent breaking payment flow
    return false;
  }
}

/**
 * Changes the reason of the temporary block when a reservation is confirmed
 * This ensures the block remains in place but is no longer tied to the payment intent
 * @param paymentIntentId - The Stripe payment intent ID to find the block
 * @param rentalId - The confirmed rental ID
 * @returns Boolean indicating if the operation was successful
 */
export async function finalizeTemporaryBlock(paymentIntentId: string, rentalId: string) {
  if (!paymentIntentId || !rentalId) {
    console.error('🔒 [TEMPORARY-BLOCK] ERROR: Missing required parameters for finalizeTemporaryBlock');
    return false; // Return false instead of throwing to prevent breaking payment flow
  }

  try {
    console.log(`🔒 [TEMPORARY-BLOCK] Finalizing temporary block for payment intent: ${paymentIntentId} as rental: ${rentalId}`);
    
    // Create the exact reason string we expect to find
    const exactReason = `PAYMENT_INTENT:${paymentIntentId}`;
    const newReason = `CONFIRMED_RENTAL:${rentalId}`;
    
    // First, find the blocks to get details before update
    const blocksToUpdate = await prisma.blockedPeriod.findMany({
      where: {
        reason: exactReason // Use exact match instead of contains
      },
      select: {
        id: true,
        trailerId: true,
        startDate: true,
        endDate: true
      }
    });
    
    console.log(`🔒 [TEMPORARY-BLOCK] Found ${blocksToUpdate.length} blocks to finalize:`);
    blocksToUpdate.forEach(block => {
      console.log(`🔒 [TEMPORARY-BLOCK] - Block ID: ${block.id}, TrailerId: ${block.trailerId}, Dates: ${block.startDate.toISOString()} to ${block.endDate.toISOString()}`);
    });
    
    if (blocksToUpdate.length === 0) {
      // Try a broader search if exact match failed - this is a fallback
      console.log(`🔒 [TEMPORARY-BLOCK] No blocks found with exact reason. Trying broader search...`);
      
      const fallbackBlocks = await prisma.blockedPeriod.findMany({
        where: {
          reason: {
            contains: paymentIntentId
          }
        },
        select: {
          id: true,
          reason: true,
          trailerId: true
        }
      });
      
      if (fallbackBlocks.length > 0) {
        console.log(`🔒 [TEMPORARY-BLOCK] Found ${fallbackBlocks.length} blocks in broader search:`);
        fallbackBlocks.forEach(block => {
          console.log(`🔒 [TEMPORARY-BLOCK] - Block ID: ${block.id}, Reason: ${block.reason}, TrailerId: ${block.trailerId}`);
        });
        
        // Only update blocks that actually contain the payment intent ID in some form
        const blocksToUpdateIds = fallbackBlocks
          .filter(block => block.reason.includes(paymentIntentId))
          .map(block => block.id);
        
        if (blocksToUpdateIds.length > 0) {
          const updatedFallbackBlocks = await prisma.blockedPeriod.updateMany({
            where: {
              id: {
                in: blocksToUpdateIds
              }
            },
            data: {
              reason: newReason
            }
          });
          
          console.log(`🔒 [TEMPORARY-BLOCK] SUCCESS: Finalized ${updatedFallbackBlocks.count} temporary blocks in fallback mode for payment intent ${paymentIntentId}`);
          return updatedFallbackBlocks.count > 0;
        }
      }
      
      // Check if blocks already exist with CONFIRMED_RENTAL for this rental
      // This indicates the block was already finalized
      const existingConfirmedBlocks = await prisma.blockedPeriod.findMany({
        where: {
          reason: newReason
        },
        select: { id: true }
      });
      
      if (existingConfirmedBlocks.length > 0) {
        console.log(`🔒 [TEMPORARY-BLOCK] INFO: Found ${existingConfirmedBlocks.length} existing confirmed blocks for rental ${rentalId}. Blocks likely already finalized.`);
        return true; // Return true since the blocks are already finalized
      }
      
      console.warn(`🔒 [TEMPORARY-BLOCK] WARNING: No temporary blocks found for payment intent ${paymentIntentId}`);
      return false;
    }
    
    // Find and update any blocked periods with the exact payment intent ID in the reason
    const updatedBlocks = await prisma.blockedPeriod.updateMany({
      where: {
        reason: exactReason // Use exact match instead of contains
      },
      data: {
        reason: newReason
      }
    });

    console.log(`🔒 [TEMPORARY-BLOCK] SUCCESS: Finalized ${updatedBlocks.count} temporary blocks for payment intent ${paymentIntentId} as rental ${rentalId}`);
    return updatedBlocks.count > 0;
  } catch (error) {
    console.error('🔒 [TEMPORARY-BLOCK] ERROR: Failed to finalize temporary block:', error);
    // Return false instead of throwing to prevent breaking payment flow
    return false;
  }
}