// app/api/chat/unread/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { getCacheValue, setCacheValue } from "@/lib/redis-client";

const CACHE_TTL = 60;

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = token.id as string;
    
    // Check the cache first
    const cacheKey = `unread:${userId}`;
    const cachedData = await getCacheValue(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
          'X-Source': 'cache'
        }
      });
    }
    
    // OPTIMIZED: Use a single raw query for all unread counts
    const unreadCountsRaw = await prisma.$queryRaw<Array<{
      chatRoomId: string;
      unreadCount: bigint;
    }>>`
      SELECT 
        cm.chatRoomId,
        COUNT(*) as unreadCount
      FROM ChatMessage cm
      INNER JOIN ChatRoomParticipant crp ON cm.chatRoomId = crp.chatRoomId
      WHERE crp.userId = ${userId}
        AND cm.senderId != ${userId}
        AND cm.read = 0
        AND (crp.lastRead IS NULL OR cm.createdAt > crp.lastRead)
      GROUP BY cm.chatRoomId
    `;
    
    // Convert bigint to number and format response
    const rooms = unreadCountsRaw.map(item => ({
      chatRoomId: item.chatRoomId,
      unreadCount: Number(item.unreadCount)
    }));
    
    // Calculate total unread count
    const totalUnread = rooms.reduce(
      (sum, room) => sum + room.unreadCount,
      0
    );
    
    const result = {
      total: totalUnread,
      rooms: rooms
    };
    
    // Cache the result
    await setCacheValue(cacheKey, result, { ex: CACHE_TTL });
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        'X-Source': 'database'
      }
    });
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread counts' },
      { status: 500 }
    );
  }
}