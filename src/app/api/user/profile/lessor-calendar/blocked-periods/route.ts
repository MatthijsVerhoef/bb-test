import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    
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
  const startTime = Date.now();
  console.log('POST /blocked-periods - Start');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    
    console.log('Request body:', body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || (user.role !== "LESSOR" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "You need to be a lessor to perform this action" },
        { status: 403 }
      );
    }

    const validatedData = blockedPeriodSchema.parse(body);

    if (validatedData.trailerId) {
      console.log('Checking trailer ownership...');
      const trailer = await prisma.trailer.findFirst({
        where: {
          id: validatedData.trailerId,
          ownerId: userId,
        },
        select: { id: true },
      });

      if (!trailer) {
        return NextResponse.json(
          { error: "Trailer not found or you don't have permission" },
          { status: 404 }
        );
      }
    }

    // IMPORTANT: Handle the dates properly for MySQL
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    
    console.log('Creating blocked period with dates:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startDateLocal: startDate.toString(),
      endDateLocal: endDate.toString(),
    });

    // Create the blocked period - but with a timeout
    const createPromise = prisma.blockedPeriod.create({
      data: {
        startDate,
        endDate,
        reason: validatedData.reason || null, // MySQL prefers null over undefined
        allDay: validatedData.allDay,
        morning: validatedData.morning,
        afternoon: validatedData.afternoon,
        evening: validatedData.evening,
        trailerId: validatedData.trailerId || null, // MySQL prefers null
        userId: userId,
      },
      include: {
        trailer: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Add a timeout to the create operation
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database operation timeout')), 25000)
    );

    const blockedPeriod = await Promise.race([createPromise, timeoutPromise]);
    
    console.log(`Blocked period created in ${Date.now() - startTime}ms`);
    
    return NextResponse.json({ blockedPeriod }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating blocked period:", error);
    console.error('Total time:', Date.now() - startTime);
    
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
    
    return NextResponse.json(
      { error: "Failed to create blocked period" },
      { status: 500 }
    );
  }
}