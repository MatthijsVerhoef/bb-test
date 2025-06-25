// src/app/api/cleanup/temporary-blocks/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to clean up expired temporary blocks
async function cleanupExpiredTemporaryBlocks() {
  try {
    console.log('🧹 [CLEANUP] Running dedicated cleanup for expired temporary blocks');
    
    // Look for temporary blocks with PAYMENT_INTENT reason that have expired
    const now = new Date();
    
    // Clean up temporary blocks older than 1 hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // First, find blocks to delete
    const expiredBlocks = await prisma.blockedPeriod.findMany({
      where: {
        reason: {
          contains: 'PAYMENT_INTENT:'
        },
        // Only check creation time since we don't have metadata
        createdAt: {
          lt: oneHourAgo
        }
      },
      select: {
        id: true,
        reason: true,
        trailerId: true,
        createdAt: true,
        startDate: true,
        endDate: true
      }
    });
    
    if (expiredBlocks.length > 0) {
      console.log(`🧹 [CLEANUP] Found ${expiredBlocks.length} expired temporary blocks to clean up`);
      
      // Log details about each block for debugging
      expiredBlocks.forEach(block => {
        console.log(`🧹 [CLEANUP] Block ID: ${block.id}, Trailer: ${block.trailerId}, Reason: ${block.reason}, Created: ${block.createdAt}, Period: ${block.startDate.toISOString()} to ${block.endDate.toISOString()}`);
      });
      
      // Delete the expired blocks
      const result = await prisma.blockedPeriod.deleteMany({
        where: {
          id: {
            in: expiredBlocks.map(block => block.id)
          }
        }
      });
      
      console.log(`🧹 [CLEANUP] Successfully removed ${result.count} expired temporary blocks`);
      return { count: result.count, blocks: expiredBlocks };
    } else {
      console.log('🧹 [CLEANUP] No expired temporary blocks found');
      return { count: 0, blocks: [] };
    }
  } catch (error) {
    console.error('🧹 [CLEANUP] Error cleaning up expired temporary blocks:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const result = await cleanupExpiredTemporaryBlocks();
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully cleaned up ${result.count} expired temporary blocks`,
      cleanedBlocks: result.count,
      details: result.blocks
    }, { status: 200 });
  } catch (error) {
    console.error('Error in cleanup endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to clean up temporary blocks' },
      { status: 500 }
    );
  }
}