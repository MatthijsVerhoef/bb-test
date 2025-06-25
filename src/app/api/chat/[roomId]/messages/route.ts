// app/api/chat/[roomId]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    // Await params for Next.js 14/15
    const { roomId } = await params;

    // Check if the user is a participant of this chat room
    const participant = await prisma.chatRoomParticipant.findFirst({
      where: {
        userId: userId,
        chatRoomId: roomId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant of this chat room' },
        { status: 403 }
      );
    }

    // Get messages for this chat room
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatRoomId: roomId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Update the last read timestamp for this user
    await prisma.chatRoomParticipant.update({
      where: {
        chatRoomId_userId: {
          chatRoomId: roomId,
          userId: userId,
        },
      },
      data: {
        lastRead: new Date(),
      },
    });

    // Mark all messages as read
    await prisma.chatMessage.updateMany({
      where: {
        chatRoomId: roomId,
        senderId: {
          not: userId,
        },
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    // Await params for Next.js 14/15
    const { roomId } = await params;
    const body = await req.json();
    const { message, attachments } = body;

    // Check if the user is a participant of this chat room
    const chatRoom = await prisma.chatRoom.findUnique({
      where: {
        id: roomId,
      },
      include: {
        participants: {
          include: {
            user: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          take: 1,
          include: {
            sender: true
          }
        }
      }
    });

    if (!chatRoom) {
      return NextResponse.json(
        { error: 'Chat room not found' },
        { status: 404 }
      );
    }

    // Check if user is a participant
    const participant = chatRoom.participants.find(p => p.user.id === userId);
    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant of this chat room' },
        { status: 403 }
      );
    }

    // Call the status endpoint to check if this chat requires approval
    let needsApproval = false;
    let isApproved = true;
    let isCurrentUserTrailerOwner = false;
    let trailerOwnerId = null;
    
    try {
      // Get the first message to check if this is about a trailer
      const firstMessage = await prisma.chatMessage.findFirst({
        where: { chatRoomId: roomId },
        orderBy: { createdAt: 'asc' }
      });
      
      if (firstMessage && firstMessage.attachments) {
        // Safely parse attachments
        try {
          const parsedAttachments = typeof firstMessage.attachments === 'string' 
            ? JSON.parse(firstMessage.attachments) 
            : firstMessage.attachments;
          
          if (Array.isArray(parsedAttachments)) {
            const trailerAttachment = parsedAttachments.find((a: any) => a.type === 'trailer');
            
            if (trailerAttachment && trailerAttachment.id) {
              const trailerId = trailerAttachment.id;
              
              // Get the trailer owner
              const trailer = await prisma.trailer.findUnique({
                where: { id: trailerId },
                select: { ownerId: true }
              });
              
              if (trailer && trailer.ownerId) {
                trailerOwnerId = trailer.ownerId;
                isCurrentUserTrailerOwner = userId === trailerOwnerId;
                needsApproval = true;
                
                // Only first message is allowed without approval
                const messageCount = await prisma.chatMessage.count({
                  where: { chatRoomId: roomId }
                });
                
                // Check if the trailer owner has sent any messages (which indicates approval)
                const trailerOwnerHasSentMessage = await prisma.chatMessage.findFirst({
                  where: {
                    chatRoomId: roomId,
                    senderId: trailerOwnerId
                  }
                });
                
                // Consider chat approved only if the trailer owner has sent a message
                isApproved = !!trailerOwnerHasSentMessage;
                
                // Special case: Allow the very first message regardless of approval
                const isFirstMessage = messageCount === 0;
                
                // Log for debugging
                console.log('Message sending check:', {
                  roomId, 
                  userId,
                  trailerOwnerId,
                  isCurrentUserTrailerOwner,
                  needsApproval,
                  isApproved,
                  messageCount,
                  isFirstMessage
                });
                
                // Block sending if:
                // 1. This is not the first message AND
                // 2. Current user is not the trailer owner AND 
                // 3. Chat is not approved yet
                if (!isFirstMessage && !isCurrentUserTrailerOwner && !isApproved) {
                  return NextResponse.json(
                    { error: 'This chat requires approval from the trailer owner before you can send more messages' },
                    { status: 403 }
                  );
                }
              }
            }
          }
        } catch (parseError) {
          console.error('Error parsing attachments:', parseError);
          // Continue without approval check if parsing fails
        }
      }
    } catch (error) {
      console.error('Error checking chat approval status:', error);
      // Continue without approval check if parsing fails
    }

    // Create the message
    const newMessage = await prisma.chatMessage.create({
      data: {
        message,
        attachments: attachments || '[]',
        senderId: userId,
        chatRoomId: roomId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
    });

    // Update the last read timestamp for this user
    await prisma.chatRoomParticipant.update({
      where: {
        chatRoomId_userId: {
          chatRoomId: roomId,
          userId: userId,
        },
      },
      data: {
        lastRead: new Date(),
      },
    });

    // Mark all messages as read for this user
    await prisma.chatMessage.updateMany({
      where: {
        chatRoomId: roomId,
        senderId: {
          not: userId,
        },
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}