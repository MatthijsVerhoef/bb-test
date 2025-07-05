import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for platform feedback validation - handles both structured and simple feedback
const platformFeedbackSchema = z.union([
  // Structured feedback (for admin/technical feedback)
  z.object({
    type: z.enum(["BUG_REPORT", "FEATURE_REQUEST", "GENERAL_FEEDBACK", "SECURITY_ISSUE"]),
    subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
    description: z.string().min(10, "Description must be at least 10 characters").max(2000),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
    category: z.string().optional(),
    userAgent: z.string().optional(),
    url: z.string().optional(),
    screenshot: z.string().optional(),
    reproductionSteps: z.string().optional(),
    expectedBehavior: z.string().optional(),
    actualBehavior: z.string().optional(),
  }),
  // Simple feedback (for user satisfaction surveys)
  z.object({
    rating: z.number().min(1).max(5),
    email: z.string().email(),
    improvement: z.string().min(1, "Improvement feedback is required"),
    wouldRentAgain: z.boolean(),
    category: z.string().optional(),
  })
]);

export async function POST(req: NextRequest) {
  try {
    // Check authentication and admin role
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET!
    });
    
    if (!token?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (token.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    console.log("Platform feedback request body:", JSON.stringify(body, null, 2));
    
    const validatedData = platformFeedbackSchema.parse(body);

    // Determine if this is structured or simple feedback
    const isStructuredFeedback = 'type' in validatedData;
    
    // Prepare data based on feedback type
    let feedbackData;
    if (isStructuredFeedback) {
      // Structured feedback
      feedbackData = {
        type: validatedData.type,
        subject: validatedData.subject,
        description: validatedData.description,
        priority: validatedData.priority || "MEDIUM",
        category: validatedData.category,
        status: "OPEN",
        submittedBy: token.id as string,
        userAgent: validatedData.userAgent || req.headers.get("user-agent"),
        url: validatedData.url,
        screenshot: validatedData.screenshot,
        reproductionSteps: validatedData.reproductionSteps,
        expectedBehavior: validatedData.expectedBehavior,
        actualBehavior: validatedData.actualBehavior,
        metadata: {
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
          timestamp: new Date().toISOString(),
          referrer: req.headers.get("referer"),
        },
      };
    } else {
      // Simple feedback - use the correct schema fields
      feedbackData = {
        rating: validatedData.rating,
        email: validatedData.email,
        improvement: validatedData.improvement,
        wouldRentAgain: validatedData.wouldRentAgain,
      };
    }

    // Create platform feedback record
    const feedback = await prisma.platformFeedback.create({
      data: feedbackData,
    });

    // Create notification for other admins (optional)
    if (!isStructuredFeedback && validatedData.rating <= 2) {
      try {
        // Get all admin users except the submitter
        const admins = await prisma.user.findMany({
          where: {
            role: "ADMIN",
            id: { not: token.id as string }
          },
          select: { id: true }
        });

        // Create notifications for admins
        if (admins.length > 0) {
          await prisma.notification.createMany({
            data: admins.map(admin => ({
              userId: admin.id,
              type: "SYSTEM",
              message: `Low rating feedback (${validatedData.rating}/5): ${validatedData.improvement}`,
              actionUrl: `/admin/feedback`,
            }))
          });
        }
      } catch (notificationError) {
        console.error("Failed to create admin notifications:", notificationError);
        // Continue with the response even if notifications fail
      }
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Platform feedback submitted successfully",
        feedback: {
          id: feedback.id,
          rating: feedback.rating,
          improvement: feedback.improvement,
          wouldRentAgain: feedback.wouldRentAgain,
          createdAt: feedback.createdAt,
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error submitting platform feedback:", error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Duplicate feedback submission" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit platform feedback" },
      { status: 500 }
    );
  }
}

// GET handler to retrieve platform feedback (optional)
export async function GET(req: NextRequest) {
  try {
    // Check authentication and admin role
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET!
    });
    
    if (!token?.id || token.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const priority = searchParams.get("priority");

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;

    const [feedback, total] = await Promise.all([
      prisma.platformFeedback.findMany({
        where,
        include: {
          submittedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.platformFeedback.count({ where })
    ]);

    return NextResponse.json({
      feedback,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });

  } catch (error) {
    console.error("Error fetching platform feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform feedback" },
      { status: 500 }
    );
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';