// app/api/auth/session/route.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getCacheValue, setCacheValue } from "@/lib/redis-client";

// Session cache TTL in seconds (2 minutes)
const SESSION_CACHE_TTL = 120;

export async function GET(request: Request) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    if (!token) {
      return NextResponse.json({ user: null }, {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
        }
      });
    }
    
    // Create cache key from token id
    const cacheKey = `session:${token.id || token.email}`;
    
    // Try to get cached session data
    const cachedSession = await getCacheValue(cacheKey);
    if (cachedSession) {
      return NextResponse.json({ user: cachedSession }, {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
          'X-Source': 'cache'
        }
      });
    }
    
    // If no cached data, fetch from database with minimal fields
    const user = token.id ? await prisma.user.findUnique({
      where: { id: token.id as string },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        role: true,
        isVerified: true,
        memberSince: true,
        city: true,
        country: true,
      },
    }) : null;
    
    // Prepare response data
    const userData = user || {
      id: token.id,
      email: token.email,
      firstName: token.firstName,
      lastName: token.lastName,
      role: token.role,
      isVerified: token.isVerified
    };
    
    // Cache the user data
    await setCacheValue(cacheKey, userData, { ex: SESSION_CACHE_TTL });
    
    return NextResponse.json({ user: userData }, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        'X-Source': 'database'
      }
    });
  } catch (error) {
    console.error("Session route error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}