// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { getCacheValue, setCacheValue, deleteCacheKeys } from "@/lib/redis-client";

// Cache TTL in seconds (2 minutes for chat rooms)
const CACHE_TTL = 120;

// Get all chat rooms for the current user
export async function GET(req: NextRequest) {
  try {
    // Use getToken instead of getServerSession for better performance
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = token.id as string;
    
    // Check the cache first
    const cacheKey = `chatRooms:${userId}`;
    const cachedData = await getCacheValue(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
          'X-Source': 'cache'
        }
      });
    }
    
    // OPTIMIZED: Get all data in parallel with better structure
    const [chatRooms, unreadCountsRaw] = await Promise.all([
      // Get all chat rooms with participants and last message in one query
      prisma.chatRoom.findMany({
        where: {
          participants: {
            some: { userId }
          }
        },
        select: {
          id: true,
          name: true,
          updatedAt: true,
          participants: {
            select: {
              userId: true,
              lastRead: true,
              isApproved: true,
              isTrailerOwner: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true
                }
              }
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              message: true,
              createdAt: true,
              read: true,
              attachments: true,
              senderId: true,
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true
                }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 50
      }),
      
      // Use raw query for complex unread count calculation
      prisma.$queryRaw<Array<{
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
      `
    ]);

    if (chatRooms.length === 0) {
      await setCacheValue(cacheKey, [], { ex: CACHE_TTL });
      return NextResponse.json([]);
    }

    // Create unread count map for O(1) lookup
    const unreadCountMap = new Map(
      unreadCountsRaw.map(uc => [uc.chatRoomId, Number(uc.unreadCount)])
    );

    // Format the response
    const formattedRooms = chatRooms.map(room => {
      const currentUserParticipant = room.participants.find(p => p.userId === userId);
      const otherParticipants = room.participants
        .filter(p => p.userId !== userId)
        .map(p => ({
          ...p.user,
          isApproved: p.isApproved,
          isTrailerOwner: p.isTrailerOwner
        }));

      return {
        id: room.id,
        name: room.name,
        participants: otherParticipants,
        lastMessage: room.messages[0] || null,
        unreadCount: unreadCountMap.get(room.id) || 0,
        lastRead: currentUserParticipant?.lastRead || null,
        updatedAt: room.updatedAt,
        isApproved: currentUserParticipant?.isApproved,
        isTrailerOwner: currentUserParticipant?.isTrailerOwner
      };
    });
    
    // Cache the result
    await setCacheValue(cacheKey, formattedRooms, { ex: CACHE_TTL });
    
    return NextResponse.json(formattedRooms, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat rooms' },
      { status: 500 }
    );
  }
}

// Create a new chat room or return existing one between two users
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { otherUserId, initialMessage, trailerId } = await req.json();
    const userId = token.id as string;
    
    if (!otherUserId) {
      return NextResponse.json(
        { error: 'Other user ID is required' },
        { status: 400 }
      );
    }
    
    // Check for existing chat room
    const existingRoomRaw = await prisma.$queryRaw<Array<{ chatRoomId: string }>>`
      SELECT DISTINCT a.chatRoomId
      FROM ChatRoomParticipant a
      INNER JOIN ChatRoomParticipant b ON a.chatRoomId = b.chatRoomId
      WHERE a.userId = ${userId} AND b.userId = ${otherUserId}
      LIMIT 1
    `;
    
    if (existingRoomRaw.length > 0) {
      const roomId = existingRoomRaw[0].chatRoomId;
      
      // Get complete room data
      const existingChatRoom = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
      });
      
      if (!existingChatRoom) {
        throw new Error('Chat room not found');
      }
      
      // Find participant info
      const otherUserParticipant = existingChatRoom.participants.find(p => p.userId === otherUserId);
      const isApproved = otherUserParticipant?.isApproved ?? true;
      
      // If there's an initial message, add it
      if (initialMessage) {
        await prisma.$transaction([
          prisma.chatMessage.create({
            data: {
              message: initialMessage,
              senderId: userId,
              chatRoomId: existingChatRoom.id,
              attachments: trailerId ? JSON.stringify([{ type: 'trailer', id: trailerId }]) : null,
            },
          }),
          prisma.chatRoom.update({
            where: { id: existingChatRoom.id },
            data: { updatedAt: new Date() }
          })
        ]);
        
        // Invalidate cache for both users
        await Promise.all([
          deleteCacheKeys(`chatRooms:${userId}`),
          deleteCacheKeys(`chatRooms:${otherUserId}`),
          deleteCacheKeys(`unread:${otherUserId}`),
          deleteCacheKeys(`messages:${existingChatRoom.id}`),
        ]);
      }
      
      return NextResponse.json({
        chatRoom: {
          ...existingChatRoom,
          isApproved
        },
        created: false,
      });
    }
    
    // Create a new chat room
    const chatRoom = await prisma.$transaction(async (tx) => {
      // Determine if otherUserId is a trailer owner if trailerId is provided
      let isOtherUserTrailerOwner = false;
      
      if (trailerId) {
        const trailer = await tx.trailer.findUnique({
          where: { id: trailerId },
          select: { ownerId: true }
        });
        
        if (trailer && trailer.ownerId === otherUserId) {
          isOtherUserTrailerOwner = true;
        }
      }
      
      // Create the chat room
      const newChatRoom = await tx.chatRoom.create({
        data: {
          participants: {
            create: [
              {
                userId: userId,
                isApproved: true, // Sender is always approved
                isTrailerOwner: false,
              },
              {
                userId: otherUserId,
                isApproved: !isOtherUserTrailerOwner, // Trailer owner must approve
                isTrailerOwner: isOtherUserTrailerOwner,
              },
            ],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
      });
      
      // If there's an initial message, add it
      if (initialMessage) {
        await tx.chatMessage.create({
          data: {
            message: initialMessage,
            senderId: userId,
            chatRoomId: newChatRoom.id,
            attachments: trailerId ? JSON.stringify([{ type: 'trailer', id: trailerId }]) : null,
          },
        });
      }
      
      return newChatRoom;
    });
    
    // Create notification for the other user
    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'CHAT',
        message: `You received a new message`,
        actionUrl: `/chat/${chatRoom.id}`,
      },
    });
    
    // Invalidate cache for both users
    await Promise.all([
      deleteCacheKeys(`chatRooms:${userId}`),
      deleteCacheKeys(`chatRooms:${otherUserId}`),
      deleteCacheKeys(`unread:${otherUserId}`),
    ]);
    
    return NextResponse.json({
      chatRoom,
      created: true,
    });
  } catch (error) {
    console.error('Error creating chat room:', error);
    return NextResponse.json(
      { error: 'Failed to create chat room' },
      { status: 500 }
    );
  }
}