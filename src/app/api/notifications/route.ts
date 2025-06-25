// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getCacheValue, setCacheValue, findCacheKeys, deleteCacheKeys } from "@/lib/redis-client";

// Cache TTL in seconds (2 minutes for notifications)
const CACHE_TTL = 120;

// GET /api/notifications - Get all notifications for the current user
export async function GET(request: NextRequest) {
  try {
    // Use getToken instead of getServerSession for better performance
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    if (!token?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const userId = token.id as string;
    
    // Get query parameters for pagination
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;
    
    // Create a cache key incorporating pagination parameters
    const cacheKey = `notifications:${userId}:${page}:${limit}`;
    
    // Try to get from cache first
    const cachedData = await getCacheValue(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
          'X-Source': 'cache'
        }
      });
    }
    
    // Run both queries in parallel for better performance
    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId,
          OR: [
            { expiresAt: { gt: new Date() } }, // Only get notifications that haven't expired
            { expiresAt: null }                // Also include notifications with no expiration date
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: {
          userId,
          OR: [
            { expiresAt: { gt: new Date() } },
            { expiresAt: null }
          ],
        },
      })
    ]);
    
    const result = {
      notifications,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        current: page,
        limit,
      },
    };
    
    // Cache the result
    await setCacheValue(cacheKey, result, { ex: CACHE_TTL });
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        'X-Source': 'database'
      }
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification (admin/system only)
export async function POST(request: NextRequest) {
  try {
    // Use getToken instead of getServerSession for better performance
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // Only allow admins or system processes to create notifications
    if (!token?.id || token.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.userId || !body.message || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields: userId, message, and type are required" },
        { status: 400 }
      );
    }
    
    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        userId: body.userId,
        message: body.message,
        type: body.type,
        read: false,
        actionUrl: body.actionUrl,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      },
    });
    
    // Invalidate the cache for this user
    const keys = await findCacheKeys(`notifications:${body.userId}:*`);
    if (keys.length > 0) {
      await deleteCacheKeys(...keys);
    }
    
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}