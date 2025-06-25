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
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Make sure the user has LESSOR role
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

    const body = await req.json();
    const validatedData = blockedPeriodSchema.parse(body);
    
    // If trailerId is provided, verify it belongs to the user
    if (validatedData.trailerId) {
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

    // Create the blocked period
    const blockedPeriod = await prisma.blockedPeriod.create({
      data: {
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        reason: validatedData.reason,
        allDay: validatedData.allDay,
        morning: validatedData.morning,
        afternoon: validatedData.afternoon,
        evening: validatedData.evening,
        trailerId: validatedData.trailerId,
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

    return NextResponse.json({ blockedPeriod }, { status: 201 });
  } catch (error) {
    console.error("Error creating blocked period:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create blocked period" },
      { status: 500 }
    );
  }
}