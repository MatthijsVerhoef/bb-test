import { prisma } from '@/lib/prisma';

export async function createTemporaryBlock(
  trailerId: string,
  startDate: Date,
  endDate: Date,
  userId: string,
  paymentIntentId: string
) {
  try {
    if (!trailerId || !startDate || !endDate || !userId || !paymentIntentId) {
      return null;
    }

    if (!(startDate instanceof Date) || !(endDate instanceof Date) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return null;
    }

    if (startDate >= endDate) {
      return null;
    }

    const exactReason = `PAYMENT_INTENT:${paymentIntentId}`;

    const existingBlock = await prisma.blockedPeriod.findFirst({
      where: {
        reason: exactReason
      }
    });

    if (existingBlock) {
      return existingBlock;
    }

    const overlappingBlocks = await prisma.blockedPeriod.findMany({
      where: {
        trailerId,
        NOT: {
          userId: userId
        },
        OR: [
          {
            startDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            endDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
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
      return null;
    }

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
      const exactMatch = existingUserBlocks.find(block => 
        block.startDate.getTime() === startDate.getTime() && 
        block.endDate.getTime() === endDate.getTime()
      );

      if (exactMatch) {
        const updatedBlock = await prisma.blockedPeriod.update({
          where: {
            id: exactMatch.id
          },
          data: {
            reason: exactReason
          }
        });
        return updatedBlock;
      } else {
        await prisma.blockedPeriod.deleteMany({
          where: {
            id: {
              in: existingUserBlocks.map(block => block.id)
            }
          }
        });
      }
    }

    const trailer = await prisma.trailer.findUnique({
      where: { id: trailerId },
      select: { id: true, title: true }
    });

    if (!trailer) {
      return null;
    }

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

    return blockedPeriod;
  } catch (error) {
    return null;
  }
}

export async function removeTemporaryBlock(paymentIntentId: string) {
  if (!paymentIntentId) {
    return false;
  }

  try {
    const exactReason = `PAYMENT_INTENT:${paymentIntentId}`;

    const blocksToDelete = await prisma.blockedPeriod.findMany({
      where: {
        reason: exactReason
      },
      select: {
        id: true
      }
    });

    if (blocksToDelete.length === 0) {
      const fallbackBlocks = await prisma.blockedPeriod.findMany({
        where: {
          reason: {
            contains: paymentIntentId
          }
        },
        select: {
          id: true,
          reason: true
        }
      });

      if (fallbackBlocks.length > 0) {
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
          return deletedFallbackBlocks.count > 0;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    const deletedBlocks = await prisma.blockedPeriod.deleteMany({
      where: {
        reason: exactReason
      }
    });

    return deletedBlocks.count > 0;
  } catch (error) {
    return false;
  }
}

export async function finalizeTemporaryBlock(paymentIntentId: string, rentalId: string) {
  if (!paymentIntentId || !rentalId) {
    return false;
  }

  try {
    const exactReason = `PAYMENT_INTENT:${paymentIntentId}`;
    const newReason = `CONFIRMED_RENTAL:${rentalId}`;

    const blocksToUpdate = await prisma.blockedPeriod.findMany({
      where: {
        reason: exactReason
      },
      select: {
        id: true
      }
    });

    if (blocksToUpdate.length === 0) {
      const fallbackBlocks = await prisma.blockedPeriod.findMany({
        where: {
          reason: {
            contains: paymentIntentId
          }
        },
        select: {
          id: true,
          reason: true
        }
      });

      if (fallbackBlocks.length > 0) {
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
          return updatedFallbackBlocks.count > 0;
        }
      }

      const existingConfirmedBlocks = await prisma.blockedPeriod.findMany({
        where: {
          reason: newReason
        },
        select: { id: true }
      });

      if (existingConfirmedBlocks.length > 0) {
        return true;
      }

      return false;
    }

    const updatedBlocks = await prisma.blockedPeriod.updateMany({
      where: {
        reason: exactReason
      },
      data: {
        reason: newReason
      }
    });

    return updatedBlocks.count > 0;
  } catch (error) {
    return false;
  }
}
