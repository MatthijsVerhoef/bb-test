// app/api/user/profile/lessor-calendar/blocked-periods/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  console.log(`[${requestId}] DELETE /blocked-periods/[id] - Start at ${new Date().toISOString()}`);
  
  try {
    // Step 1: Get session with timeout
    console.log(`[${requestId}] Step 1: Getting session...`);
    const sessionStartTime = Date.now();
    
    const sessionPromise = getServerSession(authOptions);
    const sessionTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session timeout')), 10000) // 10 second timeout
    );
    
    const session = await Promise.race([sessionPromise, sessionTimeoutPromise]) as any;
    console.log(`[${requestId}] Session obtained in ${Date.now() - sessionStartTime}ms, user: ${session?.user?.id || 'none'}`);
    
    if (!session?.user?.id) {
      console.log(`[${requestId}] No session found, returning 401`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Step 2: Get params
    console.log(`[${requestId}] Step 2: Getting params...`);
    const paramsStartTime = Date.now();
    const { id: blockedPeriodId } = await params;
    console.log(`[${requestId}] Params obtained in ${Date.now() - paramsStartTime}ms, blockedPeriodId: ${blockedPeriodId}`);
    
    // Step 3: Find user with timeout
    console.log(`[${requestId}] Step 3: Finding user...`);
    const userStartTime = Date.now();
    
    const userPromise = prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    const userTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('User query timeout')), 5000)
    );
    
    const user = await Promise.race([userPromise, userTimeoutPromise]) as any;
    console.log(`[${requestId}] User found in ${Date.now() - userStartTime}ms, role: ${user?.role || 'none'}`);
    
    if (!user || (user.role !== "LESSOR" && user.role !== "ADMIN")) {
      console.log(`[${requestId}] User not authorized, role: ${user?.role}`);
      return NextResponse.json(
        { error: "You need to be a lessor to perform this action" },
        { status: 403 }
      );
    }
    
    // Step 4: Find blocked period with timeout
    console.log(`[${requestId}] Step 4: Finding blocked period...`);
    const findStartTime = Date.now();
    
    const blockedPeriodPromise = prisma.blockedPeriod.findFirst({
      where: {
        id: blockedPeriodId,
        OR: [
          { userId: userId },
          { trailer: { ownerId: userId } },
        ],
      },
      include: {
        trailer: {
          select: {
            id: true,
            ownerId: true,
          }
        }
      }
    });
    const findTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Find blocked period timeout')), 8000)
    );
    
    const blockedPeriod = await Promise.race([blockedPeriodPromise, findTimeoutPromise]) as any;
    console.log(`[${requestId}] Blocked period query completed in ${Date.now() - findStartTime}ms, found: ${!!blockedPeriod}`);
    
    if (!blockedPeriod) {
      console.log(`[${requestId}] Blocked period not found, returning 404`);
      return NextResponse.json(
        { error: "Blocked period not found or doesn't belong to you" },
        { status: 404 }
      );
    }
    
    console.log(`[${requestId}] Blocked period details - ID: ${blockedPeriod.id}, UserId: ${blockedPeriod.userId}, TrailerId: ${blockedPeriod.trailerId}`);
    
    // Step 5: Delete blocked period with timeout
    console.log(`[${requestId}] Step 5: Deleting blocked period...`);
    const deleteStartTime = Date.now();
    
    const deletePromise = prisma.blockedPeriod.delete({
      where: {
        id: blockedPeriodId,
      },
    });
    const deleteTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Delete timeout')), 8000)
    );
    
    await Promise.race([deletePromise, deleteTimeoutPromise]);
    console.log(`[${requestId}] Delete completed in ${Date.now() - deleteStartTime}ms`);
    
    // Step 6: Return success
    const totalTime = Date.now() - startTime;
    console.log(`[${requestId}] Request completed successfully in ${totalTime}ms`);
    
    return NextResponse.json({ 
      success: true,
      debug: {
        requestId,
        totalTime,
        blockedPeriodId,
      }
    });
    
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error(`[${requestId}] Error after ${totalTime}ms:`, {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    
    // Handle specific timeout errors
    if (error.message.includes('timeout')) {
      return NextResponse.json(
        { 
          error: `Request timeout: ${error.message}`,
          debug: {
            requestId,
            totalTime,
            timeoutAt: error.message,
          }
        },
        { status: 504 }
      );
    }
    
    // Handle Prisma specific errors
    if (error.code === 'P2025') {
      console.log(`[${requestId}] Prisma P2025 error - Record not found`);
      return NextResponse.json(
        { error: "Blocked period not found" },
        { status: 404 }
      );
    }
    
    if (error.code === 'P2002') {
      console.log(`[${requestId}] Prisma P2002 error - Unique constraint violation`);
      return NextResponse.json(
        { error: "Database constraint error" },
        { status: 409 }
      );
    }
    
    // Log any database connection errors
    if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      console.error(`[${requestId}] Database connection error`);
      return NextResponse.json(
        { 
          error: "Database connection failed",
          debug: {
            requestId,
            totalTime,
          }
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to delete blocked period",
        debug: {
          requestId,
          totalTime,
          errorMessage: error.message,
        }
      },
      { status: 500 }
    );
  }
}

// Ensure the route is dynamic
export const dynamic = 'force-dynamic';

// Add OPTIONS method for CORS if needed
export async function OPTIONS() {
  return NextResponse.json({}, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}