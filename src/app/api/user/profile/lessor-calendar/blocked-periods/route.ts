console.log('===== BLOCKED PERIODS ROUTE FILE EXECUTING =====');

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";

console.log('===== BLOCKED PERIODS ROUTE LOADED =====');

const blockedPeriodSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().optional(),
  allDay: z.boolean().default(true),
  morning: z.boolean().default(false),
  afternoon: z.boolean().default(false),
  evening: z.boolean().default(false),
  trailerId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET!
    });
    
    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.id as string;
    
    // Get all blocked periods for this user
    const blockedPeriods = await prisma.blockedPeriod.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        reason: true,
        allDay: true,
        morning: true,
        afternoon: true,
        evening: true,
        trailerId: true,
        trailer: {
          select: {
            id: true,
            title: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return NextResponse.json({ blockedPeriods });
  } catch (error) {
    console.error("Error fetching blocked periods:", error);
    return NextResponse.json(
      { error: "Failed to fetch blocked periods" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log('===== POST HANDLER CALLED =====');
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  const log = (step: string, data?: any) => {
    const elapsed = Date.now() - startTime;
    console.log(`[${requestId}] ${elapsed}ms - ${step}`, data ? JSON.stringify(data) : '');
  };
  
  log('POST /blocked-periods - Start');
  
  try {
    // Step 1: Parse request body
    log('Step 1: Starting to parse request body...');
    const bodyStartTime = Date.now();
    let body;
    try {
      body = await req.json();
      log('Step 1: Body parsed successfully', {
        parseTime: Date.now() - bodyStartTime,
        bodyKeys: Object.keys(body),
        hasTrailerId: !!body.trailerId,
        startDate: body.startDate,
        endDate: body.endDate
      });
    } catch (parseError) {
      log('Step 1: ERROR parsing body', { error: parseError.message });
      throw parseError;
    }

    // Step 2: Get token
    log('Step 2: Getting token...');
    const tokenStartTime = Date.now();
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET!
    });
    log('Step 2: Token retrieved', {
      tokenTime: Date.now() - tokenStartTime,
      hasToken: !!token,
      userId: token?.id
    });
    
    if (!token?.id) {
      log('Step 2: No token found, returning 401');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.id as string;

    // Step 3: Validate request data
    log('Step 3: Validating request data...');
    let validatedData;
    try {
      validatedData = blockedPeriodSchema.parse(body);
      log('Step 3: Data validated successfully');
    } catch (validationError) {
      log('Step 3: Validation failed', { error: validationError });
      throw validationError;
    }

    // Step 4: Check user role
    log('Step 4: Checking user role...');
    const userCheckStartTime = Date.now();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    log('Step 4: User check completed', {
      queryTime: Date.now() - userCheckStartTime,
      found: !!user,
      role: user?.role
    });

    if (!user || (user.role !== "LESSOR" && user.role !== "ADMIN")) {
      log('Step 4: User not authorized');
      return NextResponse.json(
        { error: "You need to be a lessor to perform this action" },
        { status: 403 }
      );
    }

    // Step 5: Check trailer ownership if provided
    if (validatedData.trailerId) {
      log('Step 5: Checking trailer ownership...', { trailerId: validatedData.trailerId });
      const trailerCheckStartTime = Date.now();
      
      try {
        const trailer = await prisma.trailer.findFirst({
          where: {
            id: validatedData.trailerId,
            ownerId: userId,
          },
          select: { id: true },
        });
        
        log('Step 5: Trailer check completed', {
          queryTime: Date.now() - trailerCheckStartTime,
          found: !!trailer
        });

        if (!trailer) {
          log('Step 5: Trailer not found or not owned by user');
          return NextResponse.json(
            { error: "Trailer not found or you don't have permission" },
            { status: 404 }
          );
        }
      } catch (trailerError) {
        log('Step 5: ERROR checking trailer', { 
          error: trailerError.message,
          code: trailerError.code 
        });
        throw trailerError;
      }
    } else {
      log('Step 5: No trailer ID provided, skipping trailer check');
    }

    // Step 6: Prepare dates
    log('Step 6: Preparing dates...');
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    
    log('Step 6: Dates prepared', {
      startDateISO: startDate.toISOString(),
      endDateISO: endDate.toISOString(),
      startDateLocal: startDate.toString(),
      endDateLocal: endDate.toString(),
    });

    // Step 7: Create blocked period
    log('Step 7: Creating blocked period in database...');
    const createStartTime = Date.now();
    
    // Log the exact data being sent to Prisma
    const createData = {
      startDate,
      endDate,
      reason: validatedData.reason || null,
      allDay: validatedData.allDay,
      morning: validatedData.morning,
      afternoon: validatedData.afternoon,
      evening: validatedData.evening,
      trailerId: validatedData.trailerId || null,
      userId: userId,
    };
    log('Step 7a: Create data prepared', createData);

    let blockedPeriod;
    try {
      // Create with timeout
      const createPromise = prisma.blockedPeriod.create({
        data: createData,
        include: {
          trailer: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database operation timeout')), 25000)
      );

      blockedPeriod = await Promise.race([createPromise, timeoutPromise]);
      
      log('Step 7: Create completed successfully', {
        createTime: Date.now() - createStartTime,
        id: blockedPeriod.id
      });
    } catch (createError) {
      log('Step 7: ERROR creating blocked period', {
        error: createError.message,
        code: createError.code,
        createTime: Date.now() - createStartTime
      });
      throw createError;
    }
    
    // Step 8: Return response
    const totalTime = Date.now() - startTime;
    log('Step 8: Request completed successfully', {
      totalTime,
      blockedPeriodId: blockedPeriod.id
    });
    
    return NextResponse.json({ blockedPeriod }, { status: 201 });
    
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    log('ERROR: Request failed', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      totalTime
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.message === 'Database operation timeout') {
      return NextResponse.json(
        { error: "Database operation timed out" },
        { status: 504 }
      );
    }
    
    // Log any Prisma-specific errors
    if (error.code) {
      log('Prisma error details', {
        code: error.code,
        meta: error.meta,
        clientVersion: error.clientVersion
      });
    }
    
    return NextResponse.json(
      { error: "Failed to create blocked period" },
      { status: 500 }
    );
  }
}